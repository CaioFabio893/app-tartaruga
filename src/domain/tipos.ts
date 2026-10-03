/**
 * Tipos do dominio. Fonte: docs/DATA_MODEL.md e docs/FIELD_DICTIONARY.md.
 *
 * Regra transversal: ausente e `null`. Zero observado e `0`. Indeterminado do manual e
 * 'I'/'NI'. Nao aplicavel e ausencia do campo mais o motivo. Nunca usar 0 como padrao.
 *
 * Regra de dono unico (DATA_MODEL.md 3): cada campo tem uma unica entidade dona. `Ninho` nao
 * repete `numero_registro`, `local_origem`, `tempo_transferencia` nem `numero_ninho_cercado`; a
 * ficha e o relatorio obtem esses valores por juncao com `ocorrencia_id` e por derivacao
 * (`agregado.ts`). `Transferencia` nao tem `ovos_furados`: `OVOS_FURAD` pertence a `Abertura`,
 * para `OVOS_TOT` nao somar a mesma contagem duas vezes.
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

/** Lista fechada de palavras-chave (p. 6-7): sem acento, sem cedilha, no singular. */
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

/** Instante real em ISO 8601 com offset, ex.: '2026-10-02T21:40:00-03:00'. Sempre fuso do projeto. */
export type Instante = string

/**
 * Trilha de autoria e concorrencia, presente em **todas** as entidades gravadas.
 *
 * `versao` e o criterio de concorrencia: o servidor incrementa a cada gravacao confirmada e uma
 * alteracao so e aceita quando a versao lida ainda e a esperada (OFFLINE.md, revisao F08).
 * Nunca comparar `atualizadoEm` de dispositivos diferentes.
 */
export interface Trilha {
  criadoPor: string | null
  criadoEm: string
  atualizadoPor: string | null
  atualizadoEm: string
  /** Versao de concorrencia. Documento novo nasce com 1. */
  versao: number
}


// --- Entidades ---

/**
 * Projeto. Dono da lista de praia, temporada, cercado e da equipe.
 *
 * `fuso` e nome IANA do fuso do projeto (revisao F11). `null` significa fuso nao confirmado: o app
 * nao converte e sinaliza, em vez de assumir um deslocamento. Nao existe fuso padrao fixo no codigo.
 */
export interface Projeto {
  id: string
  nome: string
  sigla: string
  ativo: boolean
  fuso: string | null
  criadoEm: string
  versao: number
}

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

export interface Ocorrencia extends Trilha {
  id: string
  projetoId: string
  temporadaId: string | null
  responsavelId: string | null
  /** N_REGISTRO (p. 1). Dono unico deste numero; texto, preserva zeros iniciais. */
  numeroRegistro: string | null
  tipoOcorrencia: TipoOcorrencia
  tipoRegistro: 'REPRODUTIVO' | 'NAO_REPRODUTIVO'
  verificacaoPraiaRealizada: boolean | null
  /** Animal observado e resposta explicita; nao inferir a partir de hora conhecida. */
  flagrante: boolean | null
  dataOcorrencia: DataCampo | null
  instanteOcorrencia: Instante | null
  horaOcorrencia: string | null
  noiteReferencia: DataCampo | null
  /** Imutavel (DOMAIN_RULES.md 4.1). Tambem e a localizacao original do ninho criado por CD. */
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
}

export interface Transferencia extends Trilha {
  id: string
  projetoId: string
  ninhoId: string
  destino: 'CERCADO' | 'PRAIA'
  /** Escopo da reserva de N_NINHO (DATA_MODEL.md 6). `null` enquanto o cercado nao estiver cadastrado. */
  cercadoId: string | null
  localDestino: Localizacao
  dataTransferencia: DataCampo | null
  instanteTransferencia: Instante | null
  noiteReferencia: DataCampo | null
  /** TEMP_TRANSF (p. 4). Dono unico deste campo. */
  tempoTransferencia: TempoTransferencia | null
  /** OVOS_TRANS (p. 4): contagem observada, informada pela equipe; nao e calculo derivado. */
  ovosTransferencia: number | null
  /** N_NINHO (p. 4): numero do ninho dentro do cercado. Texto, preserva zeros. Dono unico. */
  numeroNinhoCercado: string | null
  /** Ordem confirmada na sincronizacao; desempate da posicao atual (DATA_MODEL.md 5.1). */
  sequencia: number | null
  responsavelId: string | null
  observacoes: string | null
}

export interface Visita extends Trilha {
  id: string
  projetoId: string
  ninhoId: string
  dataVisita: DataCampo
  noiteReferencia: DataCampo | null
  responsavelId: string | null
  /** Lista do PROJETO, nao do manual. Nao confundir com HIST_NINHO. */
  condicao: string | null
  eventos: ('predacao' | 'mare' | 'perda_marcacao' | 'outro')[]
  observacoes: string | null
}

/** Ato de eclosao e abertura, com os dados biologicos da escavacao (p. 4-6). */
export interface Abertura extends Trilha {
  id: string
  projetoId: string
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
  /** OVOS_FURAD (p. 4). Dono unico: a mesma contagem nao e registrada tambem na transferencia. */
  ovosFurados: number | null
  /** NAO_VIAVEIS (p. 4): so para DC e fora de ovosTotais. */
  naoViaveis: number | null
  responsavelId: string | null
  observacoes: string | null
}

/**
 * Ninho. Existe apenas para CD e nao guarda copia de campo da ocorrencia (DATA_MODEL.md 3).
 *
 * `numeroRegistro`, a localizacao original, `tempoTransferencia` e `numeroNinhoCercado` sao lidos
 * por juncao com `ocorrenciaId` ou derivados do historico de transferencias (`agregado.ts`).
 */
export interface Ninho extends Trilha {
  id: string
  projetoId: string
  temporadaId: string | null
  /** Chave de ligacao com a ocorrencia CD que o originou. */
  ocorrenciaId: string
  codigoInterno: string
  situacao: Situacao | null
  historicoNinho: HistoricoNinho | null
  /** (projeto) Condicao da excecao do OVOS_TOT. Ver DUVIDA 04. */
  problemaIncubacao: boolean | null
  /** Estado de tela. Nunca substitui SITUACAO nem HIST_NINHO (DOMAIN_RULES.md 1.3). */
  estadoAcompanhamento: EstadoAcompanhamento
}

