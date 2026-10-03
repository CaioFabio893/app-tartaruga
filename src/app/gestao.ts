import type { EstadoTreino } from './treino'
import type { EntradaGestao, GestaoNinho } from '../domain/gestao'
import { validarEntradaGestao } from '../domain/gestao'
import type { EstadoGestao } from '../data/gestao'
const chave=(e:EstadoTreino)=>e.contexto?`${e.contexto.projetoId}:${e.contexto.usuario}`:'treino-local'
async function banco():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open('ninhos-gestao-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('gestao');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('Cópia local da organização indisponível.'));r.onblocked=()=>reject(new Error('Outra aba bloqueou a organização local.'))})}
function conferir(v:unknown):asserts v is EstadoGestao {const e=v as EstadoGestao;if(!e||!e.ninhos||typeof e.ninhos!=='object'||typeof e.confirmada!=='boolean'||!Number.isSafeInteger(e.revisao)||e.revisao<0)throw new Error('Cópia da organização inválida; não foi apagada.');for(const n of Object.values(e.ninhos)){validarEntradaGestao(n);if(!Number.isInteger(n.versao)||n.versao<1)throw new Error('Versão da organização local inválida.')}}
export async function lerGestaoLocal(e:EstadoTreino):Promise<EstadoGestao>{const db=await banco();try{return await new Promise((resolve,reject)=>{const r=db.transaction('gestao').objectStore('gestao').get(chave(e));r.onsuccess=()=>{try{if(r.result===undefined)return resolve({ninhos:{},config:null,confirmada:false,revisao:0});conferir(r.result);resolve({...r.result,confirmada:false})}catch(e){reject(e)}};r.onerror=()=>reject(r.error)})}finally{db.close()}}
async function gravarLocal(e:EstadoTreino,mudar:(atual:EstadoGestao)=>EstadoGestao){const db=await banco();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('gestao','readwrite'),s=tx.objectStore('gestao'),r=s.get(chave(e));let erro:unknown;r.onsuccess=()=>{try{const atual=r.result??{ninhos:{},config:null,confirmada:false,revisao:0};conferir(atual);const novo=mudar(atual);conferir(novo);s.put(novo,chave(e))}catch(e){erro=e;tx.abort()}};tx.oncomplete=()=>resolve();tx.onabort=()=>reject(erro??tx.error);tx.onerror=()=>{erro??=tx.error}})}finally{db.close()}}
export async function carregarGestao(e:EstadoTreino):Promise<EstadoGestao>{
 if(!e.contexto||!navigator.onLine)return lerGestaoLocal(e)
 const {carregarGestaoNuvem}=await import('../data/gestao'),novo=await carregarGestaoNuvem(e.contexto)
 await gravarLocal(e,()=>novo);return novo
}
export async function salvarGestao(e:EstadoTreino,id:string,entrada:EntradaGestao,versaoBase:number|null):Promise<EstadoGestao>{
 validarEntradaGestao(entrada)
 if(e.contexto){if(!navigator.onLine||e.statusNuvem!=='confirmada')throw new Error('Organização anual exige conexão e ficha confirmada. O cadastro científico offline continua disponível.');const {salvarGestaoNuvem}=await import('../data/gestao');await salvarGestaoNuvem(e.contexto,id,entrada,versaoBase);return carregarGestao(e)}
 await gravarLocal(e,atual=>{if((atual.ninhos[id]?.versao??null)!==versaoBase)throw new Error('Organização alterada em outra aba. Nada sobrescrito.');const mesmoAno=Object.values(atual.ninhos).filter(n=>n.ano===entrada.ano),numero=entrada.numero||String(Math.max(0,...mesmoAno.map(n=>Number(n.numero)))+1).padStart(3,'0');if(mesmoAno.some(n=>n.id!==id&&n.numero===numero))throw new Error('Número anual já usado neste treino.');const n:GestaoNinho={id,projeto_id:'projeto-demo',...entrada,numero,versao:(versaoBase??0)+1,operacao_id:crypto.randomUUID(),atualizado_por:'treino-local',confirmado_em:new Date().toISOString()};return {...atual,ninhos:{...atual.ninhos,[id]:n},confirmada:false,revisao:atual.revisao+1}})
 return lerGestaoLocal(e)
}
