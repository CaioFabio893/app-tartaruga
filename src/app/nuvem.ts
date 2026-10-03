import type { EstadoTreino } from './treino'
import type { EntradaConsulta } from '../domain/consultas'
import { lerCacheProjeto, lerArquivados, atualizarCache, type CacheProjeto } from '../data/pendencias'
const conectado=()=>typeof navigator!=='undefined' && navigator.onLine
function doCache(c:CacheProjeto):EstadoTreino {return {...c.pendente??c.base,statusNuvem:c.pendente?(c.erro?.includes('Conflito')?'conflito':c.erro?'erro':'pendente'):'cache',mensagemNuvem:c.erro??(c.pendente?'Alteração preservada no aparelho, ainda não confirmada no servidor.':'Cópia local. Acesso e atualização não conferidos no servidor.') }}
export async function abrirCopiaLocal(projetoId:string,usuario:string) {const c=await lerCacheProjeto(projetoId,usuario);if(!c)throw new Error('Entre com internet uma primeira vez para preparar este aparelho.');return doCache(c)}
export async function carregarProjeto(contexto:NonNullable<EstadoTreino['contexto']>):Promise<EstadoTreino> {
  const cache=await lerCacheProjeto(contexto.projetoId,contexto.usuario)
  if(cache?.pendente)return doCache(cache)
  if(!conectado())return abrirCopiaLocal(contexto.projetoId,contexto.usuario)
  const r=await import('../data/nuvem'),e=await r.carregarNuvem(contexto)
  await atualizarCache(e,c=>{if(c?.pendente)throw new Error('Outra aba criou uma pendência. Confira antes de substituir a cópia local.');return {schema:1,base:e,pendente:null,erro:null}})
  return {...e,statusNuvem:'confirmada'}
}
export async function sincronizarProjeto(contexto:NonNullable<EstadoTreino['contexto']>,manual=false):Promise<EstadoTreino> {
  const c=await lerCacheProjeto(contexto.projetoId,contexto.usuario)
  if(!c?.pendente)return carregarProjeto(contexto)
  if(!conectado()||c.erro&&!manual)return doCache(c)
  const r=await import('../data/nuvem');const id=c.pendente.operacoes.at(-1)!.id
  try {
    await r.gravarNuvem(c.base,c.pendente)
    const confirmado=await r.carregarNuvem(contexto)
    await atualizarCache(confirmado,atual=>{if(atual?.pendente?.operacoes.at(-1)?.id!==id)throw new Error('Pendência mudou em outra aba. Nada foi descartado.');return {schema:1,base:confirmado,pendente:null,erro:null}})
    return {...confirmado,statusNuvem:'confirmada',mensagemNuvem:'Gravação confirmada no servidor.'}
  } catch(e) {
    const mensagem=e instanceof Error?e.message:'Falha na sincronização. Pendência preservada.'
    await atualizarCache(c.base,atual=>{if(atual?.pendente?.operacoes.at(-1)?.id!==id)throw new Error('Pendência alterada em outra aba.');return {...atual,erro:mensagem}})
    return doCache({...c,erro:mensagem})
  }
}
export async function gravarProjeto(base:EstadoTreino,proximo:EstadoTreino) {
  const r=await import('../data/nuvem');r.prepararGravacao(base,proximo)
  await atualizarCache(base,c=>{if(c?.pendente)throw new Error('Existe uma alteração pendente. Resolva ou arquive o rascunho antes de continuar.');if(c&&c.base.contexto!.revisaoServidor!==base.contexto!.revisaoServidor)throw new Error('Conflito entre abas. Formulário preservado.');return {schema:1,base,pendente:proximo,erro:null}})
  return sincronizarProjeto(base.contexto!)
}
/** Escolha explícita; conserva o rascunho arquivado, não faz mescla nem sobreposição. */
export async function manterRemoto(contexto:NonNullable<EstadoTreino['contexto']>) {
  if(!conectado())throw new Error('Conecte-se para conferir o remoto.')
  const r=await import('../data/nuvem'),confirmado=await r.carregarNuvem(contexto)
  await atualizarCache(confirmado,()=>({schema:1,base:confirmado,pendente:null,erro:null}),true)
  return {...confirmado,statusNuvem:'confirmada' as const,mensagemNuvem:'Remoto adotado. Rascunho anterior arquivado neste aparelho; sua cópia JSON continua disponível antes da escolha.'}
}
export async function consultarRelatorioProjeto(contexto:NonNullable<EstadoTreino['contexto']>,consulta:EntradaConsulta) {
  const c=await lerCacheProjeto(contexto.projetoId,contexto.usuario)
  if(c?.pendente)throw new Error('Há alteração pendente ou conflito. Resolva antes de gerar relatório confirmado; a cópia local pode ser exportada como parcial.')
  const r=await import('../data/nuvem'),relatorio=await r.consultarRelatorioNuvem(contexto,consulta);if((await lerCacheProjeto(contexto.projetoId,contexto.usuario))?.pendente)throw new Error('Outra aba criou uma pendência durante a prévia. Resolva antes de emitir confirmado.');return relatorio
}

export async function copiaCompletaProjeto(contexto:NonNullable<EstadoTreino['contexto']>) {return {parcial:true,cache:await lerCacheProjeto(contexto.projetoId,contexto.usuario),rascunhosArquivados:await lerArquivados(contexto.projetoId,contexto.usuario)}}
