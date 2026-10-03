/**
 * Reserva de numeros oficiais (revisao F09).
 *
 * "O servidor verifica a unicidade" nao existe sozinho no Firestore Standard: nao ha validacao de
 * unicidade de campo e nao pode haver Cloud Function (sem Blaze). O desenho e um documento de
 * reserva com chave **deterministica**, criado na mesma transacao online do registro:
 *
 * ```
 * transacao:
 *   - le reserva (chave); se ja existe e e do mesmo operationId => idempotente
 *   - le o documento alvo; exige versao == baseVersion
 *   - grava reserva, documento e projecao de consulta
 * ```
 *
 * Dois aparelhos disputando o mesmo numero: um cria a reserva, o outro recebe "chave ja existente".
 * Sem servidor nao ha numero reservado, e sem numero reservado o registro fica **pendente**, nunca
 * com numero adivinhado.
 *
 * Escopo: `N_REGISTRO` por projeto+temporada e `N_NINHO` por projeto+cercado sao o **padrao
 * assumido**, nao garantia oficial. A confirmacao da coordenacao esta em `STATUS.md`; enquanto nao
 * houver, nenhuma tela promete unicidade oficial.
 */
import type { Instante } from './tipos.ts'

/** Versao do formato da chave. Mudar o formato invalida reservas antigas: versionar e obrigatorio. */
export const RESERVA_V1 = 'reserva-v1'

export const TIPOS_NUMERO = ['N_REGISTRO', 'N_NINHO'] as const
export type TipoNumero = (typeof TIPOS_NUMERO)[number]

export interface PedidoReserva {
  projetoId: string
  tipo: TipoNumero
  /** N_REGISTRO ou N_NINHO, como texto: zeros iniciais fazem parte do numero. */
  numero: string | null
  /** Temporada da desova. `null` deixa o escopo no nivel do projeto. */
  temporadaId?: string | null
  /** Cercado de destino. Obrigatorio para `N_NINHO`. */
  cercadoId?: string | null
  /** Dono da reserva: documento que passa a usar o numero. */
  documentoAlvo: string
  /** Operacao que esta reserving; repete-la nao cria segunda reserva. */
  operationId: string
}

export type ResultadoReserva =
  | { ok: true; chave: string; caminho: string; jaExistia: boolean }
  | { ok: false; motivo: string; numeroPendente: true }

const texto = (v: string | null | undefined): string | null => {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t === '' ? null : t
}

/**
 * Chave deterministica da reserva. `null` devolve motivo, nunca chave "com numero vazio": um numero
 * ausente nao pode virar caminho de documento.
 */
export function chaveReserva(
  pedido: PedidoReserva,
): { ok: true; chave: string } | { ok: false; motivo: string } {
  const projetoId = texto(pedido.projetoId)
  if (!projetoId) return { ok: false, motivo: 'projetoId obrigatorio para reservar numero' }

  const numero = texto(pedido.numero)
  if (!numero) {
    return { ok: false, motivo: 'numero oficial ausente: registro fica pendente de numero' }
  }
  if (/[/#\\]/.test(numero)) {
    return { ok: false, motivo: 'numero oficial invalido para chave de documento' }
  }

  if (pedido.tipo === 'N_REGISTRO') {
    const temporada = texto(pedido.temporadaId) ?? '-'
    return { ok: true, chave: `${RESERVA_V1}/n_registro/${projetoId}/${temporada}/${numero}` }
  }

  const cercado = texto(pedido.cercadoId)
  if (!cercado) {
    return {
      ok: false,
      motivo: 'N_NINHO exige cercado cadastrado: sem ele a unicidade nao tem escopo',
    }
  }
  return { ok: true, chave: `${RESERVA_V1}/n_ninho/${projetoId}/${cercado}/${numero}` }
}

/** Caminho do documento de reserva dentro do projeto. */
export function caminhoReserva(projetoId: string, chave: string): string | null {
  const projeto = texto(projetoId)
  if (!projeto || !chave) return null
  return `projetos/${projeto}/reservas/${encodeURIComponent(chave)}`
}

export interface ReservaConfirmada {
  chave: string
  tipo: TipoNumero
  numero: string
  documentoAlvo: string
  operationId: string
  temporadaId: string | null
  cercadoId: string | null
  criadoEm: Instante
  projetoId: string
}

/** Documento gravado na transacao, no formato snake_case do Firestore. */
export function documentoReserva(reserva: ReservaConfirmada, criadoEm: Instante): Record<string, unknown> {
  return {
    id: reserva.chave,
    projeto_id: reserva.projetoId,
    tipo_numero: reserva.tipo,
    numero: reserva.numero,
    temporada_id: reserva.temporadaId,
    cercado_id: reserva.cercadoId,
    documento_alvo: reserva.documentoAlvo,
    operation_id: reserva.operationId,
    versao_formato: RESERVA_V1,
    criado_em: criadoEm,
  }
}

export function prepararReserva(pedido: PedidoReserva): ResultadoReserva {
  const chave = chaveReserva(pedido)
  if (!chave.ok) return { ok: false, motivo: chave.motivo, numeroPendente: true }
  const caminho = caminhoReserva(pedido.projetoId, chave.chave)
  if (!caminho) {
    return { ok: false, motivo: 'caminho de reserva invalido', numeroPendente: true }
  }
  return { ok: true, chave: chave.chave, caminho, jaExistia: false }
}

/**
 * Leitura da reserva ja gravada na transacao. `mesmoDono` = repeticao da mesma operacao (idempotente);
 * `outroDono` = numero em uso por outro documento.
 */
export function interpretarReservaExistente(
  existente: Record<string, unknown> | null,
  pedido: PedidoReserva,
):
  | { tipo: 'livre' }
  | { tipo: 'mesmoDono' }
  | { tipo: 'outroDono'; documentoAlvo: string } {
  if (!existente) return { tipo: 'livre' }
  if (existente.operation_id === pedido.operationId) return { tipo: 'mesmoDono' }
  return { tipo: 'outroDono', documentoAlvo: String(existente.documento_alvo ?? '') }
}

/** Numero pendente na interface: existe, mas ainda nao esta reservado no servidor. */
export interface NumeroPendente {
  tipo: TipoNumero
  motivo: string
}

export function numeroPendente(tipo: TipoNumero, motivo: string): NumeroPendente {
  return { tipo, motivo }
}

/** Escopo assumido, exposto para a interface explicar ao usuario onde vale a unicidade. */
export function descreverEscopo(tipo: TipoNumero): string {
  return tipo === 'N_REGISTRO'
    ? 'N_REGISTRO: unico por projeto e temporada informada (escopo assumido, nao confirmado)'
    : 'N_NINHO: unico por projeto e cercado (escopo assumido, nao confirmado)'
}

/** Temporada que define o escopo quando o filtro do relatorio a traz. */
export function temporadaDoEscopo(temporadaId: string | null): string | null {
  return texto(temporadaId)
}
