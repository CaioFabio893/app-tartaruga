import { describe, expect, it } from 'vitest'
import {
  CRITERIOS,
  descreverConsultaAusentes,
  descreverConsultaRelatorio,
  excedeLimite,
  tokensDeFiltro,
} from '../src/domain/consultas.ts'

const entrada = {
  projetoId: 'p1',
  criterio: 'ECLOS' as const,
  inicio: '2026-10-01',
  fim: '2026-10-31',
}

describe('tres consultas concretas por criterio (F07)', () => {
  it('existe uma consulta por criterio, sempre dentro do projeto', () => {
    for (const criterio of CRITERIOS) {
      const r = descreverConsultaRelatorio({ ...entrada, criterio })
      expect(r.ok).toBe(true)
      if (!r.ok) return
      expect(r.consulta.colecao).toBe('projetos/p1/consultas')
      expect(r.consulta.restricoes[0]).toEqual({ tipo: 'igual', campo: 'projeto_id', valor: 'p1' })
      expect(r.consulta.restricoes[1]).toEqual({ tipo: 'igual', campo: 'criterio', valor: criterio })
    }
  })

  it('filtra por periodo no servidor: nunca enumera a colecao inteira', () => {
    const r = descreverConsultaRelatorio(entrada)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const intervalo = r.consulta.restricoes.find((x) => x.tipo === 'maiorOuIgual')
    expect(intervalo).toEqual({ tipo: 'maiorOuIgual', campo: 'data_criterio', valor: '2026-10-01' })
    expect(r.consulta.limite).toBeGreaterThan(0)
    expect(r.consulta.corteSuperior).toBe('2026-10-31')
    expect(r.consulta.restricoes).toContainEqual({ tipo: 'menorOuIgual', campo: 'data_criterio', valor: '2026-10-31' })
    expect(r.consulta.contagem).toBe(false)
    expect(r.consulta.restricoes.some((x) => x.campo === 'ninhos')).toBe(false)
    expect(r.consulta.nota).toContain('inclusivo')
  })

  it('metadados conservam tokens, consulta usa igualdades e filtro ausente nao restringe', () => {
    expect(tokensDeFiltro({ praiaCodigo: null })).toEqual([])
    expect(tokensDeFiltro({ praiaCodigo: '001', especieCodigo: 'CC', temporadaId: 't2026' })).toEqual([
      'esp:CC',
      'praia:001',
      'temp:t2026',
    ])
    const r = descreverConsultaRelatorio({ ...entrada, filtros: { praiaCodigo: '001' } })
    expect(r.ok && r.consulta.restricoes.some((x) => x.tipo === 'igual' && x.campo === 'praia_codigo' && x.valor === '001')).toBe(
      true,
    )
  })

  it('periodo invertido ou data invalida e recusado, sem consulta silenciosa', () => {
    const invertido = descreverConsultaRelatorio({ ...entrada, inicio: '2026-10-31', fim: '2026-10-01' })
    expect(invertido.ok).toBe(false)
    expect(invertido.ok === false && invertido.erros.join(' ')).toContain('invertido')

    const invalida = descreverConsultaRelatorio({ ...entrada, fim: '2026-02-30' })
    expect(invalida.ok).toBe(false)

    const semProjeto = descreverConsultaRelatorio({ ...entrada, projetoId: '' })
    expect(semProjeto.ok === false && semProjeto.erros.join(' ')).toContain('projetoId')
  })

  it('periodo de um unico dia e aceito (inicio = fim)', () => {
    const r = descreverConsultaRelatorio({ ...entrada, inicio: '2026-10-02', fim: '2026-10-02' })
    expect(r.ok).toBe(true)
  })

  it('criterio invalido e recusado', () => {
    const r = descreverConsultaRelatorio({ ...entrada, criterio: 'QUALQUER' as never })
    expect(r.ok).toBe(false)
  })
})

describe('contagem de excluidos por data ausente (F07 e REPORT_SPEC 2)', () => {
  it('e uma consulta propria, com o mesmo escopo do relatorio', () => {
    const filtros = { praiaCodigo: '001' }
    const r = descreverConsultaAusentes({ ...entrada, filtros })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.consulta.contagem).toBe(true)
    expect(r.consulta.restricoes).toContainEqual({ tipo: 'igual', campo: 'data_criterio', valor: null })
    expect(r.consulta.restricoes.some((x) => x.tipo === 'igual' && x.campo === 'praia_codigo' && x.valor === '001')).toBe(true)
    expect(r.consulta.limite).toBe(0)
  })

  it('exige escopo valido: sem projeto nao ha contagem', () => {
    const r = descreverConsultaAusentes({ ...entrada, projetoId: '' })
    expect(r.ok).toBe(false)
  })
})

describe('limite de resultados', () => {
  it('recusa pagina acima do maximo', () => {
    expect(descreverConsultaRelatorio({...entrada, limite: 5001}).ok).toBe(false)
  })
  it('combina igualdades de praia, especie e temporada sem array-contains', () => {
    const r = descreverConsultaRelatorio({...entrada, filtros: {praiaCodigo: '001', especieCodigo: 'CC', temporadaId: 't2026'}})
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.consulta.restricoes.filter(x => x.tipo === 'igual')).toHaveLength(5)
    expect(r.consulta.restricoes.some(x => x.tipo === 'arrayContem')).toBe(false)
  })
  it('acima do limite a interface precisa avisar truncamento', () => {
    expect(excedeLimite(4999)).toBe(false)
    expect(excedeLimite(5001)).toBe(true)
  })
})

