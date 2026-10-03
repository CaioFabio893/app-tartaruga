/**
 * Consultas de relatorio por criterio (revisao F07).
 *
 * Problema resolvido: `DATA_MODEL.md` §7 antigo propunha varrer todos os ninhos e abrir as
 * aberturas de cada um para achar o periodo. Isso baixa o banco inteiro, e praia/especie/temporada
 * nem existem na abertura. Aqui as tres consultas sao concretas, com campos reais e um indice.
 *
 * Decisao: **projecao por projeto** (`projetos/{p}/consultas/{linhaId}`, `DATA_MODEL.md` §4.10) em
 * vez de `collectionGroup('aberturas')`. As vantagens:
 * - `projeto_id` e a primeira igualdade do filtro, e as regras v2 nao precisam varrer projetos;
 * - os tres criterios convivem numa colecao, com igualdades escalares para filtros opcionais;
 *   cada combinacao exige indice proprio. Nao combinar multiplos array-contains (D-014);
 * - a contagem de "excluidos por data ausente" (REPORT_SPEC §2) vira uma consulta propria e
 *   escopada, sem inventar numero.
 *
 * Este arquivo nao importa `firebase`: ele descreve a consulta. `data/` traduz o descritor para o
 * SDK e o emulador valida (E04).
 */
import type { DataCampo, Especie, HistoricoNinho, Situacao } from './tipos.ts'
import { dentroDoPeriodo, paraDia } from './datas.ts'

/** Criterio do periodo: por qual data de campo o registro entra no relatorio. */
export const CRITERIOS = ['OCORR', 'ECLOS', 'ABERT'] as const
export type Criterio = (typeof CRITERIOS)[number]

/** Descricao legivel de cada criterio, para a interface e para o PDF. */
export const ROTULO_CRITERIO: Record<Criterio, string> = {
  OCORR: 'DATA_OCORR',
  ECLOS: 'DATA_ECLOS',
  ABERT: 'DATA_ABERT',
}

/** Campo do calendario do projeto que a projetiva materializa para cada criterio. */
export const CAMPO_DATA_CRITERIO: Record<Criterio, string> = {
  OCORR: 'data_ocorrencia',
  ECLOS: 'noite_referencia_eclosao',
  ABERT: 'noite_referencia_abertura',
}

export interface FiltrosRelatorio {
  praiaCodigo?: string | null
  especieCodigo?: Especie | null
  temporadaId?: string | null
  situacao?: Situacao | null
  historicoNinho?: HistoricoNinho | null
  natureza?: 'REPRODUTIVO' | 'NAO_REPRODUTIVO' | null
}

export type TipoRestricao = 'igual' | 'arrayContem' | 'maiorOuIgual' | 'menorOuIgual' | 'ordenar'

export interface Restricao {
  tipo: TipoRestricao
  campo: string
  valor?: unknown
  direcao?: 'asc' | 'desc'
}

export interface ConsultaDescrita {
  /** Colecao sempre por projeto: nenhuma consulta atravessa projetos. */
  colecao: `projetos/${string}/consultas`
  restricoes: Restricao[]
  ordem: Restricao[]
  /** Paginao: documentos lidos por vez. */
  limite: number
  /**
   * Limite superior redundante para conferencia; a consulta ja aplica <= fim no servidor.
   */
  corteSuperior: string
  /** true quando a consulta conta documentos em vez de lista-los. */
  contagem: boolean
  /** Observacao exibida na interface e no PDF. */
  nota: string
}

/** Filtros aceitos por chave, para nao aceitar coluna inventada. */
export const CAMPOS_FILTRO = {
  praiaCodigo: 'praia_codigo',
  especieCodigo: 'especie_codigo',
  temporadaId: 'temporada_id',
  situacao: 'situacao',
  historicoNinho: 'historico_ninho',
  natureza: 'tipo_registro',
} as const satisfies Record<keyof FiltrosRelatorio, string>

/** Prefixo dos tokens de filtro dentro do array `filtros`. */
export const PREFIXO_TOKEN = {
  praiaCodigo: 'praia',
  especieCodigo: 'esp',
  temporadaId: 'temp',
  situacao: 'sit',
  historicoNinho: 'hist',
  natureza: 'nat',
} as const satisfies Record<keyof FiltrosRelatorio, string>

/** Paginao padrao. Acima de `LIMITE_MAXIMO` a interface avisa que o resultado foi truncado. */
export const LIMITE_PAGINA = 500
export const LIMITE_MAXIMO = 5000

/**
 * Tokens deterministicos dos filtros opcionais. Filtro ausente **nao** gera token: sem token, o
 * filtro nao restringe, que e o comportamento correto de filtro opcional.
 */
export function tokensDeFiltro(filtros: FiltrosRelatorio): string[] {
  const tokens: string[] = []
  for (const chave of Object.keys(CAMPOS_FILTRO) as Array<keyof FiltrosRelatorio>) {
    const valor = filtros[chave]
    if (valor === null || valor === undefined) continue
    const texto = String(valor).trim()
    if (texto === '') continue
    tokens.push(`${PREFIXO_TOKEN[chave]}:${texto}`)
  }
  return tokens.sort()
}

/** Validacao de filtros e periodo. Devolve o motivo, nunca um filtro "corrigido" em silencio. */
export interface EntradaConsulta {
  projetoId: string
  criterio: Criterio
  inicio: DataCampo | null
  fim: DataCampo | null
  filtros?: FiltrosRelatorio
  limite?: number
}

export interface ConsultaRejeitada {
  ok: false
  erros: string[]
}

export type ResultadoConsulta = { ok: true; consulta: ConsultaDescrita } | ConsultaRejeitada

function restricoesDosFiltros(filtros: FiltrosRelatorio): Restricao[] {
  return (Object.keys(CAMPOS_FILTRO) as Array<keyof FiltrosRelatorio>)
    .filter(chave => filtros[chave] != null && String(filtros[chave]).trim() !== '')
    .map(chave => ({ tipo: 'igual', campo: CAMPOS_FILTRO[chave], valor: filtros[chave] }))
}

const NOTA_PERIODO = 'Periodo inclusivo: ambas as pontas aplicadas no servidor. ' +
  'Filtros escalares combinados exigem indices especificos, a validar em E04.'

export const NOTA_AUSENTES =
  'Contagem escopada de registros sem a data do criterio: mesma origem e mesmos filtros do ' +
  'relatorio. Sem esse escopo, REPORT_SPEC.md §2 proibe exibir o numero.'

/**
 * Descreve a consulta do relatorio por criterio. Nao enumera ninhos: o filtro de intervalo e
 * obligatorio e a leitura e paginada.
 */
export function descreverConsultaRelatorio(entrada: EntradaConsulta): ResultadoConsulta {
  const erros = validarEntrada(entrada)
  if (erros.length > 0) return { ok: false, erros }
  // `validarEntrada` ja recusou datas invalidas; o tipo ainda nao sabe disso.
  if (!dataISO(entrada.fim)) return { ok: false, erros: ['data final do periodo invalida'] }
  const { projetoId, criterio, inicio, fim } = entrada
  const limite = entrada.limite ?? LIMITE_PAGINA

  const restricoes: Restricao[] = [
    { tipo: 'igual', campo: 'projeto_id', valor: projetoId },
    { tipo: 'igual', campo: 'criterio', valor: criterio },
    ...restricoesDosFiltros(entrada.filtros ?? {}),
    { tipo: 'maiorOuIgual', campo: 'data_criterio', valor: inicio },
    { tipo: 'menorOuIgual', campo: 'data_criterio', valor: fim },
  ]

  return {
    ok: true,
    consulta: {
      colecao: `projetos/${projetoId}/consultas`,
      restricoes,
      ordem: [
        { tipo: 'ordenar', campo: 'data_criterio', direcao: 'asc' },
        { tipo: 'ordenar', campo: '__name__', direcao: 'asc' },
      ],
      limite,
      corteSuperior: fim,
      contagem: false,
      nota: NOTA_PERIODO,
    },
  }
}

/**
 * Consulta de contagem dos registros **sem** a data do criterio, com o mesmo escopo do relatório.
 * É o que permite exibir `excluídos por data ausente: M` sem inventar número (F07).
 */
export function descreverConsultaAusentes(entrada: EntradaConsulta): ResultadoConsulta {
  const erros = validarEntrada(entrada)
  if (erros.length > 0) return { ok: false, erros }
  const { projetoId, criterio } = entrada

  const restricoes: Restricao[] = [
    { tipo: 'igual', campo: 'projeto_id', valor: projetoId },
    { tipo: 'igual', campo: 'criterio', valor: criterio },
    ...restricoesDosFiltros(entrada.filtros ?? {}),
    { tipo: 'igual', campo: 'data_criterio', valor: null },
  ]

  return {
    ok: true,
    consulta: {
      colecao: `projetos/${projetoId}/consultas`,
      restricoes,
      ordem: [],
      limite: 0,
      corteSuperior: '',
      contagem: true,
      nota: NOTA_AUSENTES,
    },
  }
}

/** `paraDia` ja rejeita data inexistente (2026-02-30) e data mal formatada. */
const dataISO = (v: string | null): v is string => paraDia(v) !== null

function validarEntrada(entrada: EntradaConsulta): string[] {  const erros: string[] = []
  if (!entrada.projetoId?.trim()) erros.push('projetoId obrigatorio: sem ele a consulta nao isola dados')
  if (!(CRITERIOS as readonly string[]).includes(entrada.criterio)) {
    erros.push(`criterio invalido: use ${CRITERIOS.join(', ')}`)
  }
  if (paraDia(entrada.inicio) === null) erros.push('data inicial do periodo invalida')
  if (paraDia(entrada.fim) === null) erros.push('data final do periodo invalida')
  if (erros.length > 0) return erros

  if (!dentroDoPeriodo(entrada.inicio, entrada.inicio, entrada.fim)) {
    erros.push('periodo invertido ou vazio: inicio precisa ser menor ou igual a fim')
  }
  if (entrada.limite !== undefined && (!Number.isSafeInteger(entrada.limite) || entrada.limite < 1 || entrada.limite > LIMITE_MAXIMO)) {
    erros.push('limite precisa ser inteiro entre 1 e 5000')
  }
  return erros
}

/** Indica se o filtro cabe em uma pagina sem truncamento. */
export function excedeLimite(quantidade: number, limite: number = LIMITE_MAXIMO): boolean {
  return quantidade > limite
}

export interface IndiceDescricao {
  colecao: string
  campos: string[]
  justify: string
}

/**
 * Índices que as consultas acima exigem. `firestore.indexes.json` é escrito em E04 e conferido no
 * emulador; aqui fica a fonte da verdade do desenho, com a consulta que justifica cada um.
 */
export const INDICES: IndiceDescricao[] = [
  {
    colecao: 'consultas',
    campos: ['projeto_id ASC', 'criterio ASC', 'data_criterio ASC', '__name__ ASC'],
    justify: 'relatorio por ocorrencia, eclosao ou abertura com filtros opcionais (F07)',
  },
  {
    colecao: 'ocorrencias',
    campos: ['projeto_id ASC', 'data_ocorrencia ASC', '__name__ ASC'],
    justify: 'lista de lancamentos recentes e conferencia da projecao OCORR',
  },
  {
    colecao: 'ocorrencias',
    campos: ['projeto_id ASC', 'ninho_id ASC'],
    justify: 'descobrir CD sem ninho vinculado',
  },
  {
    colecao: 'ninhos',
    campos: ['projeto_id ASC', 'situacao ASC', 'atualizado_em DESC'],
    justify: 'painel de acompanhamento',
  },
  {
    colecao: 'ninhos',
    campos: ['projeto_id ASC', 'temporada_id ASC', 'atualizado_em DESC'],
    justify: 'filtro por temporada',
  },
  {
    colecao: 'reservas',
    campos: ['projeto_id ASC', 'numero ASC', 'criado_em DESC'],
    justify: 'auditoria dos numeros oficiais reservados (DATA_MODEL.md §6)',
  },
]
