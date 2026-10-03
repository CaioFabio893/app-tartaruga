/**
 * Calculos derivados. Fonte: DOMAIN_RULES.md secao 5.
 *
 * O manual diz que OVOS_TOT, PCT_VIVOS e TEMP_INCUB sao preenchidos nas fichas de campo e
 * "nao devendo ser digitados no computador" (p. 6). Aqui eles sao calculados e versionados.
 *
 * Princípio: componente ausente produz resultado **ausente** (null), nunca zero.
 */
import type { Abertura, HistoricoNinho, Situacao, TipoOcorrencia } from './tipos.ts'
import { diferencasDias, paraDia } from './datas.ts'

/** Versao das formulas gravadas com o valor, para recalculo auditavel. */
export const VERSAO_FORMULA = 'v2'

export interface Derivado<T> {
  valor: T | null
  /** Por que ficou vazio, quando ficou. Aparece na interface. */
  motivo: string | null
  versao: string
}

const vazio = <T>(motivo: string): Derivado<T> => ({ valor: null, motivo, versao: VERSAO_FORMULA })
const ok = <T>(valor: T): Derivado<T> => ({ valor, motivo: null, versao: VERSAO_FORMULA })

export const contagemValida = (valor: number): boolean => Number.isSafeInteger(valor) && valor >= 0

export interface ContextoCalculo {
  tipoOcorrencia: TipoOcorrencia
  situacao: Situacao | null
  historicoNinho: HistoricoNinho | null
  /** Problema durante a incubacao. (projeto) Ver DUVIDA 04 de DOMAIN_RULES.md. */
  problemaIncubacao: boolean | null
  /** OVOS_TRANS registrado em transferencia (p. 4). */
  ovosTransferencia: number | null
  dataOcorrencia: string | null
  dataEclosao: string | null
}

export interface ComponentesOvos {
  vivos: number | null
  natimortos: number | null
  ovosNaoEclodidos: number | null
  ovosFurados: number | null
}

/**
 * OVOS_TOT (p. 6).
 *
 * Regra normal: vivos + natimortos + ovos nao eclodidos + ovos furados.
 * NAO_VIAVEIS nao entra (p. 4).
 *
 * Excecao: "apenas em casos excepcionais, quando o ninho tiver sido transferido (SITUACAO = P ou T) e
 * tenha havido algum problema com ele durante a incubacao (predacao ou perda, independente do fator
 * causador), o valor do campo OVOS_TRANS sera adotado como sendo o valor para OVOS_TOT".
 *
 * Se `problemaIncubacao` for null, a excecao NAO e aplicada: sem dado, sem excecao silenciosa.
 */
export function calcularOvosTotais(
  componentes: ComponentesOvos,
  ctx: ContextoCalculo,
): Derivado<number> {
  if (ctx.tipoOcorrencia !== 'CD') return vazio('OVOS_TOT se aplica a ninhos com TIPO_OCORR = CD')

  const transferenciaAplicavel = ctx.situacao === 'P' || ctx.situacao === 'T'
  if (transferenciaAplicavel) {
    if (ctx.problemaIncubacao === true) {
      if (ctx.ovosTransferencia === null) {
        return vazio('excecao do total se aplica, mas OVOS_TRANS nao foi registrado')
      }
      if (!contagemValida(ctx.ovosTransferencia)) return vazio('OVOS_TRANS precisa ser inteiro nao negativo')
      return ok(ctx.ovosTransferencia)
    }
    if (ctx.problemaIncubacao === null) {
      return vazio('ha transferencia, mas o problema durante a incubacao nao foi informado')
    }
  }

  const partes: Array<[string, number | null]> = [
    ['VIVOS', componentes.vivos],
    ['NATIMORTOS', componentes.natimortos],
    ['OVOS_N_ECL', componentes.ovosNaoEclodidos],
    ['OVOS_FURAD', componentes.ovosFurados],
  ]
  const faltando = partes.filter(([, v]) => v === null).map(([nome]) => nome)
  if (faltando.length > 0) {
    return vazio(`total indefinido: ${faltando.join(', ')} nao observado(s)`)
  }
  if (partes.some(([, valor]) => valor !== null && !contagemValida(valor))) {
    return vazio('contagens de ovos precisam ser inteiros nao negativos')
  }

  const total =
    (componentes.vivos as number) +
      (componentes.natimortos as number) +
      (componentes.ovosNaoEclodidos as number) +
      (componentes.ovosFurados as number)
  if (!contagemValida(total)) return vazio('total de ovos fora da faixa segura')
  return ok(total)
}

/**
 * PCT_VIVOS (p. 6): vivos / ovos totais * 100.
 * So se aplica com TIPO_OCORR = CD, HIST_NINHO = SU e OVOS_TOT > 0.
 */
export function calcularPercentualVivos(
  vivos: number | null,
  ovosTotais: Derivado<number>,
  ctx: Pick<ContextoCalculo, 'tipoOcorrencia' | 'historicoNinho'>,
): Derivado<number> {
  if (ctx.tipoOcorrencia !== 'CD') return vazio('PCT_VIVOS se aplica a TIPO_OCORR = CD')
  if (ctx.historicoNinho !== 'SU') return vazio('PCT_VIVOS se aplica a HIST_NINHO = SU')
  if (ovosTotais.valor === null) return vazio(ovosTotais.motivo ?? 'OVOS_TOT indisponivel')
  if (ovosTotais.valor <= 0) return vazio('OVOS_TOT precisa ser maior que zero')
  if (vivos === null) return vazio('VIVOS nao observado')
  if (!contagemValida(vivos) || !contagemValida(ovosTotais.valor) || vivos > ovosTotais.valor) {
    return vazio('VIVOS e OVOS_TOT inconsistentes: revisar contagens')
  }

  const bruto = (vivos / ovosTotais.valor) * 100
  return ok(Math.round(bruto * 100) / 100)
}

/**
 * TEMP_INCUB (p. 6): dias entre a postura e a emergencia de pelo menos um filhote.
 * So com TIPO_OCORR = CD, HIST_NINHO = SU e as duas datas preenchidas.
 */
export function calcularTempoIncubacao(
  dataOcorrencia: string | null,
  dataEclosao: string | null,
  ctx: Pick<ContextoCalculo, 'tipoOcorrencia' | 'historicoNinho'>,
): Derivado<number> {
  if (ctx.tipoOcorrencia !== 'CD') return vazio('TEMP_INCUB se aplica a TIPO_OCORR = CD')
  if (ctx.historicoNinho !== 'SU') return vazio('TEMP_INCUB se aplica a HIST_NINHO = SU')
  if (!dataOcorrencia) {
    return vazio('DATA_OCORR em branco: desova localizada depois, tempo nao aplicavel')
  }
  if (!dataEclosao) return vazio('DATA_ECLOS nao preenchida')
  if (paraDia(dataOcorrencia) === null || paraDia(dataEclosao) === null) {
    return vazio('datas de campo invalidas')
  }

  const dias = diferencasDias(dataOcorrencia, dataEclosao)
  if (dias < 0) return vazio('DATA_ECLOS anterior a postura')
  return ok(dias)
}

/** Resultado derivado completo de uma abertura. */
export interface DerivadosAbertura {
  ovosTotais: Derivado<number>
  percentualVivos: Derivado<number>
  tempoIncubacao: Derivado<number>
}

export function calcularDerivados(abertura: Abertura, ctx: ContextoCalculo): DerivadosAbertura {
  const componentes: ComponentesOvos = {
    vivos: abertura.vivos,
    natimortos: abertura.natimortos,
    ovosNaoEclodidos: abertura.ovosNaoEclodidos,
    ovosFurados: abertura.ovosFurados,
  }

  const ovosTotais = calcularOvosTotais(componentes, ctx)
  return {
    ovosTotais,
    percentualVivos: calcularPercentualVivos(abertura.vivos, ovosTotais, ctx),
    tempoIncubacao: calcularTempoIncubacao(ctx.dataOcorrencia, abertura.dataEclosao, ctx),
  }
}
