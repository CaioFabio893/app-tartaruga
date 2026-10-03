import type { EstadoTreino } from '../app/treino'

const nome='monitoramento-ninhos-treino-v1'
async function abrirBanco():Promise<IDBDatabase> {
  if(typeof indexedDB==='undefined') throw new Error('Armazenamento local indisponível. O treino não foi salvo.')
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open(nome,1)
    r.onupgradeneeded=()=>{r.result.createObjectStore('estado')}
    r.onsuccess=()=>resolve(r.result)
    r.onerror=()=>reject(new Error('Não foi possível abrir o armazenamento local.'))
    r.onblocked=()=>reject(new Error('Outra aba bloqueou o armazenamento. Feche a outra aba e tente novamente.'))
  })
}
function conferir(d:unknown):asserts d is EstadoTreino {
  if(!d || typeof d!=='object' || !('schema' in d) || d.schema!==1 || !('revisao' in d) || !Number.isSafeInteger(d.revisao) || (d.revisao as number)<0 ||
    !('ocorrencias' in d) || !Array.isArray(d.ocorrencias) || !('ninhos' in d) || !Array.isArray(d.ninhos) ||
    !('transferencias' in d) || !Array.isArray(d.transferencias) || !('aberturas' in d) || !Array.isArray(d.aberturas) ||
    !('visitas' in d) || !Array.isArray(d.visitas) || !('operacoes' in d) || !Array.isArray(d.operacoes)) {
    throw new Error('Dados locais incompatíveis ou corrompidos. Não foram apagados. Preserve o navegador e procure suporte.')
  }
  const e=d as EstadoTreino
  const falha=()=>{throw new Error('Estrutura dos dados locais inválida. Nada foi apagado ou substituído.')}
  for(const lista of [e.ocorrencias,e.ninhos,e.transferencias,e.aberturas,e.visitas]) {
    const ids=new Set<string>()
    for(const r of lista) {
      if(!r||typeof r!=='object'||typeof r.id!=='string'||!r.id||r.projetoId!=='projeto-demo'||!Number.isSafeInteger(r.versao)||r.versao<1||ids.has(r.id))falha()
      ids.add(r.id)
    }
  }
  for(const o of e.ocorrencias) {
    if(!o.localOrigem||typeof o.localOrigem!=='object')falha()
    for(const v of [o.localOrigem.latitude,o.localOrigem.longitude,o.localOrigem.precisaoGpsM])if(v!==null&&(typeof v!=='number'||!Number.isFinite(v)))falha()
    if(o.ninhoId!==null&&!e.ninhos.some(n=>n.id===o.ninhoId&&n.ocorrenciaId===o.id))falha()
  }
  for(const n of e.ninhos)if(!e.ocorrencias.some(o=>o.id===n.ocorrenciaId&&o.tipoOcorrencia==='CD'))falha()
  for(const r of [...e.transferencias,...e.aberturas,...e.visitas])if(!e.ninhos.some(n=>n.id===r.ninhoId))falha()
  for(const t of e.transferencias) {
    if(!t.localDestino||typeof t.localDestino!=='object')falha()
    for(const v of [t.localDestino.latitude,t.localDestino.longitude,t.localDestino.precisaoGpsM])if(v!==null&&(typeof v!=='number'||!Number.isFinite(v)))falha()
  }
  if(e.revisao!==e.operacoes.length)falha()
  const operacoes=new Set<string>()
  e.operacoes.forEach((o,i)=>{if(!o||typeof o.id!=='string'||!o.id||operacoes.has(o.id)||o.baseRevisao!==i||o.estado!=='local-sem-sincronizacao')falha();operacoes.add(o.id)})
}
export async function lerTreino():Promise<EstadoTreino|null> {
  const db=await abrirBanco()
  try { return await new Promise((resolve,reject)=>{
    const tx=db.transaction('estado','readonly'); const r=tx.objectStore('estado').get('atual')
    r.onsuccess=()=>{try {if(r.result===undefined) resolve(null);else {conferir(r.result);resolve(r.result)}} catch(e){reject(e)}}
    r.onerror=()=>reject(new Error('Falha na leitura local. Nenhum dado foi apagado.'))
  }) } finally {db.close()}
}
/** Revisão compare-and-swap e auditoria no mesmo registro/transaction; sem last-write-wins. */
export async function salvarTreino(proximo:EstadoTreino,baseRevisao:number|null):Promise<void> {
  conferir(proximo)
  const db=await abrirBanco()
  try { await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction('estado','readwrite'); const store=tx.objectStore('estado');const r=store.get('atual')
    let problema:unknown=null
    r.onsuccess=()=>{
      try {
        const atual=r.result as unknown
        if(atual!==undefined) conferir(atual)
        const revisao=atual===undefined?null:(atual as EstadoTreino).revisao
        if(revisao!==baseRevisao) throw new Error('Conflito entre abas: o treino foi alterado em outra aba. Seu formulário foi preservado. Abra outra aba para conferir os dados antes de refazer a alteração.')
        if(baseRevisao!==null && (proximo.revisao<=baseRevisao || proximo.revisao-baseRevisao !== proximo.operacoes.length-(atual as EstadoTreino).operacoes.length)) throw new Error('Revisão local inválida. Nada foi salvo.')
        store.put(proximo,'atual')
      } catch(e) {problema=e;tx.abort()}
    }
    tx.oncomplete=()=>resolve()
    tx.onabort=()=>reject(problema??new Error('Não foi possível salvar no aparelho. Verifique espaço disponível; o formulário foi preservado.'))
    tx.onerror=()=>{problema??=new Error('Falha no armazenamento local. O formulário foi preservado.')}
  }) } finally {db.close()}
}
