import { montarFichaNinho, montarResumo, type EntradaFicha, type FichaNinho, type LinhaResumo } from '../domain/agregado'
import { descreverConsultaRelatorio, type EntradaConsulta, type Criterio } from '../domain/consultas'
import { dentroDoPeriodo, paraDia } from '../domain/datas'
import { VERSAO_FORMULA, contagemValida } from '../domain/calculos'
import { ESPECIES, SITUACOES, HISTORICOS_NINHO } from '../domain/tipos'

export interface FonteRelatorio {
  demonstracao: boolean
  online: boolean
  sincronizacaoConfirmada: boolean
  conjuntoCompleto: boolean
}
export interface RegistroRelatorio { ficha: FichaNinho; linha: LinhaResumo; origem: EntradaFicha }
export interface Relatorio {
  nomesResponsaveis?: Record<string,string>
  projetoNome: string
  consulta: EntradaConsulta
  geradoEm: string
  fonte: FonteRelatorio
  parcial: boolean
  versaoFormula: string
  registros: RegistroRelatorio[]
  exclusoes: { dataAusente: number; dataAmbigua: number; foraPeriodo: number|null; outrosFiltros: number|null } | null
  avisos: string[]
}

/** Datas de campo já expressam a noite. Nunca converter um instante UTC aqui. */
function dataCriterio(origem: EntradaFicha, criterio: Criterio): { data: string | null; ambigua: boolean } {
  if (criterio === 'OCORR') return { data: origem.ocorrencia?.dataOcorrencia ?? null, ambigua: false }
  const datas = new Set<string>()
  for (const a of origem.aberturas) {
    const campo = criterio === 'ECLOS' ? a.dataEclosao : a.dataAbertura
    const noite = criterio === 'ECLOS' ? a.noiteReferenciaEclosao : a.noiteReferenciaAbertura
    if ((campo!==null && paraDia(campo)===null)||(noite!==null && paraDia(noite)===null)) throw new Error('Data de eclosão/abertura inválida. Confira a origem antes de exportar.')
    if (campo !== null) datas.add(campo)
    if (noite !== null) datas.add(noite)
  }
  return { data: datas.size === 1 ? [...datas][0] ?? null : null, ambigua: datas.size > 1 }
}

function validarVinculos(o: EntradaFicha, projetoId: string): void {
  if (!o.ocorrencia || o.ninho.projetoId !== projetoId || o.ocorrencia.projetoId !== projetoId ||
    o.ocorrencia.id !== o.ninho.ocorrenciaId || o.ocorrencia.tipoOcorrencia !== 'CD' ||
    (o.ocorrencia.ninhoId !== null && o.ocorrencia.ninhoId !== o.ninho.id) ||
    [...o.transferencias, ...o.aberturas, ...(o.visitas ?? [])].some(x => x.projetoId !== projetoId || x.ninhoId !== o.ninho.id)) {
    throw new Error('Vínculo de projeto/ocorrência/ninho inválido. Relatório interrompido para evitar mistura de dados.')
  }
  for(const a of o.aberturas) {
    for(const campo of ['vivos','natimortos','ovosNaoEclodidos','ovosFurados','naoViaveis'] as const) if(a[campo]!=null&&!contagemValida(a[campo])) throw new Error(`Contagem inválida em ${campo}. Não foi somada nem exportada.`)
    for(const d of [a.dataEclosao,a.dataAbertura,a.noiteReferenciaEclosao,a.noiteReferenciaAbertura]) if(d!=null&&paraDia(d)===null) throw new Error('Data de abertura/eclosão inválida na origem.')
  }
  for(const t of o.transferencias) if(t.ovosTransferencia!=null&&!contagemValida(t.ovosTransferencia)) throw new Error('OVOS_TRANS inválido na origem.')
  if(o.ocorrencia.dataOcorrencia!=null&&paraDia(o.ocorrencia.dataOcorrencia)===null)throw new Error('DATA_OCORR inválida na origem.')
  if(o.ocorrencia.especieCodigo!==null&&!(ESPECIES as readonly string[]).includes(o.ocorrencia.especieCodigo))throw new Error('Código de espécie inválido na origem.')
  if(o.ninho.situacao!==null&&!(SITUACOES as readonly string[]).includes(o.ninho.situacao))throw new Error('Código de situação inválido na origem.')
  if(o.ninho.historicoNinho!==null&&!(HISTORICOS_NINHO as readonly string[]).includes(o.ninho.historicoNinho))throw new Error('Código de histórico inválido na origem.')
}

export function montarRelatorio(entrada: {
  projetoNome: string; consulta: EntradaConsulta; dados: EntradaFicha[]; fonte: FonteRelatorio; geradoEm: string
}): Relatorio {
  const validacao = descreverConsultaRelatorio(entrada.consulta)
  if (!validacao.ok) throw new Error(validacao.erros.join('; '))
  if (!Number.isFinite(Date.parse(entrada.geradoEm))) throw new Error('Data de geração inválida')
  // Cópia desacopla o download de futuras edições da tela. Nenhum insumo é alterado.
  const e = structuredClone(entrada)
  const filtros = e.consulta.filtros ?? {}
  const registros: RegistroRelatorio[] = []
  const exclusoes = { dataAusente: 0, dataAmbigua: 0, foraPeriodo: 0, outrosFiltros: 0 }
  const ids = new Set<string>()
  for (const origem of e.dados) {
    validarVinculos(origem, e.consulta.projetoId)
    if (ids.has(origem.ninho.id)) throw new Error('Ninho duplicado no conjunto do relatório')
    ids.add(origem.ninho.id)
    const oc = origem.ocorrencia!
    const pares = [
      [filtros.praiaCodigo, oc.localOrigem.praiaCodigo], [filtros.especieCodigo, oc.especieCodigo],
      [filtros.temporadaId, oc.temporadaId], [filtros.situacao, origem.ninho.situacao],
      [filtros.historicoNinho, origem.ninho.historicoNinho], [filtros.natureza, oc.tipoRegistro],
    ]
    if (pares.some(([filtro, valor]) => filtro != null && filtro !== '' && filtro !== valor)) {
      exclusoes.outrosFiltros++; continue
    }
    const data = dataCriterio(origem, e.consulta.criterio)
    if (data.ambigua) { exclusoes.dataAmbigua++; if (!e.consulta.todos) continue }
    if (data.data === null && !data.ambigua && !e.consulta.todos) { exclusoes.dataAusente++; continue }
    if (data.data !== null && paraDia(data.data) === null) throw new Error(`Data de campo inválida no ninho ${origem.ninho.codigoInterno}`)
    if (!e.consulta.todos && !dentroDoPeriodo(data.data!, e.consulta.inicio, e.consulta.fim)) { exclusoes.foraPeriodo++; continue }
    const ficha = montarFichaNinho(origem)
    const linha = montarResumo({ criterio: e.consulta.criterio, fichas: [ficha] })[0]!
    linha.dataCriterio = data.data
    registros.push({ ficha, linha, origem })
  }
  registros.sort((a, b) => (a.linha.dataCriterio??'').localeCompare(b.linha.dataCriterio??'') || a.ficha.ninho.id.localeCompare(b.ficha.ninho.id))
  const parcial = e.fonte.demonstracao || !e.fonte.online || !e.fonte.sincronizacaoConfirmada || !e.fonte.conjuntoCompleto || exclusoes.dataAmbigua>0
  const avisos = ['Layout proposto: aguarda validação da coordenação.', '— significa campo sem valor; zero aparece somente quando observado.']
  if (e.fonte.demonstracao) avisos.push('DEMONSTRAÇÃO: dados fictícios, sem valor de relatório oficial.')
  if (!e.fonte.online) avisos.push('Exportação offline: parcial.')
  if (!e.fonte.sincronizacaoConfirmada) avisos.push('Sincronização com servidor não confirmada: parcial.')
  if (!e.fonte.conjuntoCompleto) avisos.push('Conjunto incompleto: exclusões não apuradas; parcial.')
  if (exclusoes.dataAmbigua) avisos.push('Datas divergentes requerem conferência, sem escolha automática; no modo por período são excluídas.')
  return { projetoNome: e.projetoNome, consulta: e.consulta, geradoEm: e.geradoEm, fonte: e.fonte,
    parcial, versaoFormula: VERSAO_FORMULA, registros, exclusoes: e.fonte.conjuntoCompleto ? exclusoes : null, avisos }
}

export function totalObservado(relatorio: Relatorio, campo: 'vivos' | 'natimortos' | 'ovosNaoEclodidos' | 'ovosFurados' | 'ovosTotais'): {valor:number|null;observados:number;ausentes:number;motivo?:string} {
  const valores = relatorio.registros.map(r => r.linha[campo]).filter((v): v is number => v !== null)
  const soma=valores.length ? valores.reduce((a, b) => a + b, 0) : null
  if(soma!==null&&!Number.isSafeInteger(soma)) return {valor:null,observados:valores.length,ausentes:relatorio.registros.length-valores.length,motivo:'Soma fora da faixa numérica segura; conferir os dados.'}
  return { valor: soma,
    observados: valores.length, ausentes: relatorio.registros.length - valores.length }
}

export function texto(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '—'
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não'
  if (Array.isArray(valor)) return valor.length ? valor.join(', ') : 'Nenhum registrado'
  return String(valor)
}

const COLUNAS_MANUAL = ['N_REGISTRO','ESPECIE','DATA_OCORR','LATITUDE','LONGITUDE','DATUM','BAIRRO','LOCAL_ENDERECO','HORA_OCORR','PRAIA','LOCAL_KM','TIPO_OCORR','OBS','MARCAS_ENC','MARCAS_COL','MARCAS_RET','COMP_CASCO','LARG_CASCO','TUMORES','COLETA_MATERIAL_BIOLOGICO','EVIDENCIA_INT_PESCA','TIPO_EVIDENCIA','SITUACAO','TEMP_TRANSF','OVOS_TRANS','OVOS_FURAD','NAO_VIAVEIS','N_NINHO','PRAIA_DEST_P','LOCAL_KM_P','DATA_ECLOS','DATA_ABERT','HIST_NINHO','VIVOS','NATIMORTOS','OVOS_N_ECL','OVOS_TOT','PCT_VIVOS','TEMP_INCUB','PALAVRAS_CHAVE','VERSAO_FORMULA'] as const
export function camposExportacao(r: RegistroRelatorio): Record<typeof COLUNAS_MANUAL[number], unknown> {
  const o = r.origem.ocorrencia!; const f = r.ficha
  const a = f.abertura.tipo === 'unica' ? f.abertura.abertura : null
  const atual = f.posicaoAtual.local
  return {
    N_REGISTRO: o.numeroRegistro, ESPECIE: o.especieCodigo, DATA_OCORR: o.dataOcorrencia,
    LATITUDE: o.localOrigem.latitude, LONGITUDE: o.localOrigem.longitude, DATUM: o.localOrigem.datum,
    BAIRRO: o.localOrigem.bairro, LOCAL_ENDERECO: o.localOrigem.referencia,
    HORA_OCORR: o.flagrante === true ? o.horaOcorrencia : null, PRAIA: o.localOrigem.praiaCodigo,
    LOCAL_KM: o.localOrigem.localKm, TIPO_OCORR: o.tipoOcorrencia, OBS: o.observacoes,
    MARCAS_ENC: o.marcasEncontradas, MARCAS_COL: o.marcasColocadas, MARCAS_RET: o.marcasRetiradas,
    COMP_CASCO: o.comprimentoCasco, LARG_CASCO: o.larguraCasco, TUMORES: o.tumores,
    COLETA_MATERIAL_BIOLOGICO: o.coletaMaterialBiologico, EVIDENCIA_INT_PESCA: o.evidenciaInteracaoPesca,
    TIPO_EVIDENCIA: o.tipoEvidencia, SITUACAO: f.ninho.situacao, TEMP_TRANSF: f.tempoTransferencia,
    OVOS_TRANS: f.ovosTransferencia, OVOS_FURAD: r.linha.ovosFurados,
    NAO_VIAVEIS: o.especieCodigo === 'DC' ? a?.naoViaveis ?? null : null,
    N_NINHO: f.ninho.situacao === 'T' ? f.numeroNinhoCercado : null,
    PRAIA_DEST_P: f.ninho.situacao === 'P' ? atual.praiaCodigo : null,
    LOCAL_KM_P: f.ninho.situacao === 'P' ? atual.localKm : null,
    DATA_ECLOS: dataCriterio(r.origem, 'ECLOS').data, DATA_ABERT: dataCriterio(r.origem, 'ABERT').data,
    HIST_NINHO: f.ninho.historicoNinho, VIVOS: r.linha.vivos, NATIMORTOS: r.linha.natimortos,
    OVOS_N_ECL: r.linha.ovosNaoEclodidos, OVOS_TOT: r.linha.ovosTotais,
    PCT_VIVOS: r.linha.percentualVivos, TEMP_INCUB: r.linha.tempoIncubacaoDias,
    PALAVRAS_CHAVE: o.palavrasChave, VERSAO_FORMULA: VERSAO_FORMULA,
  }
}

export function gerarJSON(relatorio: Relatorio): string {
  return JSON.stringify({ ...relatorio, registros: relatorio.registros.map(r => ({ ...r, campos: camposExportacao(r) })) }, null, 2)
}

/** Prefixo apostrofo para texto potencialmente executável; JSON conserva o original. */
function celulaCSV(valor: unknown): string {
  let v = valor == null ? '' : Array.isArray(valor) ? valor.join(' | ') : String(valor)
  if (typeof valor === 'string' && /^[\s\u0000-\u001f]*[=+@-]/.test(v)) v = "'" + v
  return '"' + v.replaceAll('"', '""') + '"'
}

export function gerarCSV(relatorio: Relatorio): string {
  const metadados = { RELATORIO_PARCIAL: relatorio.parcial, DEMONSTRACAO: relatorio.fonte.demonstracao,
    CRITERIO: relatorio.consulta.criterio, PERIODO_INICIO: relatorio.consulta.inicio,
    PERIODO_FIM: relatorio.consulta.fim, GERADO_EM: relatorio.geradoEm }
  const linhas = relatorio.registros.map(r => ({ ...metadados, ...camposExportacao(r) }))
  // Cabeçalho também existe para um resultado vazio.
  const campos = [...Object.keys(metadados), ...COLUNAS_MANUAL]
  return '\uFEFF' + [campos.map(celulaCSV).join(';'), ...linhas.map(l => campos.map(c => celulaCSV(l[c as keyof typeof l])).join(';'))].join('\r\n')
}
