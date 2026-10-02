import { describe, expect, it } from 'vitest'
import {
  calcularOvosTotais,
  calcularPercentualVivos,
  calcularTempoIncubacao,
  type ComponentesOvos,
  type ContextoCalculo,
} from '../src/domain/calculos.ts'

const base: ContextoCalculo = {
  tipoOcorrencia: 'CD',
  situacao: 'I',
  historicoNinho: 'SU',
  problemaIncubacao: false,
  ovosTransferencia: null,
  dataOcorrencia: '2026-10-02',
  dataEclosao: '2026-10-23',
}

const componentes: ComponentesOvos = {
  vivos: 80,
  natimortos: 5,
  ovosNaoEclodidos: 10,
  ovosFurados: 3,
}

describe('OVOS_TOT regra normal (p. 5)', () => {
  it('soma vivos + natimortos + nao eclodidos + furados', () => {
    const r = calcularOvosTotais(componentes, base)
    expect(r.valor).toBe(98)
    expect(r.motivo).toBeNull()
  })

  it('total zero e zero legitimo quando tudo foi realmente zero', () => {
    const r = calcularOvosTotais(
      { vivos: 0, natimortos: 0, ovosNaoEclodidos: 0, ovosFurados: 0 },
      base,
    )
    expect(r.valor).toBe(0)
    expect(r.motivo).toBeNull()
  })

  it('componente ausente deixa o total indefinido, nunca zero', () => {
    const r = calcularOvosTotais({ ...componentes, vivos: null }, base)
    expect(r.valor).toBeNull()
    expect(r.motivo).toContain('VIVOS')
  })

  it('soma componentes parciais, mas so quando todos foram observados', () => {
    const r = calcularOvosTotais(
      { vivos: 4, natimortos: null, ovosNaoEclodidos: 0, ovosFurados: 0 },
      base,
    )
    expect(r.valor).toBeNull()
    expect(r.motivo).toContain('NATIMORTOS')
  })

  it('nao se aplica fora de CD', () => {
    const r = calcularOvosTotais(componentes, { ...base, tipoOcorrencia: 'ML' })
    expect(r.valor).toBeNull()
  })
})

describe('OVOS_TOT excecao da transferencia (p. 5)', () => {
  const ctxP = { ...base, situacao: 'P' as const, problemaIncubacao: true, ovosTransferencia: 92 }
  const ctxT = { ...base, situacao: 'T' as const, problemaIncubacao: true, ovosTransferencia: 92 }

  it('adota OVOS_TRANS para SITUACAO = P com problema na incubacao', () => {
    expect(calcularOvosTotais(componentes, ctxP).valor).toBe(92)
  })

  it('adota OVOS_TRANS para SITUACAO = T com problema na incubacao', () => {
    expect(calcularOvosTotais(componentes, ctxT).valor).toBe(92)
  })

  it('NAO usa OVOS_TRANS se o problema na incubacao nao foi informado', () => {
    const r = calcularOvosTotais(componentes, { ...ctxP, problemaIncubacao: null })
    expect(r.valor).toBeNull()
    expect(r.motivo).toContain('incubacao')
  })

  it('NAO usa OVOS_TRANS se o problema foi informado como falso', () => {
    const r = calcularOvosTotais(componentes, { ...ctxP, problemaIncubacao: false })
    expect(r.valor).toBe(98)
  })

  it('transferencia sem problema nao aciona excecao', () => {
    const r = calcularOvosTotais(componentes, {
      ...base,
      situacao: 'T',
      problemaIncubacao: false,
      ovosTransferencia: 92,
    })
    expect(r.valor).toBe(98)
  })

  it('excecao sem OVOS_TRANS registrado fica indefinida, nunca zero', () => {
    const r = calcularOvosTotais(componentes, { ...ctxP, ovosTransferencia: null })
    expect(r.valor).toBeNull()
    expect(r.motivo).toContain('OVOS_TRANS')
  })

  it('situacao I nunca aciona a excecao', () => {
    const r = calcularOvosTotais(componentes, { ...ctxP, situacao: 'I' })
    expect(r.valor).toBe(98)
  })
})

describe('NAO_VIAVEIS (p. 3)', () => {
  it('nao integra o total, mesmo em DC', () => {
    // DC tem ovos anomalos; o total nao deve inclui-los (p. 3).
    const r = calcularOvosTotais(componentes, { ...base, problemaIncubacao: false })
    expect(r.valor).toBe(98)
  })
})

describe('PCT_VIVOS (p. 5)', () => {
  const total98 = calcularOvosTotais(componentes, base)

  it('calcula com CD + SU + total maior que zero', () => {
    const r = calcularPercentualVivos(80, total98, { tipoOcorrencia: 'CD', historicoNinho: 'SU' })
    expect(r.valor).toBeCloseTo(81.63, 2)
  })

  it('nao calcula com historico diferente de SU', () => {
    const r = calcularPercentualVivos(80, total98, {
      tipoOcorrencia: 'CD',
      historicoNinho: 'PM',
    })
    expect(r.valor).toBeNull()
    expect(r.motivo).toContain('SU')
  })

  it('nao calcula com total igual a zero', () => {
    const zero = calcularOvosTotais(
      { vivos: 0, natimortos: 0, ovosNaoEclodidos: 0, ovosFurados: 0 },
      base,
    )
    const r = calcularPercentualVivos(0, zero, { tipoOcorrencia: 'CD', historicoNinho: 'SU' })
    expect(r.valor).toBeNull()
    expect(r.motivo).toContain('zero')
  })

  it('nao calcula quando o total esta indefinido', () => {
    const indefinido = calcularOvosTotais({ ...componentes, ovosFurados: null }, base)
    const r = calcularPercentualVivos(80, indefinido, {
      tipoOcorrencia: 'CD',
      historicoNinho: 'SU',
    })
    expect(r.valor).toBeNull()
  })

  it('100 por cento quando todos os ovos eram vivos', () => {
    const total = calcularOvosTotais(
      { vivos: 50, natimortos: 0, ovosNaoEclodidos: 0, ovosFurados: 0 },
      base,
    )
    const r = calcularPercentualVivos(50, total, { tipoOcorrencia: 'CD', historicoNinho: 'SU' })
    expect(r.valor).toBe(100)
  })
})

describe('TEMP_INCUB (p. 5)', () => {
  const ctx = { tipoOcorrencia: 'CD' as const, historicoNinho: 'SU' as const }

  it('conta os dias entre postura e emergencia do menor filhote', () => {
    expect(calcularTempoIncubacao('2026-10-02', '2026-10-23', ctx).valor).toBe(21)
  })

  it('data de ocorrencia em branco nao vira zero (desova localizada depois)', () => {
    const r = calcularTempoIncubacao(null, '2026-10-23', ctx)
    expect(r.valor).toBeNull()
    expect(r.motivo).toContain('DATA_OCORR')
  })

  it('sem eclosao nao calcula', () => {
    expect(calcularTempoIncubacao('2026-10-02', null, ctx).valor).toBeNull()
  })

  it('recusa eclosao anterior a postura', () => {
    expect(calcularTempoIncubacao('2026-10-23', '2026-10-02', ctx).valor).toBeNull()
  })

  it('nao calcula fora de CD + SU', () => {
    expect(
      calcularTempoIncubacao('2026-10-02', '2026-10-23', {
        tipoOcorrencia: 'CD',
        historicoNinho: 'PH',
      }).valor,
    ).toBeNull()
  })
})
