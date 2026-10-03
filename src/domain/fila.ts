/**
 * Contrato da fila offline (revisao F08).
 *
 * O plano antigo comparava `atualizado_em` de dois aparelhos e confiava na escrita offline do SDK.
 * Isso sobrescreve antes de detectar conflito (last-write-wins do Firestore) e pode aplicar a mesma
 * operacao duas vezes. Aqui ficam as regras que `data/fila.ts` implementa em E09:
 *
 * 1. **Fila propria, escrita unica.** O SDK nao grava documento do projeto enquanto a fila esta
 *    pendente; nao se mistura retry da fila com escrita pendente automatica no mesmo documento.
 * 2. **Condicao de concorrencia e `versao`, nao relogio.** `baseVersion` e a versao lida quando a
 *    alteracao foi feita; a gravacao so entra no documento canonico numa **transacao online** que
 *    compara `versao`. Dois aparelhos com a mesma `baseVersion`: um vence, o outro recebe conflito.
 * 3. **Idempotencia.** `operationId` e a chave. A transacao registra a operacao aplicada; reenviar a
 *    mesma operacao (queda depois do commit) confirma e nao reaplica.
 * 4. **Offline nao e confirmacao.** `confirmada` so existe depois da confirmacao do servidor.
 *    Rascunho local e fila pendente sao coisas distintas.
 * 5. **Erro de permissao preserva o rascunho.** O item vai para `erro_permissao` e a tela mostra a
 *    mensagem; nada e reescrito por baixo.
 *
 * Este arquivo e puro: descreve estados e transicoes. Nao importa `firebase` nem `IndexedDB`.
 */
import type { Instante } from './tipos.ts'

export const TIPOS_OPERACAO = ['criar', 'alterar', 'excluirLogico'] as const
export type TipoOperacao = (typeof TIPOS_OPERACAO)[number]

export const ESTADOS_OPERACAO = [
  'pendente',
  'enviando',
  'confirmada',
  'conflito',
  'erro_permissao',
  'descartada',
] as const
export type EstadoOperacao = (typeof ESTADOS_OPERACAO)[number]

/** Estados a partir dos quais a operacao nao volta para o fluxo automatico. */
export const ESTADOS_FINAIS: EstadoOperacao[] = ['confirmada', 'descartada']

export interface OperacaoPendente {
  /** Chave de idempotencia. UUID gerado no dispositivo; identifica a operacao, nao o documento. */
  operationId: string
  tipo: TipoOperacao
  /** Caminho do documento canonico, ex.: 'projetos/p1/ninhos/n1'. */
  caminho: string
  /** Versao lida na leitura que originou a alteracao. `null` quando o documento ainda nao existe. */
  baseVersion: number | null
  /** Documento a gravar, ja com `versao = baseVersion + 1`. */
  payload: Record<string, unknown>
  estado: EstadoOperacao
  tentativas: number
  ultimoErro: string | null
  /** Instante local de criacao da operacao. Nao e criterio de concorrencia. */
  criadoEm: Instante
  /** Versao do documento no servidor depois de confirmada. `null` enquanto nao confirmada. */
  versaoConfirmada: number | null
}

export type ResultadoEnvio =
  | { tipo: 'confirmada'; versao: number }
  | { tipo: 'conflito'; versaoServidor: number; mensagem: string }
  | { tipo: 'permissao'; mensagem: string }
  | { tipo: 'transacao_indisponivel'; mensagem: string }
  | { tipo: 'idempo_ja_aplicada'; versao: number }

/**
 * Transicao de estado da fila. Funcao pura: o mesmo resultado produz sempre o mesmo estado, o que
 * torna a fila auditavel e permite reconexao sem dupla aplicacao.
 */
export function proximoEstado(
  estado: EstadoOperacao,
  resultado: ResultadoEnvio,
): { estado: EstadoOperacao; versaoConfirmada: number | null; ultimoErro: string | null } {
  if (ESTADOS_FINAIS.includes(estado)) {
    return { estado, versaoConfirmada: null, ultimoErro: null }
  }

  switch (resultado.tipo) {
    case 'confirmada':
      return { estado: 'confirmada', versaoConfirmada: resultado.versao, ultimoErro: null }
    case 'idempo_ja_aplicada':
      // Queda depois do commit: a operacao ja estava no servidor.
      return { estado: 'confirmada', versaoConfirmada: resultado.versao, ultimoErro: null }
    case 'conflito':
      return { estado: 'conflito', versaoConfirmada: null, ultimoErro: resultado.mensagem }
    case 'permissao':
      // Rascunho preservado: nao vira 'descartada' e nao volta a 'pendente' sozinho.
      return { estado: 'erro_permissao', versaoConfirmada: null, ultimoErro: resultado.mensagem }
    case 'transacao_indisponivel':
      return { estado: 'pendente', versaoConfirmada: null, ultimoErro: resultado.mensagem }
  }
}

/** Uma operacao so entra em envio automatico a partir de `pendente`. */
export function podeEnviarAutomaticamente(op: OperacaoPendente): boolean {
  return op.estado === 'pendente'
}

/** Rascunho do usuario sobrevive a conflito e a erro de permissao. */
export function preservaRascunho(estado: EstadoOperacao): boolean {
  return estado === 'conflito' || estado === 'erro_permissao'
}

/**
 * Duas operacoes com o mesmo `operationId` sao a mesma operacao: o reenvio nao cria duplicata nem
 * reserva numero duas vezes.
 */
export function mesmaOperacao(a: OperacaoPendente, b: OperacaoPendente): boolean {
  return a.operationId === b.operationId
}

/**
 * Fila vazia de verdade: `temPendencias` e falso quando nao ha item em `pendente`, `enviando`,
 * `conflito` ou `erro_permissao`. Usado pela interface para nunca dizer "sincronizado" por cache.
 */
export function temPendencias(operacoes: readonly OperacaoPendente[]): boolean {
  return operacoes.some((o) => o.estado !== 'confirmada' && o.estado !== 'descartada')
}

/** Texto exibido, sem prometer sincronizacao que nao aconteceu (AGENTS.md). */
export function rotuloEstado(estado: EstadoOperacao, conectado: boolean): string {
  switch (estado) {
    case 'pendente':
      return conectado ? 'alteração pendente de sincronização' : 'alteração pendente de sincronização (sem internet)'
    case 'enviando':
      return 'enviando ao servidor'
    case 'confirmada':
      return 'sincronizado confirmado'
    case 'conflito':
      return 'conflito entre aparelhos: revisar'
    case 'erro_permissao':
      return 'sem permissão para gravar: rascunho preservado'
    case 'descartada':
      return 'descartada: sem gravação no servidor'
  }
}

/** Ordena a fila por criacao, com operacoes do mesmo instante desempatadas pelo id. */
export function ordenarFila(operacoes: readonly OperacaoPendente[]): OperacaoPendente[] {
  return [...operacoes].sort((a, b) => {
    const porCriacao = a.criadoEm.localeCompare(b.criadoEm)
    return porCriacao !== 0 ? porCriacao : a.operationId.localeCompare(b.operationId)
  })
}
