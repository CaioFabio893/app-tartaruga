/**
 * Ficha do ninho como visao, com um dono por campo (revisao F10).
 *
 * Antes: `Ninho` repetia `numero_registro`, `local_origem`, `tempo_transferencia` e
 * `numero_ninho_cercado`, e `Transferencia` repetia tempo/cercado. Com duas copias, o relatorio
 * podia somar `OVOS_FURAD` duas vezes ou exibir um `N_NINHO` que nao era da transferencia que
 * definiu a posicao atual.
 *
 * Aqui cada valor tem **uma** origem:
 * - identificacao e local original: `Ocorrencia` (via `ninho.ocorrenciaId`);
 * - tempo e numero do cercado: a transferencia que define a posicao atual;
 * - contagens biologicas: a abertura de referencia;
 * - derivados: `calculos.ts`, com versao.
 *
 * Nenhuma escolha silenciosa: quando ha mais de uma abertura com dados biologicos, o resultado
 * sai marcado como ambiguo e a decisao fica com a pessoa usuaria (DATA_MODEL.md §5.3).
 */
import {
  calcularDerivados,
  contagemValida,
  type ContextoCalculo,
  type DerivadosAbertura,
} from './calculos.ts'
import { compararDatas, paraDia } from './datas.ts'
import { compararInstantes } from './fuso.ts'
import type {
  Abertura,
  Localizacao,
  Ninho,
  Ocorrencia,
  Transferencia,
  Visita,
} from './tipos.ts'

export interface EntradaFicha {
  ninho: Ninho
  ocorrencia: Ocorrencia | null
  transferencias: Transferencia[]
  aberturas: Abertura[]
  /** Acompanhamento do projeto; opcional em conjuntos antigos. Nunca define HIST_NINHO. */
  visitas?: Visita[]
}

export interface OrigemPosicao {
  tipo: 'transferencia' | 'ocorrencia'
  transferenciaId: string | null
  local: Localizacao
}

/** Resultado da escolha da abertura de referencia (DATA_MODEL.md §5.3). */
export type EscolhaAbertura =
  | { tipo: 'unica'; abertura: Abertura; complementares: Abertura[] }
  | { tipo: 'ambigua'; candidatas: Abertura[]; motivo: string }

export interface FichaNinho {
  ninho: Ninho
  ocorrencia: Ocorrencia | null
  /** Ordenacao deterministica do historico (DATA_MODEL.md §5.1). */
  transferenciasOrdenadas: Transferencia[]
  abertura: EscolhaAbertura
  posicaoAtual: OrigemPosicao
  /** Derivado da transferencia que define a posicao atual; null quando nunca houve transferencia. */
  tempoTransferencia: Transferencia['tempoTransferencia']
  /** N_NINHO da ultima transferencia para o cercado. */
  numeroNinhoCercado: string | null
  /** OVOS_TRANS da transferencia que define a posicao atual (fonte unica, §5.4). */
  ovosTransferencia: number | null
  derivados: DerivadosAbertura | null
  /** Alertas de fonte, exibidos na ficha e no PDF. Nenhum e resolvido sozinho. */
  avisos: string[]
}

/**
 * Ordena transferencias por instante, data, sequencia confirmada e, por ultimo, id. Ordenar so por
 * data do dia faz duas transferencias do mesmo dia inverterem a posicao atual.
 */
export function ordenarTransferencias(lista: Transferencia[]): Transferencia[] {
  return [...lista].sort((a, b) => {
    const porInstante = compararInstantes(a.instanteTransferencia, b.instanteTransferencia)
    if (porInstante !== null && porInstante !== 0) return porInstante
    const porData = compararDatas(a.dataTransferencia, b.dataTransferencia)
    if (porData !== null && porData !== 0) return porData
    const sa = a.sequencia
    const sb = b.sequencia
    if (typeof sa === 'number' && typeof sb === 'number' && sa !== sb) return sa - sb
    if (typeof sa === 'number' && sb === null) return -1
    if (sa === null && typeof sb === 'number') return 1
    const porCriacao = a.criadoEm.localeCompare(b.criadoEm)
    if (porCriacao !== 0) return porCriacao
    return a.id.localeCompare(b.id)
  })
}

const temDadosBiologicos = (a: Abertura): boolean =>
  a.vivos !== null ||
  a.natimortos !== null ||
  a.ovosNaoEclodidos !== null ||
  a.ovosFurados !== null

const aberturaRealizada = (a: Abertura): boolean => a.dataAbertura !== null || a.instanteAbertura !== null

/** Escolhe a abertura de referencia sem adivinhar. */
export function escolherAbertura(aberturas: Abertura[]): EscolhaAbertura {
  const realizadas = aberturas.filter(aberturaRealizada)
  if (realizadas.length === 0) {
    return {
      tipo: 'ambigua',
      candidatas: [],
      motivo: 'nenhuma abertura registrada: a escavacao ainda nao ocorreu',
    }
  }
  const comDados = realizadas.filter(temDadosBiologicos)
  const unicaComDados = comDados.length === 1 ? comDados[0] : undefined
  if (unicaComDados) {
    return {
      tipo: 'unica',
      abertura: unicaComDados,
      complementares: realizadas.filter((a) => a.id !== unicaComDados.id),
    }
  }
  if (comDados.length === 0) {
    return {
      tipo: 'ambigua',
      candidatas: realizadas,
      motivo: 'abertura registrada sem contagens biologicas: os derivados ficam vazios',
    }
  }
  return {
    tipo: 'ambigua',
    candidatas: realizadas,
    motivo: `${comDados.length} aberturas com dados biologicos: o app nao escolhe sozinho`,
  }
}

/**
 * Monta a ficha resolvendo a fonte de cada campo. Nao grava nada e nao escolhe numero oficial.
 */
export function montarFichaNinho(entrada: EntradaFicha): FichaNinho {
  const { ninho, ocorrencia, aberturas } = entrada
  const avisos: string[] = []
  const transferenciasOrdenadas = ordenarTransferencias(entrada.transferencias)

  const atual = transferenciasOrdenadas.at(-1) ?? null
  const posicaoAtual: OrigemPosicao = atual
    ? { tipo: 'transferencia', transferenciaId: atual.id, local: atual.localDestino }
    : {
        tipo: 'ocorrencia',
        transferenciaId: null,
        local: ocorrencia?.localOrigem ?? {
          praiaId: null,
          praiaCodigo: null,
          localKm: null,
          bairro: null,
          referencia: null,
          latitude: null,
          longitude: null,
          datum: null,
          fonteGps: null,
          precisaoGpsM: null,
          capturadoEm: null,
        },
      }

  if (!ocorrencia) avisos.push('ocorrencia de origem ausente: numero de registro e local indisponiveis')
  if (ocorrencia && ninho.ocorrenciaId !== ocorrencia.id) {
    avisos.push('a ocorrencia informada nao e a que originou este ninho')
  }
  if (ocorrencia && ocorrencia.ninhoId !== null && ocorrencia.ninhoId !== ninho.id) {
    avisos.push('a ocorrencia aponta para outro ninho')
  }
  for (const t of transferenciasOrdenadas) {
    if (paraDia(t.dataTransferencia) === null && t.instanteTransferencia === null) {
      avisos.push(`transferencia ${t.id} sem data nem instante: posicao atual pode estar incorreta`)
    }
  }

  const ultimaParaCercado = [...transferenciasOrdenadas]
    .reverse()
    .find((t) => t.destino === 'CERCADO') ?? null

  const abertura = escolherAbertura(aberturas)
  if (abertura.tipo === 'ambigua' && abertura.candidatas.length > 1) {
    avisos.push(abertura.motivo)
  }

  const ovosTransferencia = atual?.ovosTransferencia ?? null

  // Derivados exigem CD e uma abertura de referencia. Sem a ocorrencia de origem nao se assume CD:
  // derivado sem base e exatamente o tipo de valor silencioso que o projeto proibe.
  let derivados: DerivadosAbertura | null = null
  let motivoSemDerivados: string | null = null
  if (!ocorrencia) {
    motivoSemDerivados = 'derivados nao calculados: ocorrencia de origem ausente'
  } else if (abertura.tipo !== 'unica') {
    motivoSemDerivados = `derivados nao calculados: ${abertura.motivo}`
  } else {
    const contexto: ContextoCalculo = {
      tipoOcorrencia: ocorrencia.tipoOcorrencia,
      situacao: ninho.situacao,
      historicoNinho: ninho.historicoNinho,
      problemaIncubacao: ninho.problemaIncubacao,
      ovosTransferencia,
      dataOcorrencia: ocorrencia.dataOcorrencia,
      dataEclosao: abertura.abertura.dataEclosao,
    }
    derivados = calcularDerivados(abertura.abertura, contexto)
  }
  if (motivoSemDerivados) avisos.push(motivoSemDerivados)

  return {
    ninho,
    ocorrencia,
    transferenciasOrdenadas,
    abertura,
    posicaoAtual,
    tempoTransferencia: atual?.tempoTransferencia ?? null,
    numeroNinhoCercado: ultimaParaCercado?.numeroNinhoCercado ?? null,
    ovosTransferencia,
    derivados,
    avisos,
  }
}

/**
 * Linha da tabela resumida do relatorio: uma por unidade, com a fonte de cada valor anotada. Nao
 * substitui o PDF, e a propria base do filtro unico (E02).
 */
export interface LinhaResumo {
  ninhoId: string | null
  ocorrenciaId: string
  numeroRegistro: string | null
  codigoInterno: string | null
  dataCriterio: string | null
  criterio: 'OCORR' | 'ECLOS' | 'ABERT'
  praiaCodigo: string | null
  localKm: string | null
  especieCodigo: string | null
  situacao: string | null
  historicoNinho: string | null
  vivos: number | null
  natimortos: number | null
  ovosNaoEclodidos: number | null
  ovosFurados: number | null
  ovosTotais: number | null
  percentualVivos: number | null
  tempoIncubacaoDias: number | null
  /** Motivos de valor vazio, para a interface e para o rodape do PDF. */
  motivos: string[]
}

export interface EntradaResumo {
  criterio: 'OCORR' | 'ECLOS' | 'ABERT'
  fichas: FichaNinho[]
}

const dataDoCriterio = (criterio: EntradaResumo['criterio'], ficha: FichaNinho): string | null => {
  if (criterio === 'OCORR') return ficha.ocorrencia?.dataOcorrencia ?? null
  const abertura = ficha.abertura.tipo === 'unica' ? ficha.abertura.abertura : null
  if (!abertura) return null
  return criterio === 'ECLOS' ? abertura.noiteReferenciaEclosao ?? null : abertura.noiteReferenciaAbertura ?? null
}

/**
 * Monta as linhas do resumo. Cada linha sai de **uma** ficha, entao `OVOS_FURAD` aparece uma vez e
 * `OVOS_TOT` nao soma a mesma contagem duas vezes.
 */
export function montarResumo(entrada: EntradaResumo): LinhaResumo[] {
  return entrada.fichas.map((ficha) => {
    const abertura = ficha.abertura.tipo === 'unica' ? ficha.abertura.abertura : null
    const d = ficha.derivados
    const motivos: string[] = [...ficha.avisos]
    if (d) {
      for (const [nome, derivado] of [
        ['OVOS_TOT', d.ovosTotais],
        ['PCT_VIVOS', d.percentualVivos],
        ['TEMP_INCUB', d.tempoIncubacao],
      ] as const) {
        if (derivado.valor === null && derivado.motivo) motivos.push(`${nome}: ${derivado.motivo}`)
      }
    }

    return {
      ninhoId: ficha.ninho.id,
      ocorrenciaId: ficha.ninho.ocorrenciaId,
      numeroRegistro: ficha.ocorrencia?.numeroRegistro ?? null,
      codigoInterno: ficha.ninho.codigoInterno,
      dataCriterio: dataDoCriterio(entrada.criterio, ficha),
      criterio: entrada.criterio,
      praiaCodigo: ficha.ocorrencia?.localOrigem.praiaCodigo ?? null,
      localKm: ficha.ocorrencia?.localOrigem.localKm ?? null,
      especieCodigo: ficha.ocorrencia?.especieCodigo ?? null,
      situacao: ficha.ninho.situacao,
      historicoNinho: ficha.ninho.historicoNinho,
      vivos: abertura?.vivos ?? null,
      natimortos: abertura?.natimortos ?? null,
      ovosNaoEclodidos: abertura?.ovosNaoEclodidos ?? null,
      ovosFurados: abertura?.ovosFurados ?? null,
      ovosTotais: d?.ovosTotais.valor ?? null,
      percentualVivos: d?.percentualVivos.valor ?? null,
      tempoIncubacaoDias: d?.tempoIncubacao.valor ?? null,
      motivos,
    }
  })
}

/**
 * Totais do periodo. Soma so valores presentes e conta quantos ficaram sem valor, para o total nao
 * parecer completo quando nao e (REPORT_SPEC §4).
 */
export interface TotaisResumo {
  registros: number
  soma: Record<'vivos' | 'natimortos' | 'ovosNaoEclodidos' | 'ovosFurados' | 'ovosTotais', number | null>
  semValor: Record<'vivos' | 'natimortos' | 'ovosNaoEclodidos' | 'ovosFurados' | 'ovosTotais', number>
}

export function somarTotais(linhas: LinhaResumo[]): TotaisResumo {
  const chaves = ['vivos', 'natimortos', 'ovosNaoEclodidos', 'ovosFurados', 'ovosTotais'] as const
  const soma: TotaisResumo['soma'] = { vivos: null, natimortos: null, ovosNaoEclodidos: null, ovosFurados: null, ovosTotais: null }
  const semValor = { vivos: 0, natimortos: 0, ovosNaoEclodidos: 0, ovosFurados: 0, ovosTotais: 0 }

  for (const linha of linhas) {
    for (const chave of chaves) {
      const valor = linha[chave]
      if (valor === null) semValor[chave] += 1
      else {
        if(!contagemValida(valor))throw new Error('Contagem inválida no resumo; não somada.')
        const total=soma[chave]===null?valor:soma[chave]+valor
        if(!Number.isSafeInteger(total))throw new Error('Soma fora da faixa numérica segura.')
        soma[chave]=total
      }
    }
  }

  return {
    registros: linhas.length,
    soma,
    semValor,
  }
}
