import type {ValoresCadastro} from './validacaoCadastro'
export function lerRascunho(texto:string|null,versao:number|null):ValoresCadastro|null {
 if(!texto)return null
 try{const r=JSON.parse(texto) as {versao?:unknown;valores?:unknown};if(r.versao!==versao||!r.valores||typeof r.valores!=='object'||Array.isArray(r.valores)||Object.values(r.valores).some(v=>typeof v!=='string'))return null;return r.valores as ValoresCadastro}catch{return null}
}
