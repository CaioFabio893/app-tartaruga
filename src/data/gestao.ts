import { collection, doc, documentId, getDocFromServer, getDocsFromServer, limit, orderBy, query, runTransaction, serverTimestamp, startAfter, where, type Firestore, type QueryDocumentSnapshot } from 'firebase/firestore'
import { obterBanco } from './acesso'
import { validarEntradaGestao, type ConfigGestao, type EntradaGestao, type GestaoNinho } from '../domain/gestao'
import type { EstadoTreino } from '../app/treino'
import {paraDia} from '../domain/datas'
export type ContextoGestao=NonNullable<EstadoTreino['contexto']>
export interface EstadoGestao {ninhos:Record<string,GestaoNinho>;config:ConfigGestao|null;confirmada:boolean;revisao:number}
export async function conferirRevisoesGestao(c:ContextoGestao,db:Firestore=obterBanco()){
 const p=await getDocFromServer(doc(db,`projetos/${c.projetoId}`)),g=await getDocFromServer(doc(db,`projetos/${c.projetoId}/gestao_estado/revisao`))
 if(p.data()?.ativo!==true)throw new Error('Projeto não confirmado no servidor.')
 return {dados:p.data()!.revisao_dados as number,gestao:g.exists()?g.data().versao as number:0}
}

export async function carregarGestaoNuvem(c:ContextoGestao,db:Firestore=obterBanco()):Promise<EstadoGestao>{
 const refRevisao=doc(db,`projetos/${c.projetoId}/gestao_estado/revisao`),antes=await getDocFromServer(refRevisao),revisao=antes.exists()?antes.data().versao as number:0
 const ninhos:Record<string,GestaoNinho>={};let ultimo:QueryDocumentSnapshot|undefined
 for(;;){const pagina=await getDocsFromServer(query(collection(db,`projetos/${c.projetoId}/gestao`),where('projeto_id','==',c.projetoId),orderBy(documentId()),...ultimo?[startAfter(ultimo)]:[],limit(200)))
  for(const d of pagina.docs)ninhos[d.id]=d.data() as GestaoNinho
  if(Object.keys(ninhos).length>5000)throw new Error('Organização anual excedeu o limite de leitura. Solicite revisão da paginação.')
  if(pagina.size<200)break;ultimo=pagina.docs.at(-1)
 }
 const config=await getDocFromServer(doc(db,`projetos/${c.projetoId}/gestao_config/painel`))
 const depois=await getDocFromServer(refRevisao)
 if((depois.exists()?depois.data().versao:0)!==revisao)throw new Error('Organização anual mudou durante a consulta. Confira novamente antes de exportar.')
 return {ninhos,config:config.exists()?config.data() as ConfigGestao:null,confirmada:true,revisao}
}
/** Ano/número independentes do manual, com reserva e contador na mesma transação. */
export async function salvarGestaoNuvem(c:ContextoGestao,id:string,entrada:EntradaGestao,versaoBase:number|null,db:Firestore=obterBanco()):Promise<GestaoNinho>{
 validarEntradaGestao(entrada)
 if(c.papel==='consulta')throw new Error('Papel de consulta não pode alterar a organização.')
 const raiz=`projetos/${c.projetoId}`,operacao=crypto.randomUUID()
 let resultado:GestaoNinho|undefined
 await runTransaction(db,async tx=>{
  const ref=doc(db,`${raiz}/gestao/${id}`),atual=await tx.get(ref),ninho=await tx.get(doc(db,`${raiz}/ninhos/${id}`)),anoRef=doc(db,`${raiz}/gestao_anos/${entrada.ano}`),ano=await tx.get(anoRef)
  const revisaoRef=doc(db,`${raiz}/gestao_estado/revisao`),revisao=await tx.get(revisaoRef)
  if(!ninho.exists())throw new Error('Ninho não encontrado no servidor. Sincronize a ficha antes de organizar.')
  if((atual.exists()?atual.data().versao:null)!==versaoBase)throw new Error('A organização foi alterada em outro aparelho. Confira os dados antes de salvar; nada foi sobrescrito.')
  const ultimo=ano.exists()?ano.data().ultimo_numero as number:0
  const numero=entrada.numero||String(ultimo+1).padStart(3,'0')
  if(Number(numero)>999999)throw new Error('Numeração anual excedeu seis dígitos. Consulte a coordenação.')
  const reservaRef=doc(db,`${raiz}/gestao_numeros/${entrada.ano}-${numero}`),reserva=await tx.get(reservaRef)
  if(reserva.exists()&&reserva.data().ninho_id!==id)throw new Error(`Ninho ${numero} já reservado no ano ${entrada.ano}.`)
  const novo:GestaoNinho={id,projeto_id:c.projetoId,...entrada,numero,versao:(versaoBase??0)+1,operacao_id:operacao,atualizado_por:c.usuario,confirmado_em:serverTimestamp()}
  tx.set(ref,novo)
  tx.set(revisaoRef,{projeto_id:c.projetoId,versao:(revisao.exists()?revisao.data().versao as number:0)+1,ninho_id:id,operacao_id:operacao})
  tx.set(doc(db,`${raiz}/gestao_auditoria/${operacao}`),{id:operacao,projeto_id:c.projetoId,ninho_id:id,autor:c.usuario,versao:novo.versao,anterior:atual.exists()?atual.data():null,confirmado_em:serverTimestamp()})
  if(!reserva.exists())tx.set(reservaRef,{projeto_id:c.projetoId,ano:entrada.ano,numero,ninho_id:id,operacao_id:operacao})
  if(Number(numero)>ultimo)tx.set(anoRef,{projeto_id:c.projetoId,ano:entrada.ano,ultimo_numero:Number(numero),ninho_id:id,operacao_id:operacao})
  resultado=novo
 })
 return resultado!
}
export async function salvarUsoNuvem(c:ContextoGestao,uso:number,medido:string,versaoBase:number|null,db:Firestore=obterBanco()){
 if(c.papel!=='coordenacao')throw new Error('Somente coordenação informa o uso conferido no console.')
 if(!Number.isFinite(uso)||uso<0)throw new Error('Uso de armazenamento inválido.')
 if(paraDia(medido)===null)throw new Error('Data de medição inválida.')
 const ref=doc(db,`projetos/${c.projetoId}/gestao_config/painel`)
 await runTransaction(db,async tx=>{const atual=await tx.get(ref);if((atual.exists()?atual.data().versao:null)!==versaoBase)throw new Error('Medição alterada por outra sessão. Confira novamente.');tx.set(ref,{projeto_id:c.projetoId,uso_mib:uso,medido_em:medido,versao:(versaoBase??0)+1,atualizado_por:c.usuario,confirmado_em:serverTimestamp()})})
}
