import { describe, expect, it } from 'vitest'
import {
  aberturaBase,
  construirFicha,
  ninhoBase,
  ocorrenciaBase,
  transferenciaBase,
} from './auxiliares-agregado.ts'
import {
  escolherAbertura,
  montarFichaNinho,
  montarResumo,
  ordenarTransferencias,
  somarTotais,
} from '../src/domain/agregado.ts'
import type { Abertura, Transferencia } from '../src/domain/tipos.ts'

const transferencia = (extra: Partial<Transferencia>): Transferencia => ({ ...transferenciaBase, ...extra })

const abertura = (extra: Partial<Abertura>): Abertura => ({ ...aberturaBase, ...extra })

describe('posicao atual derivada, nao digitada (F10)', () => {
  it('ordena por instante, nao so pela data do dia', () => {
    const tarde = transferencia({ id: 't2', instanteTransferencia: '2026-10-03T18:00:00-03:00' })
    const manha = transferencia({ id: 't3', instanteTransferencia: '2026-10-03T06:00:00-03:00' })
    expect(ordenarTransferencias([tarde, manha]).map((t) => t.id)).toEqual(['t3', 't2'])
  })

  it('desempata com a sequencia confirmada quando o instante falta', () => {
    const a = transferencia({ id: 'a', instanteTransferencia: null, sequencia: 2 })
    const b = transferencia({ id: 'b', instanteTransferencia: null, sequencia: 1 })
    expect(ordenarTransferencias([a, b]).map((t) => t.id)).toEqual(['b', 'a'])
  })

  it('sem transferencia, a posicao atual e a localizacao original da ocorrencia', () => {
    const ficha = montarFichaNinho({
      ninho: ninhoBase,
      ocorrencia: ocorrenciaBase,
      transferencias: [],
      aberturas: [],
    })
    expect(ficha.posicaoAtual.tipo).toBe('ocorrencia')
    expect(ficha.posicaoAtual.local.praiaCodigo).toBe('001')
  })

  it('com transferencia, a posicao atual vem do destino dela', () => {
    const ficha = construirFicha()
    expect(ficha.posicaoAtual.tipo).toBe('transferencia')
    expect(ficha.numeroNinhoCercado).toBe('12')
    expect(ficha.tempoTransferencia).toBe('C')
  })

  it('numero do cercado vem da ultima transferencia para o cercado', () => {
    const voltaPraia = transferencia({
      id: 't2',
      destino: 'PRAIA',
      cercadoId: null,
      numeroNinhoCercado: null,
      tempoTransferencia: null,
      instanteTransferencia: '2026-10-10T09:00:00-03:00',
    })
    const ficha = montarFichaNinho({
      ninho: ninhoBase,
      ocorrencia: ocorrenciaBase,
      transferencias: [transferencia({}), voltaPraia],
      aberturas: [],
    })
    expect(ficha.numeroNinhoCercado).toBe('12')
    expect(ficha.tempoTransferencia).toBeNull()
  })

  it('transferencia sem data nem instante vira aviso sobre a posicao atual', () => {
    const ficha = montarFichaNinho({
      ninho: ninhoBase,
      ocorrencia: ocorrenciaBase,
      transferencias: [transferencia({ dataTransferencia: null, instanteTransferencia: null })],
      aberturas: [],
    })
    expect(ficha.avisos.join(' ')).toContain('posicao atual pode estar incorreta')
  })
})

describe('abertura de referencia sem escolha silenciosa (F10 e DATA_MODEL 5.3)', () => {
  it('uma unica abertura e a referencia', () => {
    expect(escolherAbertura([abertura({})]).tipo).toBe('unica')
  })

  it('nenhuma abertura registrada nao vira zero', () => {
    const r = escolherAbertura([])
    expect(r.tipo).toBe('ambigua')
    expect(r.tipo === 'ambigua' && r.motivo).toContain('nenhuma abertura')
  })

  it('duas aberturas com dados biologicos: o app nao escolhe', () => {
    const r = escolherAbertura([abertura({ id: 'a1' }), abertura({ id: 'a2', dataAbertura: '2026-10-26' })])
    expect(r.tipo).toBe('ambigua')
    expect(r.tipo === 'ambigua' && r.candidatas).toHaveLength(2)
  })

  it('so uma com dados biologicos: ela e a referencia e a outra fica complementar', () => {
    const r = escolherAbertura([
      abertura({ id: 'a1', vivos: null, natimortos: null, ovosNaoEclodidos: null, ovosFurados: null }),
      abertura({ id: 'a2' }),
    ])
    expect(r.tipo).toBe('unica')
    expect(r.tipo === 'unica' && r.abertura.id).toBe('a2')
    expect(r.tipo === 'unica' && r.complementares.map((a) => a.id)).toEqual(['a1'])
  })

  it('ambiguidade impede o calculo dos derivados', () => {
    const ficha = montarFichaNinho({
      ninho: ninhoBase,
      ocorrencia: ocorrenciaBase,
      transferencias: [],
      aberturas: [abertura({ id: 'a1' }), abertura({ id: 'a2' })],
    })
    expect(ficha.derivados).toBeNull()
    expect(ficha.avisos.join(' ')).toContain('nao escolhe sozinho')
  })
})

describe('OVOS_TOT sem contagem duplicada (F10)', () => {
  it('OVOS_FURAD entra uma vez, da abertura', () => {
    const ficha = construirFicha()
    expect(ficha.derivados?.ovosTotais.valor).toBe(55 + 2 + 4 + 3)
    expect(ficha.derivados?.ovosTotais.versao).toBe('v2')
    expect(ficha.derivados?.percentualVivos.valor).toBeCloseTo((55 / 64) * 100, 2)
  })

  it('excecao usa OVOS_TRANS da transferencia que define a posicao atual', () => {
    const ficha = montarFichaNinho({
      ninho: { ...ninhoBase, problemaIncubacao: true },
      ocorrencia: ocorrenciaBase,
      transferencias: [
        transferencia({ ovosTransferencia: 92 }),
        transferencia({ id: 't2', ovosTransferencia: 88, instanteTransferencia: '2026-10-04T09:00:00-03:00' }),
      ],
      aberturas: [abertura({})],
    })
    expect(ficha.ovosTransferencia).toBe(88)
    expect(ficha.derivados?.ovosTotais.valor).toBe(88)
  })

  it('transferencia sem contagem com problema na incubacao: total vazio, nunca 0', () => {
    const ficha = montarFichaNinho({
      ninho: { ...ninhoBase, problemaIncubacao: true },
      ocorrencia: ocorrenciaBase,
      transferencias: [transferencia({ ovosTransferencia: null })],
      aberturas: [abertura({})],
    })
    expect(ficha.derivados?.ovosTotais.valor).toBeNull()
    expect(ficha.derivados?.ovosTotais.motivo).toContain('OVOS_TRANS nao foi registrado')
  })
})

describe('fonte unica de cada campo', () => {
  it('numero de registro vem da ocorrencia, nao de copia no ninho', () => {
    const linha = montarResumo({ criterio: 'OCORR', fichas: [construirFicha()] })[0]
    expect(linha?.numeroRegistro).toBe('007')
    expect(linha?.praiaCodigo).toBe('001')
    expect(linha?.codigoInterno).toBe('N-0001')
  })

  it('ocorrencia ausente gera aviso e nao inventa numero nem derivado', () => {
    const ficha = montarFichaNinho({
      ninho: ninhoBase,
      ocorrencia: null,
      transferencias: [],
      aberturas: [abertura({})],
    })
    expect(ficha.avisos.join(' ')).toContain('ocorrencia de origem ausente')
    expect(ficha.derivados).toBeNull()
    const linha = montarResumo({ criterio: 'OCORR', fichas: [ficha] })[0]
    expect(linha?.numeroRegistro).toBeNull()
    expect(linha?.ovosTotais).toBeNull()
  })

  it('ninho apontado por outra ocorrencia e avisado', () => {
    const ficha = montarFichaNinho({
      ninho: { ...ninhoBase, ocorrenciaId: 'o9' },
      ocorrencia: ocorrenciaBase,
      transferencias: [],
      aberturas: [],
    })
    expect(ficha.avisos.join(' ')).toContain('nao e a que originou este ninho')
  })
})

describe('resumo e totais do periodo', () => {
  it('totais somam so valores presentes e contam os que faltaram', () => {
    const semAbertura = montarFichaNinho({
      ninho: ninhoBase,
      ocorrencia: ocorrenciaBase,
      transferencias: [],
      aberturas: [],
    })
    const linhas = montarResumo({ criterio: 'ECLOS', fichas: [construirFicha(), semAbertura] })
    const totais = somarTotais(linhas)

    expect(totais.registros).toBe(2)
    expect(totais.soma.vivos).toBe(55)
    expect(totais.semValor.vivos).toBe(1)
    expect(totais.semValor.ovosTotais).toBe(1)
  })

  it('sem observações total fica vazio, zero observado permanece zero', () => {
    expect(somarTotais([]).soma.vivos).toBeNull()
    const linhas = montarResumo({ criterio: 'ECLOS', fichas: [construirFicha()] })
    expect(somarTotais(linhas.map(l => ({...l,vivos:null}))).soma.vivos).toBeNull()
    expect(somarTotais(linhas.map(l => ({...l,vivos:0}))).soma.vivos).toBe(0)
  })

  it('abertura sem data de eclosao nao apaga os demais componentes', () => {
    const semEclosao = montarFichaNinho({
      ninho: ninhoBase,
      ocorrencia: ocorrenciaBase,
      transferencias: [],
      aberturas: [abertura({ noiteReferenciaEclosao: null, dataEclosao: null })],
    })
    const linha = montarResumo({ criterio: 'ECLOS', fichas: [semEclosao] })[0]
    expect(linha?.dataCriterio).toBeNull()
    expect(linha?.ovosTotais).toBe(64)
  })
})
