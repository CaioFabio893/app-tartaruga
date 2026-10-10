import {doc,getDocFromServer,runTransaction,serverTimestamp,type DocumentData,type Firestore} from 'firebase/firestore'
import {obterBanco} from './acesso'
import {carregarNuvem,type Contexto} from './nuvem'
import {carregarGestaoNuvem} from './gestao'
import {fichasDoTreino} from '../app/treino'
import {montarRelatorio,type Relatorio} from '../report/relatorio'
import {aplicarAno} from '../domain/gestao'
import {paraDia} from '../domain/datas'

export interface SelecaoExclusao {ano:string;inicio:string;fim:string;modo:'ano'|'periodo'|'ninho';ninhoId?:string}
export interface PlanoExclusao {projeto:string;revisao:number;revisaoGestao:number;relatorio:Relatorio;selecao:SelecaoExclusao;grupos:{id:string;documentos:{caminho:string;dados:DocumentData}[]}[]}
export async function prepararExclusao(c:Contexto,s:SelecaoExclusao,db:Firestore=obterBanco()):Promise<PlanoExclusao>{
 if(c.papel!=='coordenacao')throw new Error('Exclusão restrita à coordenação.')
 if(s.modo==='ano'&&!/^\d{4}$/.test(s.ano))throw new Error('Escolha um ano definido para excluir.')
 if(s.modo==='periodo'&&(paraDia(s.inicio)===null||paraDia(s.fim)===null||s.inicio>s.fim))throw new Error('Período inválido.')
 if(s.modo==='ninho'&&!s.ninhoId?.trim())throw new Error('Escolha o ninho a excluir.')
 const e=await carregarNuvem(c,db),g=await carregarGestaoNuvem(c,db)
 const r=aplicarAno(montarRelatorio({projetoNome:c.nome,dados:fichasDoTreino(e),consulta:{projetoId:c.projetoId,todos:s.modo!=='periodo',criterio:'OCORR',inicio:s.inicio,fim:s.fim},fonte:{demonstracao:false,online:true,sincronizacaoConfirmada:true,conjuntoCompleto:true},geradoEm:new Date().toISOString()}),g.ninhos,s.modo==='ano'?s.ano:'todos',true)
 if(s.modo==='ninho'){r.registros=r.registros.filter(n=>n.ficha.ninho.id===s.ninhoId);if(r.registros.length!==1)throw new Error('Ninho não encontrado. Confira os dados no servidor.')}
 const grupos:PlanoExclusao['grupos']=[],raiz=`projetos/${c.projetoId}`
 for(const n of r.registros){const id=n.ficha.ninho.id,caminhos=[`${raiz}/ocorrencias/${n.origem.ocorrencia!.id}`,`${raiz}/ninhos/${id}`,`${raiz}/consultas/${id}`,...g.ninhos[id]?[`${raiz}/gestao/${id}`]:[],...n.origem.transferencias.map(t=>`${raiz}/ninhos/${id}/transferencias/${t.id}`),...n.origem.aberturas.map(a=>`${raiz}/ninhos/${id}/aberturas/${a.id}`),...(n.origem.visitas??[]).map(v=>`${raiz}/ninhos/${id}/visitas/${v.id}`)]
  if(caminhos.length>200)throw new Error('Um ninho excede 200 documentos. Exclusão bloqueada; solicite revisão do procedimento.')
  const documentos=[];for(const caminho of caminhos){const d=await getDocFromServer(doc(db,caminho));if(!d.exists())throw new Error('Dados mudaram durante a preparação. Confira novamente.');documentos.push({caminho,dados:d.data()})}grupos.push({id,documentos})
 }
 const p=await getDocFromServer(doc(db,raiz)),m=await getDocFromServer(doc(db,`${raiz}/gestao_estado/revisao`))
 if(p.data()?.revisao_dados!==e.contexto!.revisaoServidor||(m.exists()?m.data().versao:0)!==g.revisao)throw new Error('Projeto mudou durante o backup. Prepare novamente.')
 return {projeto:c.projetoId,revisao:e.contexto!.revisaoServidor,revisaoGestao:g.revisao,relatorio:r,selecao:{...s},grupos}
}
export async function sha256(bytes:Uint8Array){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(bytes)))].map(b=>b.toString(16).padStart(2,'0')).join('')}
/** Um ninho por transação; recibos/auditoria/reservas ficam preservados. */
export async function executarExclusao(c:Contexto,p:PlanoExclusao,pdfHash:string,jsonHash:string,motivo:string,progresso:(n:number)=>void,db:Firestore=obterBanco()){
 if(c.papel!=='coordenacao'||c.projetoId!==p.projeto||!motivo.trim()||![pdfHash,jsonHash].every(h=>/^[a-f0-9]{64}$/.test(h)))throw new Error('Confirmação e backups inválidos.')
 let removidos=0
 for(const grupo of p.grupos){const id=crypto.randomUUID(),raiz=`projetos/${p.projeto}`,recibo=doc(db,`${raiz}/exclusoes/${id}`)
  await runTransaction(db,async tx=>{const ref=doc(db,raiz),metaRef=doc(db,`${raiz}/gestao_estado/revisao`),projeto=await tx.get(ref),meta=await tx.get(metaRef)
   if(projeto.data()?.revisao_dados!==p.revisao+removidos||(meta.exists()?meta.data().versao:0)!==p.revisaoGestao+removidos)throw new Error(`Projeto mudou. ${removidos} ninhos removidos; prepare novos backups dos restantes.`)
   for(const d of grupo.documentos){const atual=await tx.get(doc(db,d.caminho));if(!atual.exists()||JSON.stringify(atual.data())!==JSON.stringify(d.dados))throw new Error('Um documento mudou após o backup. Exclusão bloqueada.')}
   tx.set(recibo,{id,projeto_id:p.projeto,autor:c.usuario,ninho_id:grupo.id,caminhos:grupo.documentos.map(d=>d.caminho),pdf_sha256:pdfHash,json_sha256:jsonHash,motivo:motivo.trim(),escopo:JSON.stringify(p.selecao),revisao_base:p.revisao+removidos,confirmado_em:serverTimestamp()})
   tx.update(ref,{revisao_dados:p.revisao+removidos+1,exclusao_ativa:id})
   tx.set(metaRef,{projeto_id:p.projeto,versao:p.revisaoGestao+removidos+1,ninho_id:grupo.id,operacao_id:id})
   for(const d of grupo.documentos)tx.delete(doc(db,d.caminho))
  });removidos++;progresso(removidos)
 }
 return removidos
}
