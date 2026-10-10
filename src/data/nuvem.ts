import { collection, doc, documentId, getDocFromServer, getDocsFromServer, limit, orderBy, query, runTransaction, startAfter, where, serverTimestamp, type DocumentData, type QueryDocumentSnapshot, type QueryConstraint, type Firestore } from 'firebase/firestore'
import { obterBanco } from './acesso'
import { aberturaParaDoc, docParaAbertura, docParaNinho, docParaOcorrencia, docParaTransferencia, docParaVisita, ninhoParaDoc, ocorrenciaParaDoc, transferenciaParaDoc, visitaParaDoc } from '../domain/persistencia'
import type { EstadoTreino } from '../app/treino'
import { descreverConsultaRelatorio, type EntradaConsulta } from '../domain/consultas'
import { montarRelatorio } from '../report/relatorio'

export type Contexto=NonNullable<EstadoTreino['contexto']>
/** Paginação integral explícita; não confundir uma primeira página com conjunto completo. */
async function lerColecao(caminho:string,db:Firestore=obterBanco(),restricoes:QueryConstraint[]=[]):Promise<DocumentData[]> {
  const ref=collection(db,caminho);let ultimo:QueryDocumentSnapshot|undefined;const dados:DocumentData[]=[]
  for(;;){const q=query(ref,where('projeto_id','==',caminho.split('/')[1]),...(caminho.split('/').length>4?[where('ninho_id','==',caminho.split('/')[3])]:[]),...restricoes,orderBy(documentId()),...(ultimo?[startAfter(ultimo)]:[]),limit(200));const pagina=await getDocsFromServer(q);dados.push(...pagina.docs.map(d=>d.data()));if(dados.length>5000)throw new Error('Limite de leitura de 5.000 registros excedido. Nenhum conjunto incompleto foi apresentado como confirmado.');if(pagina.size<200)return dados;ultimo=pagina.docs.at(-1)!}
}
export async function carregarNuvem(contexto:Contexto,db:Firestore=obterBanco()):Promise<EstadoTreino> {
  const raiz=`projetos/${contexto.projetoId}`
  for(let tentativa=0;tentativa<3;tentativa++) {
    const inicio=await getDocFromServer(doc(db,raiz));const p=inicio.data();if(!p||p.ativo!==true||!Number.isSafeInteger(p.revisao_dados))throw new Error('Projeto não confirmado no servidor.')
    const [os,ns]=await Promise.all([lerColecao(`${raiz}/ocorrencias`,db),lerColecao(`${raiz}/ninhos`,db)])
    const filhos=await Promise.all(ns.map(async n=>{const base=`${raiz}/ninhos/${n.id}`;return Promise.all([lerColecao(`${base}/transferencias`,db),lerColecao(`${base}/aberturas`,db),lerColecao(`${base}/visitas`,db)])}))
    const fim=await getDocFromServer(doc(db,raiz));if(fim.data()?.revisao_dados!==p.revisao_dados)continue
    return {schema:1,revisao:0,operacoes:[],contexto:{...contexto,revisaoServidor:p.revisao_dados},ocorrencias:os.map(docParaOcorrencia),ninhos:ns.map(docParaNinho),transferencias:filhos.flatMap(x=>x[0]).map(docParaTransferencia),aberturas:filhos.flatMap(x=>x[1]).map(docParaAbertura),visitas:filhos.flatMap(x=>x[2]).map(docParaVisita)}
  }
  throw new Error('A equipe está atualizando o projeto. Confira novamente; nenhum rascunho foi alterado.')
}
/** Preparação é reutilizável nos testes; nunca escreve um snapshot inteiro sobre o projeto. */
export function prepararGravacao(base:EstadoTreino,proximo:EstadoTreino) {
  const c=base.contexto;if(!c||c.papel==='consulta'||JSON.stringify(proximo.contexto)!==JSON.stringify(c))throw new Error('Sem autorização de gravação.')
  if(proximo.revisao<=base.revisao||proximo.operacoes.length-proximo.revisao!==base.operacoes.length-base.revisao)throw new Error('Operação inválida.')
  const novas=proximo.operacoes.slice(base.operacoes.length);if(!novas.length||novas.length>2||novas.some(o=>!o.id||o.estado!=='local-sem-sincronizacao'))throw new Error('Operação inválida.')
  const operationId=novas[0]!.id,raiz=`projetos/${c.projetoId}`,alteracoes:{caminho:string;anterior:DocumentData|null;dados:DocumentData}[]=[]
  const listas=[['ocorrencias',base.ocorrencias,proximo.ocorrencias,ocorrenciaParaDoc],['ninhos',base.ninhos,proximo.ninhos,ninhoParaDoc],['transferencias',base.transferencias,proximo.transferencias,transferenciaParaDoc],['aberturas',base.aberturas,proximo.aberturas,aberturaParaDoc],['visitas',base.visitas,proximo.visitas,visitaParaDoc]] as const
  for(const [nome,antes,depois,mapear] of listas) {
    if(antes.some(a=>!depois.some(d=>d.id===a.id)))throw new Error('Não é permitido apagar registros.')
    for(const d of depois) {
      const anterior=antes.find(a=>a.id===d.id);if(JSON.stringify(d)===JSON.stringify(anterior))continue
      if(d.projetoId!==c.projetoId||d.atualizadoPor!==c.usuario||d.versao!==(anterior?.versao??0)+1)throw new Error('Autoria ou versão inválida.')
      if(novas[0]!.tipo!=='cadastro'&&nome==='ocorrencias'&&anterior && 'localOrigem' in d && 'localOrigem' in anterior && JSON.stringify(d.localOrigem)!==JSON.stringify(anterior.localOrigem))throw new Error('Localização original é imutável.')
      // União correlacionada de listas/mapeadores, validada pelo discriminador acima.
      const dados=(mapear as (v:typeof d)=>DocumentData)(d)
      if(nome==='ninhos'&&!anterior)dados.transferencia_inicial_id=proximo.transferencias.find(t=>t.ninhoId===d.id)?.id??null
      const anteriorDoc=anterior?(mapear as (v:typeof anterior)=>DocumentData)(anterior):null
      const caminho=nome!=='ocorrencias' && 'ninhoId' in d?`${raiz}/ninhos/${d.ninhoId}/${nome}/${d.id}`:`${raiz}/${nome}/${d.id}`
      alteracoes.push({caminho,anterior:anteriorDoc,dados:{...dados,operacao_id:operationId}})
    }
  }
  if(!alteracoes.length||alteracoes.length>5)throw new Error('Conjunto de alterações inválido.')
  // Valida vínculos, datas, contagens e códigos antes de qualquer envio.
  montarRelatorio({projetoNome:c.nome,dados:proximo.ninhos.map(n=>({ninho:n,ocorrencia:proximo.ocorrencias.find(o=>o.id===n.ocorrenciaId)??null,transferencias:proximo.transferencias.filter(t=>t.ninhoId===n.id),aberturas:proximo.aberturas.filter(a=>a.ninhoId===n.id),visitas:proximo.visitas.filter(v=>v.ninhoId===n.id)})),consulta:{projetoId:c.projetoId,criterio:'OCORR',inicio:'0001-01-01',fim:'9999-12-31',filtros:{}},fonte:{demonstracao:false,online:true,sincronizacaoConfirmada:false,conjuntoCompleto:true},geradoEm:new Date().toISOString()})
  const projecoes: {caminho:string;dados:DocumentData}[]=[]
  for(const a of alteracoes.filter(x=>x.caminho.startsWith(`${raiz}/ninhos/`) && x.caminho.split('/').length===4)) {
    const n=proximo.ninhos.find(x=>x.id===a.dados.id)!,o=proximo.ocorrencias.find(x=>x.id===n.ocorrenciaId)!,b=proximo.aberturas.find(x=>x.ninhoId===n.id)
    const datas:Record<string,string|null>={},ambiguas:Record<string,boolean>={}
    for(const criterio of ['OCORR','ECLOS','ABERT'] as const) {
      const campo=criterio==='OCORR'?o.dataOcorrencia:criterio==='ECLOS'?b?.dataEclosao??null:b?.dataAbertura??null
      const noite=criterio==='OCORR'?campo:criterio==='ECLOS'?b?.noiteReferenciaEclosao??null:b?.noiteReferenciaAbertura??null
      ambiguas[criterio]=campo!==null && noite!==null && campo!==noite
      datas[criterio]=ambiguas[criterio]?null:campo??noite
    }
    projecoes.push({caminho:`${raiz}/consultas/${n.id}`,dados:{id:n.id,projeto_id:c.projetoId,datas,ambiguas,projeto_versao_ref:n.versao,projecao_versao:2,operacao_id:operationId,praia_codigo:o.localOrigem.praiaCodigo,especie_codigo:o.especieCodigo,temporada_id:n.temporadaId,situacao:n.situacao,historico_ninho:n.historicoNinho,tipo_registro:o.tipoRegistro}})
  }

  const reservas:{caminho:string;dados:DocumentData}[]=[]
  for(const a of alteracoes.filter(x=>x.anterior===null||x.caminho.split('/')[2]==='ocorrencias'&&x.dados.numero_registro!==null&&(x.anterior.numero_registro!==x.dados.numero_registro||x.anterior.temporada_id!==x.dados.temporada_id)||x.caminho.includes('/transferencias/')&&(x.anterior.numero_ninho_cercado!==x.dados.numero_ninho_cercado||x.anterior.cercado_id!==x.dados.cercado_id))) {
    const d=a.dados,tipo=a.caminho.split('/')[2]==='ocorrencias'?'N_REGISTRO':a.caminho.includes('/transferencias/') && d.destino==='CERCADO'?'N_NINHO':null
    const numero=tipo==='N_REGISTRO'?d.numero_registro:tipo==='N_NINHO'?d.numero_ninho_cercado:null
    if(numero==null)continue
    const escopo=tipo==='N_REGISTRO'?d.temporada_id??'-':d.cercado_id
    if(typeof numero!=='string'||!numero.trim()||/[/#\\]/.test(numero)||typeof escopo!=='string'||/[/#\\]/.test(escopo))throw new Error(tipo+': Número ou escopo de reserva inválido. Preserve o número atribuído pela coordenação.')
    reservas.push({caminho:`${raiz}/reservas/${tipo}:${escopo}/numeros/${numero}`,dados:{projeto_id:c.projetoId,tipo_numero:tipo,escopo,numero,documento_alvo:a.caminho,operacao_id:operationId,criado_em:d.criado_em,ocorrencia_id:tipo==='N_REGISTRO'?d.id:null,ninho_id:tipo==='N_NINHO'?d.ninho_id:null,transferencia_id:tipo==='N_NINHO'?d.id:null}})
  }
  const motivo=(novas[0]!.payload as {motivo?:string}).motivo?.trim()
  if(novas[0]!.tipo==='cadastro'&&!motivo)throw new Error('Motivo da correção obrigatório.')
  return {motivo,operationId,tipo:novas[0]!.tipo,referenciaId:alteracoes.find(a=>a.caminho.includes('/'+(['ocorrencia','animal','cadastro'].includes(novas[0]!.tipo)?'ocorrencias':novas[0]!.tipo==='transferencia'?'transferencias':novas[0]!.tipo==='abertura'?'aberturas':'visitas')+'/'))!.dados.id as string,alteracoes,projecoes,reservas,raiz,autor:c.usuario,baseRevisao:c.revisaoServidor}
}
export async function gravarNuvem(base:EstadoTreino,proximo:EstadoTreino,db:Firestore=obterBanco()):Promise<void> {
  const plano=prepararGravacao(base,proximo);const projeto=doc(db,plano.raiz),operacao=doc(db,`${plano.raiz}/operacoes/${plano.operationId}`)
  await runTransaction(db,async tx=>{
    const [p,o]=await Promise.all([tx.get(projeto),tx.get(operacao)])
    const hash=JSON.stringify(plano.alteracoes)
    if(o.exists()){if(o.data().autor!==plano.autor||o.data().conteudo!==hash)throw new Error('Identificador de operação já usado para outro conteúdo.');return}
    if(p.data()?.revisao_dados!==plano.baseRevisao)throw new Error('Conflito entre aparelhos: outro aparelho ou aba alterou o projeto. Seu formulário foi preservado. Confira os dados antes de refazer a alteração.')
    const extras=[...plano.projecoes,...plano.reservas]
    const existentes=await Promise.all(plano.alteracoes.map(a=>tx.get(doc(db,a.caminho))))
    const extrasAntes=await Promise.all(extras.map(a=>tx.get(doc(db,a.caminho))))
    for(let i=plano.projecoes.length;i<extrasAntes.length;i++)if(extrasAntes[i]!.exists()&&extrasAntes[i]!.data()?.documento_alvo!==extras[i]!.dados.documento_alvo)throw new Error(String(extras[i]!.dados.tipo_numero)+': Número já reservado para outro registro. Nenhum dado foi substituído.')
    existentes.forEach((s,i)=>{if((s.data()?.versao??null)!==(plano.alteracoes[i]!.anterior?.versao??null))throw new Error('Versão do registro mudou. Rascunho preservado.')})
    tx.set(operacao,{...(plano.motivo?{motivo:plano.motivo}:{}),id:plano.operationId,projeto_id:base.contexto!.projetoId,autor:plano.autor,tipo:plano.tipo,referencia_id:plano.referenciaId,revisao:plano.baseRevisao+1,conteudo:hash,caminhos:[...plano.alteracoes,...extras].map(a=>a.caminho),anteriores:Object.fromEntries([...existentes.map((s,i)=>[plano.alteracoes[i]!.caminho,s.data()??null]),...extrasAntes.map((s,i)=>[extras[i]!.caminho,s.data()??null])]),criado_em:new Date().toISOString(),confirmado_em:serverTimestamp()})
    plano.alteracoes.forEach((a,i)=>tx.set(doc(db,a.caminho),a.caminho.split('/').length===4&&a.caminho.includes('/ninhos/')&&existentes[i]!.exists()?{...a.dados,transferencia_inicial_id:existentes[i]!.data()!.transferencia_inicial_id}:a.dados))
    extras.forEach((a,i)=>{if(i<plano.projecoes.length||!extrasAntes[i]!.exists())tx.set(doc(db,a.caminho),a.dados)})
    tx.update(projeto,{revisao_dados:plano.baseRevisao+1,ultima_operacao:plano.operationId})
  })
}

/** Intervalo inclusive no servidor; detalhes só para ninhos selecionados. */
export async function consultarRelatorioNuvem(contexto:Contexto,consulta:EntradaConsulta,db:Firestore=obterBanco()) {
  const validacao=descreverConsultaRelatorio(consulta)
  if(!validacao.ok)throw new Error(validacao.erros.join('; '))
  if(consulta.projetoId!==contexto.projetoId)throw new Error('Consulta fora do projeto autorizado.')
  const raiz=`projetos/${contexto.projetoId}`
  const corresponde=(d:DocumentData)=>Object.entries(consulta.filtros??{}).every(([k,v])=>v==null||v===''||d[({praiaCodigo:'praia_codigo',especieCodigo:'especie_codigo',temporadaId:'temporada_id',situacao:'situacao',historicoNinho:'historico_ninho',natureza:'tipo_registro'} as Record<string,string>)[k]!]===v)
  for(let tentativa=0;tentativa<3;tentativa++) {
    const antes=(await getDocFromServer(doc(db,raiz))).data()
    if(antes?.ativo!==true)throw new Error('Projeto indisponível.')
    const campo=`datas.${consulta.criterio}`
    const [periodo,ausentes]=consulta.todos ? [await lerColecao(`${raiz}/consultas`,db), []] : await Promise.all([
      lerColecao(`${raiz}/consultas`,db,[where(campo,'>=',consulta.inicio),where(campo,'<=',consulta.fim),orderBy(campo)]),
      lerColecao(`${raiz}/consultas`,db,[where(campo,'==',null)])])
    const linhas=[...periodo,...ausentes].filter(corresponde)
    if(linhas.length>5000)throw new Error('Mais de 5.000 fichas no escopo. Reduza o período ou os filtros; não foi emitido relatório incompleto.')
    const detalhes=await Promise.all(linhas.map(async l=>{
      const n=(await getDocFromServer(doc(db,`${raiz}/ninhos/${l.id}`))).data()
      if(!n||n.versao!==l.projeto_versao_ref||n.operacao_id!==l.operacao_id)throw new Error('Projeção divergente da origem. Conferência necessária antes do relatório.')
      const o=(await getDocFromServer(doc(db,`${raiz}/ocorrencias/${n.ocorrencia_id}`))).data()
      if(!o)throw new Error('Origem ausente no servidor.')
      const base=`${raiz}/ninhos/${n.id}`
      const [ts,as,vs]=await Promise.all([lerColecao(`${base}/transferencias`,db),lerColecao(`${base}/aberturas`,db),lerColecao(`${base}/visitas`,db)])
      return {ninho:docParaNinho(n),ocorrencia:docParaOcorrencia(o),transferencias:ts.map(docParaTransferencia),aberturas:as.map(docParaAbertura),visitas:vs.map(docParaVisita)}
    }))
    const depois=(await getDocFromServer(doc(db,raiz))).data()
    if(antes.revisao_dados!==depois?.revisao_dados)continue
    const r=montarRelatorio({projetoNome:contexto.nome,consulta,dados:detalhes,fonte:{demonstracao:false,online:true,sincronizacaoConfirmada:true,conjuntoCompleto:true},geradoEm:new Date().toISOString()})
    if(consulta.todos&&r.exclusoes)r.exclusoes.outrosFiltros=periodo.length-linhas.length
    // Fora do período não foi enumerado: não apresentar uma contagem global inventada.
    if (!consulta.todos) r.avisos.push(`Consulta por período no servidor. Sem data: ${r.exclusoes?.dataAusente??0}; datas divergentes: ${r.exclusoes?.dataAmbigua??0}, no mesmo projeto e filtros. Registros fora do período não foram contados.`)
    if(!consulta.todos && r.exclusoes)r.exclusoes={...r.exclusoes,foraPeriodo:null,outrosFiltros:null}
    return r
  }
  throw new Error('Dados mudaram durante a consulta. Gere a prévia novamente; nenhum PDF definitivo foi emitido.')
}
