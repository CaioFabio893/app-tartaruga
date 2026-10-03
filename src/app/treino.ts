import type { EntradaFicha } from '../domain/agregado'
import type { Abertura, Ninho, Ocorrencia, Transferencia, Visita } from '../domain/tipos'
import { ESPECIES, HISTORICOS_NINHO, SITUACOES, TEMPOS_TRANSFERENCIA } from '../domain/tipos'
import { paraDia } from '../domain/datas'
import { contagemValida } from '../domain/calculos'
import { validarHistoricoNinho, validarHoraOcorrencia, validarSituacao, validarTipoOcorrencia, validarTransferencia, validarTumores } from '../domain/validacao'
import { dadosDemonstracao } from '../report/exemplos'

export interface OperacaoTreino { id: string; criadoEm: string; baseRevisao: number; tipo: string; anterior: unknown; payload: unknown; estado: 'local-sem-sincronizacao' }
export interface EstadoTreino {
  schema: 1; revisao: number; ocorrencias: Ocorrencia[]; ninhos: Ninho[]; transferencias: Transferencia[];
  aberturas: Abertura[]; visitas: Visita[]; operacoes: OperacaoTreino[]
}
export function criarTreino(): EstadoTreino {
  const exemplos = dadosDemonstracao()
  return {schema:1,revisao:0,ocorrencias:exemplos.map(e=>e.ocorrencia!),ninhos:exemplos.map(e=>e.ninho),
    transferencias:exemplos.flatMap(e=>e.transferencias),aberturas:exemplos.flatMap(e=>e.aberturas),visitas:[],operacoes:[]}
}
export function fichasDoTreino(e: EstadoTreino): EntradaFicha[] {
  return e.ninhos.map(ninho => ({ ninho, ocorrencia: e.ocorrencias.find(o=>o.id===ninho.ocorrenciaId) ?? null,
    transferencias:e.transferencias.filter(t=>t.ninhoId===ninho.id),aberturas:e.aberturas.filter(a=>a.ninhoId===ninho.id),visitas:e.visitas.filter(v=>v.ninhoId===ninho.id) }))
}
export interface AutoriaTreino { usuario: string; instante: string; novoId: () => string }
function trilha(m: AutoriaTreino) { return {criadoPor:m.usuario,atualizadoPor:m.usuario,criadoEm:m.instante,atualizadoEm:m.instante,versao:1} }
function validarData(data: string | null, campo: string) { if(data !== null && paraDia(data) === null) throw new Error(`${campo}: data inválida.`) }
function contagem(v: number | null, campo: string) { if(v !== null && !contagemValida(v)) throw new Error(`${campo}: informe inteiro não negativo ou deixe vazio.`) }
function validarAutoria(m: AutoriaTreino) { if (!m.usuario || !Number.isFinite(Date.parse(m.instante))) throw new Error('Autoria local inválida.') }
function novo(e: EstadoTreino, m: AutoriaTreino, tipo: string, anterior: unknown, payload: unknown): EstadoTreino {
  validarAutoria(m)
  e.operacoes.push({id:m.novoId(),criadoEm:m.instante,baseRevisao:e.revisao,tipo,anterior:structuredClone(anterior),payload:structuredClone(payload),estado:'local-sem-sincronizacao'})
  e.revisao++; return e
}
function recusar(problemas: {gravidade: string; mensagem: string}[]) {
  const erros=problemas.filter(p=>p.gravidade==='erro'); if(erros.length) throw new Error(erros.map(p=>p.mensagem).join(' '))
}
export function registrarOcorrencia(e: EstadoTreino, o: Omit<Ocorrencia,'id'|'ninhoId'|'criadoPor'|'criadoEm'|'atualizadoPor'|'atualizadoEm'|'versao'>,
  situacao: Ninho['situacao'], m: AutoriaTreino,
  transferenciaInicial: Omit<Transferencia,'id'|'ninhoId'|'projetoId'|'criadoPor'|'criadoEm'|'atualizadoPor'|'atualizadoEm'|'versao'> | null = null): EstadoTreino {
  validarData(o.dataOcorrencia,'DATA_OCORR')
  recusar([...validarTipoOcorrencia(o.tipoOcorrencia,o.verificacaoPraiaRealizada),...validarSituacao(o.tipoOcorrencia,situacao),
    ...validarTumores(o.flagrante===true,o.tumores),...validarHoraOcorrencia(o.horaOcorrencia,o.flagrante===true)])
  if(o.especieCodigo!==null && !(ESPECIES as readonly string[]).includes(o.especieCodigo)) throw new Error('Código de espécie inválido.')
  if(!['REPRODUTIVO','NAO_REPRODUTIVO'].includes(o.tipoRegistro)) throw new Error('Natureza inválida.')
  for(const v of [o.comprimentoCasco,o.larguraCasco]) if(v!==null&&(!Number.isFinite(v)||v<0)) throw new Error('Biometria inválida; preserve o campo vazio quando não observado.')
  if(o.projetoId!=='projeto-demo') throw new Error('O modo de treino não grava em projeto real.')
  if((situacao==='P' || situacao==='T') && (!transferenciaInicial || transferenciaInicial.destino!==(situacao==='T'?'CERCADO':'PRAIA'))) throw new Error('Manejo transferido exige os dados da transferência inicial, sem assumir in situ.')
  const n=structuredClone(e); const id=m.novoId(); const ninhoId=o.tipoOcorrencia==='CD'?m.novoId():null
  if(n.ocorrencias.some(x=>x.id===id) || (ninhoId!==null && n.ninhos.some(x=>x.id===ninhoId))) throw new Error('Identificador local duplicado.')
  const registro:Ocorrencia={...structuredClone(o),...trilha(m),id,ninhoId}
  n.ocorrencias.push(registro)
  if(ninhoId) n.ninhos.push({...trilha(m),id:ninhoId,projetoId:o.projetoId,temporadaId:o.temporadaId,ocorrenciaId:id,
    codigoInterno:'TREINO-'+ninhoId.slice(0,8),situacao,historicoNinho:null,problemaIncubacao:null,estadoAcompanhamento:'AGUARDANDO'})
  const criado=novo(n,m,'ocorrencia',null,registro)
  return ninhoId && transferenciaInicial ? registrarTransferencia(criado,{...transferenciaInicial,ninhoId,projetoId:o.projetoId},m) : criado
}

export function registrarTransferencia(e:EstadoTreino,t:Omit<Transferencia,'id'|'criadoPor'|'criadoEm'|'atualizadoPor'|'atualizadoEm'|'versao'>,m:AutoriaTreino):EstadoTreino {
  if(!['PRAIA','CERCADO'].includes(t.destino)) throw new Error('Destino inválido.')
  validarData(t.dataTransferencia,'Data de transferência'); contagem(t.ovosTransferencia,'OVOS_TRANS')
  if(t.tempoTransferencia!==null && !(TEMPOS_TRANSFERENCIA as readonly string[]).includes(t.tempoTransferencia)) throw new Error('TEMP_TRANSF inválido.')
  recusar(validarTransferencia(t.destino,t.numeroNinhoCercado))
  if(t.destino==='CERCADO' && !t.cercadoId?.trim()) throw new Error('Informe o identificador do cercado de treino.')
  if(t.destino==='PRAIA' && !t.localDestino.localKm?.trim()) throw new Error('Informe o trecho de destino no treino.')
  const n=structuredClone(e); const ninho=n.ninhos.find(x=>x.id===t.ninhoId)
  if(!ninho || t.projetoId!==ninho.projetoId || t.projetoId!=='projeto-demo') throw new Error('Vínculo de transferência inválido.')
  const anterior=structuredClone(ninho); const registro:Transferencia={...structuredClone(t),...trilha(m),id:m.novoId()}
  if(n.transferencias.some(x=>x.id===registro.id)) throw new Error('Transferência duplicada.')
  n.transferencias.push(registro)
  ninho.situacao=t.destino==='CERCADO'?'T':'P';ninho.atualizadoEm=m.instante;ninho.atualizadoPor=m.usuario;ninho.versao++
  return novo(n,m,'transferencia',anterior,{transferencia:registro,ninho})
}

export function registrarAbertura(e:EstadoTreino,a:Omit<Abertura,'id'|'criadoPor'|'criadoEm'|'atualizadoPor'|'atualizadoEm'|'versao'>,
  manejo:{historico:Ninho['historicoNinho'];problema:Ninho['problemaIncubacao']},m:AutoriaTreino,idExistente:string|null=null):EstadoTreino {
  validarData(a.dataEclosao,'DATA_ECLOS');validarData(a.dataAbertura,'DATA_ABERT')
  for(const c of ['vivos','natimortos','ovosNaoEclodidos','ovosFurados','naoViaveis'] as const) contagem(a[c],c)
  if(!a.dataEclosao && !a.dataAbertura) throw new Error('Informe a data da eclosão ou da abertura.')
  if(!a.dataAbertura && [a.vivos,a.natimortos,a.ovosNaoEclodidos,a.ovosFurados,a.naoViaveis].some(v=>v!==null)) throw new Error('Contagens da escavação exigem DATA_ABERT. Eclosão isolada não inventa contagens.')
  if(manejo.historico!==null && !(HISTORICOS_NINHO as readonly string[]).includes(manejo.historico)) throw new Error('HIST_NINHO inválido.')
  const n=structuredClone(e); const ninho=n.ninhos.find(x=>x.id===a.ninhoId)
  const origem=n.ocorrencias.find(o=>o.id===ninho?.ocorrenciaId)
  if(!ninho || !origem || a.projetoId!==ninho.projetoId || a.projetoId!=='projeto-demo') throw new Error('Vínculo de abertura inválido.')
  if(origem.especieCodigo!=='DC' && a.naoViaveis!==null) throw new Error('NAO_VIAVEIS somente para DC.')
  recusar(validarHistoricoNinho(origem.tipoOcorrencia,manejo.historico,a.observacoes))
  const existente=idExistente?n.aberturas.find(x=>x.id===idExistente && x.ninhoId===ninho.id):undefined
  if(idExistente && !existente) throw new Error('Registro de abertura não encontrado.')
  const anterior={ninho:structuredClone(ninho),abertura:existente?structuredClone(existente):null}
  const registro:Abertura={...structuredClone(a),...trilha(m),id:existente?.id??m.novoId(),
    criadoPor:existente?.criadoPor??m.usuario,criadoEm:existente?.criadoEm??m.instante,versao:(existente?.versao??0)+1}
  if(existente) n.aberturas[n.aberturas.findIndex(x=>x.id===existente.id)]=registro
  else n.aberturas.push(registro)
  ninho.historicoNinho=manejo.historico;ninho.problemaIncubacao=manejo.problema
  ninho.estadoAcompanhamento=a.dataAbertura?'ABERTO':'ATIVO';ninho.atualizadoPor=m.usuario;ninho.atualizadoEm=m.instante;ninho.versao++
  return novo(n,m,'abertura',anterior,{abertura:registro,ninho})
}

export { SITUACOES }

export function registrarVisita(e:EstadoTreino,v:Omit<Visita,'id'|'criadoPor'|'criadoEm'|'atualizadoPor'|'atualizadoEm'|'versao'>,m:AutoriaTreino):EstadoTreino {
  validarData(v.dataVisita,'Data de visita')
  const n=structuredClone(e),ninho=n.ninhos.find(x=>x.id===v.ninhoId)
  if(!ninho||ninho.projetoId!==v.projetoId||v.projetoId!=='projeto-demo')throw new Error('Vínculo de visita inválido.')
  if(v.eventos.some(x=>!['predacao','mare','perda_marcacao','outro'].includes(x)))throw new Error('Evento de visita inválido.')
  const registro:Visita={...structuredClone(v),...trilha(m),id:m.novoId()}
  n.visitas.push(registro);return novo(n,m,'visita',null,registro)
}

export async function carregarTreino():Promise<EstadoTreino> {
  const repo=await import('../data/treino'); const existente=await repo.lerTreino()
  if(existente) return existente
  const inicial=criarTreino()
  try { await repo.salvarTreino(inicial,null);return inicial }
  catch(e) {const concorrente=await repo.lerTreino();if(concorrente)return concorrente;throw e}
}
export async function gravarTreino(proximo:EstadoTreino,base:number) {
  const repo=await import('../data/treino');await repo.salvarTreino(proximo,base)
}
