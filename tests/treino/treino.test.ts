import 'fake-indexeddb/auto'
import { expect, it } from 'vitest'
import { criarTreino, fichasDoTreino, registrarOcorrencia, registrarTransferencia, registrarAbertura, registrarVisita } from '../../src/app/treino'
import { lerTreino, salvarTreino } from '../../src/data/treino'
import { montarFichaNinho } from '../../src/domain/agregado'

function autoria() {let i=0;return {usuario:'teste-local',instante:'2026-10-02T18:00:00Z',novoId:()=>`novo-${++i}`}}
function ocorrencia() {const o=structuredClone(criarTreino().ocorrencias[0]!);return {...o,numeroRegistro:null,dataOcorrencia:null,noiteReferencia:null}}
it('CD cria ninho, outras ocorrências não; insumo nunca muda',()=>{
  const e=criarTreino(),antes=JSON.stringify(e)
  expect(registrarOcorrencia(e,ocorrencia(),'I',autoria()).ninhos.length).toBe(e.ninhos.length+1)
  expect(registrarOcorrencia(e,{...ocorrencia(),tipoOcorrencia:'ML'},null,autoria()).ninhos.length).toBe(e.ninhos.length)
  expect(()=>registrarOcorrencia(e,{...ocorrencia(),tipoOcorrencia:'SD',verificacaoPraiaRealizada:null},null,autoria())).toThrow('verificacao')
  expect(JSON.stringify(e)).toBe(antes)
})
it('manejo transferido inicial exige transferência, sem trocar por I',()=>{
  const e=criarTreino()
  expect(()=>registrarOcorrencia(e,ocorrencia(),'T',autoria())).toThrow('transferência inicial')
  const t={...e.transferencias[0]!,destino:'CERCADO' as const,cercadoId:'cercado-treino',numeroNinhoCercado:'002',localDestino:{...e.transferencias[0]!.localDestino}}
  const n=registrarOcorrencia(e,ocorrencia(),'T',autoria(),t)
  expect(n.ninhos.at(-1)?.situacao).toBe('T')
  expect(n.transferencias.at(-1)?.numeroNinhoCercado).toBe('002')
  expect(n.operacoes).toHaveLength(2)
})
it('transferência preserva origem e é auditada',()=>{
  const e=criarTreino();const t={...e.transferencias[0]!,ninhoId:e.ninhos[0]!.id,ovosTransferencia:0}
  const n=registrarTransferencia(e,t,autoria());const f=montarFichaNinho(fichasDoTreino(n)[0]!)
  expect(f.ocorrencia!.localOrigem.localKm).toBe('1');expect(f.posicaoAtual.local.localKm).toBe('8')
  expect(f.ovosTransferencia).toBe(0);expect(n.operacoes[0]!.estado).toBe('local-sem-sincronizacao')
  expect(()=>registrarTransferencia(e,{...t,ovosTransferencia:-1},autoria())).toThrow('inteiro')
})
it('editar abertura conserva versão anterior; ausência difere de zero',()=>{
  const e=criarTreino(),a=e.aberturas[0]!
  const n=registrarAbertura(e,{...a,vivos:0,ovosFurados:null,observacoes:'Correção registrada no treino.'},{historico:'SU',problema:false},autoria(),a.id)
  expect(n.aberturas[0]!.versao).toBe(a.versao+1)
  expect(montarFichaNinho(fichasDoTreino(n)[0]!).derivados!.ovosTotais.valor).toBeNull()
  expect(n.operacoes[0]!.anterior).toHaveProperty('abertura.vivos',80)
  expect(()=>registrarAbertura(e,{...a,dataAbertura:null},{historico:null,problema:null},autoria())).toThrow('exigem DATA_ABERT')
})
it('IndexedDB confirma somente gravação local; concorrência rejeita revisão velha',async()=>{
  const e=criarTreino();await salvarTreino(e,null)
  const aba1=(await lerTreino())!,aba2=(await lerTreino())!
  const novo1=registrarOcorrencia(aba1,{...ocorrencia(),tipoOcorrencia:'ML'},null,autoria())
  await salvarTreino(novo1,aba1.revisao)
  const novo2=registrarOcorrencia(aba2,ocorrencia(),'I',autoria())
  await expect(salvarTreino(novo2,aba2.revisao)).rejects.toThrow('Conflito entre abas')
  expect((await lerTreino())!.ocorrencias).toHaveLength(6)
  expect(novo2.ninhos).toHaveLength(6)
  await expect(salvarTreino({...novo1,revisao:99},novo1.revisao)).rejects.toThrow('inválida')
  expect((await lerTreino())!.revisao).toBe(1)
})
it('visita registra acompanhamento sem mudar histórico oficial',()=>{
  const e=criarTreino(),n=registrarVisita(e,{projetoId:'projeto-demo',ninhoId:e.ninhos[0]!.id,dataVisita:'2026-10-02',noiteReferencia:'2026-10-02',responsavelId:null,condicao:null,eventos:['mare'],observacoes:'Visita de teste.'},autoria())
  expect(n.visitas).toHaveLength(1)
  expect(n.ninhos[0]!.historicoNinho).toBe(e.ninhos[0]!.historicoNinho)
  expect(fichasDoTreino(n)[0]!.visitas).toHaveLength(1)
})
it('armazenamento incompatível não é resetado nem substituído',async()=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('monitoramento-ninhos-treino-v1',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction('estado','readwrite');tx.objectStore('estado').put({schema:99,preservar:'DADO_EXISTENTE'},'atual');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})
  await expect(lerTreino()).rejects.toThrow('Não foram apagados')
  await expect(salvarTreino(criarTreino(),null)).rejects.toThrow('Não foram apagados')
  const valor=await new Promise<unknown>((resolve,reject)=>{const r=db.transaction('estado','readonly').objectStore('estado').get('atual');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
  expect(valor).toEqual({schema:99,preservar:'DADO_EXISTENTE'});db.close()
})
