import { ordenarTransferencias } from '../domain/agregado'
import type { EntradaFicha } from '../domain/agregado'
import type { Abertura, Ninho, Ocorrencia, Transferencia, Visita } from '../domain/tipos'
import { ESPECIES, HISTORICOS_NINHO, SITUACOES, TEMPOS_TRANSFERENCIA } from '../domain/tipos'
import { paraDia } from '../domain/datas'
import { contagemValida } from '../domain/calculos'
import { validarEvidenciaPesca, validarPalavrasChave, validarHistoricoNinho, validarHoraOcorrencia, validarSituacao, validarTipoOcorrencia, validarTransferencia, validarTumores } from '../domain/validacao'
import { dadosDemonstracao } from '../report/exemplos'

export interface OperacaoTreino { id: string; criadoEm: string; baseRevisao: number; tipo: string; anterior: unknown; payload: unknown; estado: 'local-sem-sincronizacao' }
export interface EstadoTreino {
  statusNuvem?: 'confirmada'|'cache'|'pendente'|'conflito'|'erro';
  mensagemNuvem?: string;
  /** Presente apenas no fluxo real; o repositório de treino continua isolado. */
  contexto?: { projetoId: string; usuario: string; nome: string; papel: 'consulta'|'campo'|'coordenacao'; revisaoServidor: number }
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
function projetoPermitido(e:EstadoTreino,p:string) { return p === (e.contexto?.projetoId ?? 'projeto-demo') }
function novo(e: EstadoTreino, m: AutoriaTreino, tipo: string, anterior: unknown, payload: unknown): EstadoTreino {
  validarAutoria(m)
  e.operacoes.push({id:m.novoId(),criadoEm:m.instante,baseRevisao:e.revisao,tipo,anterior:structuredClone(anterior),payload:structuredClone(payload),estado:'local-sem-sincronizacao'})
  e.revisao++; return e
}
function recusar(problemas: {gravidade: string; mensagem: string}[]) {
  const erros=problemas.filter(p=>p.gravidade==='erro'); if(erros.length) throw new Error(erros.map(p=>p.mensagem).join(' '))
}
function validarOcorrenciaEntrada(o:Omit<Ocorrencia,'id'|'ninhoId'|'criadoPor'|'criadoEm'|'atualizadoPor'|'atualizadoEm'|'versao'>,situacao:Ninho['situacao']) {
  validarData(o.dataOcorrencia,'DATA_OCORR')
  recusar([...validarEvidenciaPesca(o.evidenciaInteracaoPesca,o.tipoEvidencia),...validarPalavrasChave(o.palavrasChave),...validarTipoOcorrencia(o.tipoOcorrencia,o.verificacaoPraiaRealizada),...validarSituacao(o.tipoOcorrencia,situacao),
    ...validarTumores(o.flagrante===true,o.tumores),...validarHoraOcorrencia(o.horaOcorrencia,o.flagrante===true)])
  if(o.especieCodigo!==null && !(ESPECIES as readonly string[]).includes(o.especieCodigo)) throw new Error('Código de espécie inválido.')
  if(!['REPRODUTIVO','NAO_REPRODUTIVO'].includes(o.tipoRegistro)) throw new Error('Natureza inválida.')
  for(const v of [o.comprimentoCasco,o.larguraCasco]) if(v!==null&&(!Number.isFinite(v)||v<0)) throw new Error('Biometria inválida; preserve o campo vazio quando não observado.')
}
export function registrarOcorrencia(e: EstadoTreino, o: Omit<Ocorrencia,'id'|'ninhoId'|'criadoPor'|'criadoEm'|'atualizadoPor'|'atualizadoEm'|'versao'>,
  situacao: Ninho['situacao'], m: AutoriaTreino,
  transferenciaInicial: Omit<Transferencia,'id'|'ninhoId'|'projetoId'|'criadoPor'|'criadoEm'|'atualizadoPor'|'atualizadoEm'|'versao'> | null = null): EstadoTreino {
  validarOcorrenciaEntrada(o,situacao)
  if(!projetoPermitido(e,o.projetoId)) throw new Error('Projeto da ocorrência não corresponde ao acesso atual.')
  if((situacao==='P' || situacao==='T') && (!transferenciaInicial || transferenciaInicial.destino!==(situacao==='T'?'CERCADO':'PRAIA'))) throw new Error('Manejo transferido exige os dados da transferência inicial, sem assumir in situ.')
  const n=structuredClone(e); const id=m.novoId(); const ninhoId=o.tipoOcorrencia==='CD'?m.novoId():null
  if(n.ocorrencias.some(x=>x.id===id) || (ninhoId!==null && n.ninhos.some(x=>x.id===ninhoId))) throw new Error('Identificador local duplicado.')
  const registro:Ocorrencia={...structuredClone(o),...trilha(m),id,ninhoId}
  n.ocorrencias.push(registro)
  if(ninhoId) n.ninhos.push({...trilha(m),id:ninhoId,projetoId:o.projetoId,temporadaId:o.temporadaId,ocorrenciaId:id,
    codigoInterno:(e.contexto?'NINHO-':'TREINO-')+ninhoId.slice(0,8),situacao,historicoNinho:null,problemaIncubacao:null,estadoAcompanhamento:'AGUARDANDO'})
  const criado=novo(n,m,'ocorrencia',null,registro)
  const resultado=ninhoId && transferenciaInicial ? registrarTransferencia(criado,{...transferenciaInicial,ninhoId,projetoId:o.projetoId},m) : criado
  // Uma criação composta continua sendo a primeira versão persistida no servidor.
  if(e.contexto && ninhoId) resultado.ninhos.find(x=>x.id===ninhoId)!.versao=1
  return resultado
}

export function registrarTransferencia(e:EstadoTreino,t:Omit<Transferencia,'id'|'criadoPor'|'criadoEm'|'atualizadoPor'|'atualizadoEm'|'versao'>,m:AutoriaTreino,idExistente:string|null=null,motivo=''):EstadoTreino {
  if(idExistente&&!motivo.trim())throw new Error('Motivo da correção: explique o erro na transferência.')
  if(!['PRAIA','CERCADO'].includes(t.destino)) throw new Error('Destino inválido.')
  validarData(t.dataTransferencia,'Data de transferência'); contagem(t.ovosTransferencia,'OVOS_TRANS')
  if(t.tempoTransferencia!==null && !(TEMPOS_TRANSFERENCIA as readonly string[]).includes(t.tempoTransferencia)) throw new Error('TEMP_TRANSF inválido.')
  recusar(validarTransferencia(t.destino,t.numeroNinhoCercado))
  if(t.destino==='CERCADO' && !t.cercadoId?.trim()) throw new Error('Informe o identificador do cercado de treino.')
  if(t.destino==='PRAIA' && !t.localDestino.localKm?.trim()) throw new Error('Informe o trecho de destino no treino.')
  const n=structuredClone(e); const ninho=n.ninhos.find(x=>x.id===t.ninhoId)
  if(!ninho || t.projetoId!==ninho.projetoId || !projetoPermitido(e,t.projetoId)) throw new Error('Vínculo de transferência inválido.')
  const existente=idExistente?n.transferencias.find(x=>x.id===idExistente&&x.ninhoId===t.ninhoId):undefined
  if(idExistente&&!existente)throw new Error('Transferência não encontrada neste ninho.')
  const anterior={ninho:structuredClone(ninho),transferencia:existente?structuredClone(existente):null}; const registro:Transferencia={...structuredClone(t),...trilha(m),id:existente?.id??m.novoId(),criadoPor:existente?.criadoPor??m.usuario,criadoEm:existente?.criadoEm??m.instante,versao:(existente?.versao??0)+1}
  if(!existente&&n.transferencias.some(x=>x.id===registro.id)) throw new Error('Transferência duplicada.')
  if(existente)n.transferencias[n.transferencias.indexOf(existente)]=registro;else n.transferencias.push(registro)
  const atual=ordenarTransferencias(n.transferencias.filter(x=>x.ninhoId===ninho.id)).at(-1)!
  ninho.situacao=atual.destino==='CERCADO'?'T':'P';ninho.atualizadoEm=m.instante;ninho.atualizadoPor=m.usuario;ninho.versao++
  return novo(n,m,'transferencia',anterior,{transferencia:registro,ninho,...(existente?{motivo:motivo.trim()}:{} )})
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
  if(!ninho || !origem || a.projetoId!==ninho.projetoId || !projetoPermitido(e,a.projetoId)) throw new Error('Vínculo de abertura inválido.')
  if(origem.especieCodigo!=='DC' && a.naoViaveis!==null) throw new Error('NAO_VIAVEIS somente para DC.')
  recusar(validarHistoricoNinho(origem.tipoOcorrencia,manejo.historico,a.observacoes))
  const existente=idExistente?n.aberturas.find(x=>x.id===idExistente && x.ninhoId===ninho.id):undefined
  if(idExistente && !existente) throw new Error('Registro de abertura não encontrado.')
  const anterior={ninho:structuredClone(ninho),abertura:existente?structuredClone(existente):null}
  if(e.contexto && !existente && n.aberturas.some(x=>x.ninhoId===ninho.id)) throw new Error('Escolha a abertura existente para complementar ou corrigir. Reabertura distinta exige protocolo da coordenação.')
  const registro:Abertura={...structuredClone(a),...trilha(m),id:existente?.id??(e.contexto?ninho.id:m.novoId()),
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
  if(!ninho||ninho.projetoId!==v.projetoId||!projetoPermitido(e,v.projetoId))throw new Error('Vínculo de visita inválido.')
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

export type CorrecaoAnimal=Pick<Ocorrencia,'especieCodigo'|'marcasEncontradas'|'marcasColocadas'|'marcasRetiradas'|'comprimentoCasco'|'larguraCasco'|'tumores'|'coletaMaterialBiologico'|'evidenciaInteracaoPesca'|'tipoEvidencia'|'palavrasChave'|'observacoes'|'numeroRegistro'>
/** Correção auditada; nenhuma chave da localização original é recebida. */
export function corrigirAnimal(e:EstadoTreino,ocorrenciaId:string,campos:CorrecaoAnimal,m:AutoriaTreino):EstadoTreino {
  const n=structuredClone(e),o=n.ocorrencias.find(x=>x.id===ocorrenciaId)
  if(!o||!projetoPermitido(e,o.projetoId))throw new Error('Ocorrência fora do projeto.')
  if(o.numeroRegistro!==null&&campos.numeroRegistro!==o.numeroRegistro)throw new Error('Número já atribuído não será renumerado.')
  if(campos.especieCodigo!=='DC'&&n.aberturas.some(a=>a.ninhoId===o.ninhoId&&a.naoViaveis!==null))throw new Error('Confira NAO_VIAVEIS na abertura antes de corrigir espécie diferente de DC; nada foi apagado.')
  const ninho=n.ninhos.find(x=>x.id===o.ninhoId),antes={ocorrencia:structuredClone(o),ninho:ninho?structuredClone(ninho):null}
  const corrigida={...o,...structuredClone(campos),id:o.id,ninhoId:o.ninhoId,projetoId:o.projetoId,responsavelId:o.responsavelId,criadoPor:o.criadoPor,criadoEm:o.criadoEm,versao:o.versao+1,atualizadoPor:m.usuario,atualizadoEm:m.instante}
  validarOcorrenciaEntrada(corrigida,ninho?.situacao??null)
  n.ocorrencias[n.ocorrencias.indexOf(o)]=corrigida
  if(ninho){ninho.versao++;ninho.atualizadoPor=m.usuario;ninho.atualizadoEm=m.instante}
  return novo(n,m,'animal',antes,{ocorrencia:corrigida,ninho:ninho??null})
}


/** Correção explícita D-031: pré-imagem preservada; nunca representa manejo. */
export type CorrecaoCadastro = Omit<Ocorrencia,'id'|'ninhoId'|'projetoId'|'responsavelId'|'criadoPor'|'criadoEm'|'atualizadoPor'|'atualizadoEm'|'versao'>
export function corrigirCadastro(e:EstadoTreino,id:string,campos:CorrecaoCadastro,motivo:string,m:AutoriaTreino):EstadoTreino {
 if(e.contexto?.papel==='consulta')throw new Error('Seu acesso é somente consulta.')
 if(!motivo.trim())throw new Error('Motivo da correção: explique o erro que está corrigindo.')
 const n=structuredClone(e),o=n.ocorrencias.find(x=>x.id===id)
 if(!o||!projetoPermitido(e,o.projetoId))throw new Error('Ocorrência fora do projeto.')
 const ninho=n.ninhos.find(x=>x.id===o.ninhoId)
 if((o.ninhoId!==null)!==(campos.tipoOcorrencia==='CD'))throw new Error('TIPO_OCORR: um ninho exige CD. Para corrigir uma ocorrência cadastrada sem desova, solicite à coordenação a exclusão do cadastro incorreto e registre a ocorrência correta; nenhum histórico foi apagado.')
 if(campos.especieCodigo!=='DC'&&n.aberturas.some(a=>a.ninhoId===o.ninhoId&&a.naoViaveis!==null))throw new Error('ESPECIE: corrija primeiro NAO_VIAVEIS na abertura; esse campo só se aplica a DC.')
 const l=campos.localOrigem
 if([l.latitude,l.longitude].some(v=>v!==null&&!Number.isFinite(v))||l.latitude!==null&&Math.abs(l.latitude)>90||l.longitude!==null&&Math.abs(l.longitude)>180||(l.latitude===null)!==(l.longitude===null)||l.latitude!==null&&!l.datum)throw new Error('LATITUDE / LONGITUDE / DATUM: confira o par de coordenadas e o datum.')
 if(campos.dataOcorrencia&&n.aberturas.some(a=>a.ninhoId===o.ninhoId&&[a.dataEclosao,a.dataAbertura].some(d=>d!==null&&d<campos.dataOcorrencia!)))throw new Error('DATA_OCORR: a data está depois da eclosão ou abertura existente. Confira as datas antes de salvar.')
 const antes={ocorrencia:structuredClone(o),ninho:ninho?structuredClone(ninho):null}
 const corrigida={...o,...structuredClone(campos),id:o.id,ninhoId:o.ninhoId,projetoId:o.projetoId,responsavelId:o.responsavelId,criadoPor:o.criadoPor,criadoEm:o.criadoEm,versao:o.versao+1,atualizadoPor:m.usuario,atualizadoEm:m.instante}
 validarOcorrenciaEntrada(corrigida,ninho?.situacao??null)
 n.ocorrencias[n.ocorrencias.indexOf(o)]=corrigida
 if(ninho){ninho.temporadaId=corrigida.temporadaId;ninho.versao++;ninho.atualizadoPor=m.usuario;ninho.atualizadoEm=m.instante}
 return novo(n,m,'cadastro',antes,{ocorrencia:corrigida,ninho:ninho??null,motivo:motivo.trim()})
}


export function excluirNinhoTreino(e:EstadoTreino,id:string,motivo:string,m:AutoriaTreino):EstadoTreino {
 if(e.contexto)throw new Error('Exclusão oficial exige coordenação, servidor e backups.')
 const n=structuredClone(e),ninho=n.ninhos.find(x=>x.id===id)
 if(!ninho||!motivo.trim())throw new Error('Ninho e motivo da exclusão são necessários.')
 const anterior=fichasDoTreino(n).find(x=>x.ninho.id===id)!
 n.ninhos=n.ninhos.filter(x=>x.id!==id);n.ocorrencias=n.ocorrencias.filter(x=>x.id!==ninho.ocorrenciaId)
 n.transferencias=n.transferencias.filter(x=>x.ninhoId!==id);n.aberturas=n.aberturas.filter(x=>x.ninhoId!==id);n.visitas=n.visitas.filter(x=>x.ninhoId!==id)
 return novo(n,m,'exclusao',anterior,{ninhoId:id,motivo:motivo.trim()})
}
