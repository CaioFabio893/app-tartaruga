/**
 * Tipos do dominio. Fonte: docs/DATA_MODEL.md e docs/FIELD_DICTIONARY.md.
 *
 * Regra transversal: ausente e `null`. Zero observado e `0`. Indeterminado do manual e
 * 'I'/'NI'. Nao aplicavel e ausencia do campo mais o motivo. Nunca usar 0 como padrao.
 */

// --- Codigos do manual (p. 2 a 4 do manual de preenchimento) ---

export const ESPECIES = ['CC', 'EI', 'LO', 'CM', 'DC', 'NI'] as const
export type Especie = (typeof ESPECIES)[number]

export const TIPOS_OCORRENCIA = ['CD', 'ML', 'SD', 'ND', 'PI'] as const
export type TipoOcorrencia = (typeof TIPOS_OCORRENCIA)[number]

export const SITUACOES = ['I', 'T', 'P'] as const
export type Situacao = (typeof SITUACOES)[number]

export const TEMPOS_TRANSFERENCIA = ['A', 'B', 'C', 'D', 'E'] as const
export type TempoTransferencia = (typeof TEMPOS_TRANSFERENCIA)[number]

export const HISTORICOS_NINHO = ['PH', 'PA', 'PM', 'PE', 'SU', 'NM', 'OT'] as const
export type HistoricoNinho = (typeof HISTORICOS_NINHO)[number]

export const RESPOSTA_TUMORES = ['S', 'N', 'I'] as const
export type RespostaTumores = (typeof RESPOSTA_TUMORES)[number]

/** Lista fechada de palavras-chave (p. 5-6): sem acento, sem cedilha, no singular. */
export const PALAVRAS_CHAVE = [
  'ALBINO', 'ANOMALO', 'CACHORRO', 'CARANGUEJO', 'CICATRIZ', 'DNA',
  'EPIBIONTE', 'FORMIGA', 'HIBRIDO', 'LAGARTO', 'MUTILADA', 'PESCA',
  'PORCO', 'RAPOSA', 'RATO', 'RAIZ',
] as const
export type PalavraChave = (typeof PALAVRAS_CHAVE)[number]

export const DATUMS = ['SIRGAS2000', 'WGS84'] as const
export type Datum = (typeof DATUMS)[number]

export const ESTADOS_ACOMPANHAMENTO = ['AGUARDANDO', 'ATIVO', 'ABERTO', 'ENCERRADO'] as const
export type EstadoAcompanhamento = (typeof ESTADOS_ACOMPANHAMENTO)[number]

// --- Valor Calendarico do projeto ---

/**
 * Data no calendario do projeto, 'YYYY-MM-DD'. Nao e a data civil.
 * Ver DOMAIN_RULES.md secao 3.
 */
export type DataCampo = string

/** Instante real em ISO 8601 com offset, ex.: '2026-10-02T21:40:00-03:00'. */
export type Instante = string

// --- Entidades ---

export interface Localizacao {
  praiaId: string | null
  praiaCodigo: string | null
  localKm: string | null
  bairro: string | null
  referencia: string | null
  latitude: number | null
  longitude: number | null
  datum: Datum | null
  fonteGps: 'dispositivo' | 'manual' | null
  precisaoGpsM: number | null
  capturadoEm: Instante | null
}

export interface Ocorrencia {
  id: string
  projetoId: string
  temporadaId: string | null
  responsavelId: string | null
  numeroRegistro: string | null
  tipoOcorrencia: TipoOcorrencia
  tipoRegistro: 'REPRODUTIVO' | 'NAO_REPRODUTIVO'
  verificacaoPraiaRealizada: boolean | null
  dataOcorrencia: DataCampo | null
  instanteOcorrencia: Instante | null
  horaOcorrencia: string | null
  noiteReferencia: DataCampo | null
  localOrigem: Localizacao
  marcasEncontradas: string | null
  marcasColocadas: string | null
  marcasRetiradas: string | null
  especieCodigo: Especie | null
  comprimentoCasco: number | null
  larguraCasco: number | null
  tumores: RespostaTumores | null
  coletaMaterialBiologico: string[] | null
  evidenciaInteracaoPesca: boolean | null
  tipoEvidencia: string | null
  palavrasChave: PalavraChave[]
  observacoes: string | null
  /** Preenchido somente quando tipoOcorrencia = 'CD'. Ver DOMAIN_RULES.md secao 2.1. */
  ninhoId: string | null
  criadoPor: string | null
  criadoEm: string
  atualizadoEm: string
}

export interface Transferencia {
  id: string
  ninhoId: string
  destino: 'CERCADO' | 'PRAIA'
  localDestino: Localizacao
  dataTransferencia: DataCampo | null
  instanteTransferencia: Instante | null
  noiteReferencia: DataCampo | null
  tempoTransferencia: TempoTransferencia | null
  /** OVOS_TRANS (p. 3-5): contagem de campo, nao digitada livremente. */
  ovosTransferencia: number | null
  /** N_NINHO (p. 3): numero do ninho dentro do cercado. Texto, preserva zeros. */
  numeroNinhoCercado: string | null
  responsavelId: string | null
  observacoes: string | null
  criadoPor: string | null
  criadoEm: string
}

export interface Visita {
  id: string
  ninhoId: string
  dataVisita: DataCampo
  noiteReferencia: DataCampo | null
  responsavelId: string | null
  /** Lista do PROJETO, nao do manual. Nao confundir com HIST_NINHO. */
  condicao: string | null
  eventos: ('predacao' | 'mare' | 'perda_marcacao' | 'outro')[]
  observacoes: string | null
  criadoPor: string | null
  criadoEm: string
}

/** Ato de eclosao e abertura, com os dados biologicos da escavacao (p. 3-5). */
export interface Abertura {
  id: string
  ninhoId: string
  dataEclosao: DataCampo | null
  instanteEclosao: Instante | null
  noiteReferenciaEclosao: DataCampo | null
  dataAbertura: DataCampo | null
  instanteAbertura: Instante | null
  noiteReferenciaAbertura: DataCampo | null
  horaPrimeiroFilhote: string | null
  horaUltimoFilhote: string | null
  vivos: number | null
  natimortos: number | null
  ovosNaoEclodidos: number | null
  ovosFurados: number | null
  /** NAO_VIAVEIS (p. 3): so para DC e fora de ovosTotais. */
  naoViaveis: number | null
  responsavelId: string | null
  observacoes: string | null
  criadoPor: string | null
  criadoEm: string
}

export interface Ninho {
  id: string
  projetoId: string
  temporadaId: string | null
  /** Chave de ligacao com a ocorrencia CD que o originou. */
  ocorrenciaId: string
  codigoInterno: string
  numeroRegistro: string | null
  /** Imutavel (DOMAIN_RULES.md secao 4.1). */
  localOrigem: Localizacao
  situacao: Situacao | null
  tempoTransferencia: TempoTransferencia | null
  historicoNinho: HistoricoNinho | null
  numeroNinhoCercado: string | null
  /** (projeto) Condicao da excecao do OVOS_TOT. Ver DUVIDA 04. */
  problemaIncubacao: boolean | null
  estadoAcompanhamento: EstadoAcompanhamento
  /** Estado de tela. Nunca substitui SITUACAO nem HIST_NINHO (DOMAIN_RULES.md 1.3). */
  criadoPor: string | null
  criadoEm: string
  atualizadoEm: string
}
