import 'fake-indexeddb/auto'
import { beforeEach, expect, it, vi } from 'vitest'
import { lerCacheProjeto, lerArquivados } from '../../src/data/pendencias'
import { gravarProjeto, abrirCopiaLocal, sincronizarProjeto, manterRemoto } from '../../src/app/nuvem'
import { registrarOcorrencia, type EstadoTreino } from '../../src/app/treino'
import { ocorrenciaBase } from '../auxiliares-agregado'
const servidor=vi.hoisted(()=>({estado:null as EstadoTreino|null,falha:null as Error|null,envios:0}))
vi.mock('../../src/data/nuvem',async()=>{const real=await vi.importActual<typeof import('../../src/data/nuvem')>('../../src/data/nuvem');return {...real,
  carregarNuvem:vi.fn(async()=>structuredClone(servidor.estado!)),
  gravarNuvem:vi.fn(async(_base:EstadoTreino,n:EstadoTreino)=>{servidor.envios++;if(servidor.falha)throw servidor.falha;servidor.estado={...structuredClone(n),revisao:0,operacoes:[],contexto:{...n.contexto!,revisaoServidor:n.contexto!.revisaoServidor+1}}})}})
let numero=0
function dados(){const projetoId=`offline-${++numero}`;const base:EstadoTreino={schema:1,revisao:0,ocorrencias:[],ninhos:[],transferencias:[],visitas:[],aberturas:[],operacoes:[],contexto:{projetoId,usuario:'campo',papel:'campo',nome:'Teste',revisaoServidor:0}};let id=0;const novo=registrarOcorrencia(base,{...ocorrenciaBase,projetoId,numeroRegistro:null},'I',{usuario:'campo',instante:'2026-10-02T22:00:00Z',novoId:()=>`offline-id-${++id}`});servidor.estado=base;return {base,novo}}
beforeEach(()=>{servidor.falha=null;servidor.envios=0;vi.stubGlobal('navigator',{onLine:false})})
it('offline persiste pendência, reabertura recupera e outro usuário não recebe a cópia',async()=>{
  const {base,novo}=dados(),e=await gravarProjeto(base,novo)
  expect(e.statusNuvem).toBe('pendente');expect(servidor.envios).toBe(0)
  expect((await abrirCopiaLocal(base.contexto!.projetoId,'campo')).ninhos).toHaveLength(1)
  await expect(abrirCopiaLocal(base.contexto!.projetoId,'outra-pessoa')).rejects.toThrow('primeira vez')
  await expect(gravarProjeto(base,novo)).rejects.toThrow('pendente')
})
it('somente confirmação do servidor elimina pendência; falha não altera IDs',async()=>{
  const {base,novo}=dados();await gravarProjeto(base,novo);vi.stubGlobal('navigator',{onLine:true});servidor.falha=new Error('Conflito entre aparelhos')
  const erro=await sincronizarProjeto(base.contexto!);expect(erro.statusNuvem).toBe('conflito');expect((await lerCacheProjeto(base.contexto!.projetoId,'campo'))!.pendente!.operacoes[0]!.id).toBe(novo.operacoes[0]!.id)
  await sincronizarProjeto(base.contexto!);expect(servidor.envios).toBe(1)
  servidor.falha=null;const confirmado=await sincronizarProjeto(base.contexto!,true);expect(confirmado.statusNuvem).toBe('confirmada');expect((await lerCacheProjeto(base.contexto!.projetoId,'campo'))!.pendente).toBe(null)
})
it('escolha do remoto preserva rascunho arquivado e exportável',async()=>{
  const {base,novo}=dados();await gravarProjeto(base,novo);vi.stubGlobal('navigator',{onLine:true})
  const e=await manterRemoto(base.contexto!);expect(e.ninhos).toHaveLength(0)
  const arquivos=await lerArquivados(base.contexto!.projetoId,'campo');expect(arquivos).toHaveLength(1);expect(arquivos[0]!.pendente!.ninhos).toHaveLength(1)
})
