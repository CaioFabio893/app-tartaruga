import type { EstadoTreino } from '../app/treino'
export interface CacheProjeto { schema:1; base:EstadoTreino; pendente:EstadoTreino|null; erro:string|null }
const chave=(p:string,u:string)=>`${p}:${u}`
async function banco():Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{const r=indexedDB.open('ninhos-projetos-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('projetos');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('Armazenamento de pendências indisponível. Formulário preservado.'));r.onblocked=()=>reject(new Error('Outra aba bloqueou o armazenamento de pendências.'))})
}
function conferir(v:unknown,p:string,u:string):asserts v is CacheProjeto {
  const c=v as CacheProjeto
  if(!c||c.schema!==1||c.base?.contexto?.projetoId!==p||c.base.contexto.usuario!==u||!Number.isSafeInteger(c.base.contexto.revisaoServidor)||!Array.isArray(c.base.ninhos)||!Array.isArray(c.base.ocorrencias)||!Array.isArray(c.base.operacoes)||c.pendente&&JSON.stringify(c.pendente.contexto)!==JSON.stringify(c.base.contexto))throw new Error('Cache incompatível. Nada foi apagado; preserve a cópia e procure suporte.')
  for(const e of [c.base,...c.pendente?[c.pendente]:[]])for(const lista of [e.ocorrencias,e.ninhos,e.transferencias,e.aberturas,e.visitas]) {
    if(!Array.isArray(lista)||lista.some(d=>!d||typeof d.id!=='string'||d.projetoId!==p||!Number.isSafeInteger(d.versao)||d.versao<1)||new Set(lista.map(d=>d.id)).size!==lista.length)throw new Error('Estrutura do cache inválida. Nada foi apagado.')
  }
}
export async function lerArquivados(p:string,u:string):Promise<CacheProjeto[]> {
  const db=await banco(),prefixo=`arquivo:${chave(p,u)}:`
  try{return await new Promise((resolve,reject)=>{const r=db.transaction('projetos').objectStore('projetos').getAll(IDBKeyRange.bound(prefixo,prefixo+'\uffff'));r.onsuccess=()=>{try{for(const c of r.result)conferir(c,p,u);resolve(r.result)}catch(e){reject(e)}};r.onerror=()=>reject(r.error)})}finally{db.close()}
}
export async function lerCacheProjeto(p:string,u:string):Promise<CacheProjeto|null> {
  const db=await banco();try{return await new Promise((resolve,reject)=>{const r=db.transaction('projetos').objectStore('projetos').get(chave(p,u));r.onsuccess=()=>{try{if(r.result===undefined)return resolve(null);conferir(r.result,p,u);resolve(r.result)}catch(e){reject(e)}};r.onerror=()=>reject(r.error)})}finally{db.close()}
}
/** Compare-and-swap local: uma pendência por vez, sem perder a operação de outra aba. */
export async function atualizarCache(base:EstadoTreino,mudar:(atual:CacheProjeto|null)=>CacheProjeto,arquivar=false):Promise<void> {
  const c=base.contexto!;const db=await banco()
  try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('projetos','readwrite'),s=tx.objectStore('projetos'),r=s.get(chave(c.projetoId,c.usuario));let erro:unknown
    r.onsuccess=()=>{try{const atual=r.result??null;if(atual)conferir(atual,c.projetoId,c.usuario);const novo=mudar(atual);conferir(novo,c.projetoId,c.usuario);if(arquivar&&atual?.pendente)s.put(atual,`arquivo:${chave(c.projetoId,c.usuario)}:${atual.pendente.operacoes.at(-1)?.id}`);s.put(novo,chave(c.projetoId,c.usuario))}catch(e){erro=e;tx.abort()}}
    tx.oncomplete=()=>resolve();tx.onabort=()=>reject(erro??new Error('Falha ao preservar pendência. Formulário mantido.'));tx.onerror=()=>{erro??=tx.error}
  })}finally{db.close()}
}
