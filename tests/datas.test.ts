import { describe, expect, it } from 'vitest'
import {
  compararDatas,
  dataReferenciaNoite,
  deParaDia,
  dentroDoPeriodo,
  diferencasDias,
  validarDataAbertura,
} from '../src/domain/datas.ts'

describe('dataReferenciaNoite (DOMAIN_RULES 3.2 e 3.3)', () => {
  it('atribui a madrugada ao dia anterior: noite que comecou dia 02', () => {
    expect(dataReferenciaNoite('2026-10-03T01:30:00-03:00')).toBe('2026-10-02')
  })

  it('atribui a noite ao proprio dia quando passa das 12:00', () => {
    expect(dataReferenciaNoite('2026-10-02T20:15:00-03:00')).toBe('2026-10-02')
  })

  it('trata exatamente 12:00 como noite anterior (limite inclusivo do manual)', () => {
    expect(dataReferenciaNoite('2026-10-03T12:00:00-03:00')).toBe('2026-10-02')
  })

  it('trata 12:01 como novo dia', () => {
    expect(dataReferenciaNoite('2026-10-03T12:01:00-03:00')).toBe('2026-10-03')
  })

  it('nao depende do fuso do ambiente: mesmo instante com offsets diferentes', () => {
    // 2026-10-03T01:30-03:00 e 2026-10-03T04:30Z sao o mesmo instante, madrugada do dia 3.
    expect(dataReferenciaNoite('2026-10-03T01:30:00-03:00')).toBe(
      dataReferenciaNoite('2026-10-03T04:30:00Z'),
    )
  })

  it('usa o offset local, nao UTC: 23:30-05:00 e a noite do proprio dia', () => {
    expect(dataReferenciaNoite('2026-10-02T23:30:00-05:00')).toBe('2026-10-02')
  })

  it('atravessa virada de mes e de ano', () => {
    expect(dataReferenciaNoite('2026-01-01T02:00:00-03:00')).toBe('2025-12-31')
    expect(dataReferenciaNoite('2026-03-01T00:30:00-03:00')).toBe('2026-02-28')
  })

  it('devolve null para instante invalido ou ausente', () => {
    expect(dataReferenciaNoite(null)).toBeNull()
    expect(dataReferenciaNoite('')).toBeNull()
    expect(dataReferenciaNoite('02/10/2026 21:40')).toBeNull()
    expect(dataReferenciaNoite('2026-10-02T21:40:00')).toBeNull()
  })
})

describe('periodo inclusivo (REPORT_SPEC 1)', () => {
  it('inclui as duas pontas', () => {
    expect(dentroDoPeriodo('2026-10-01', '2026-10-01', '2026-10-31')).toBe(true)
    expect(dentroDoPeriodo('2026-10-31', '2026-10-01', '2026-10-31')).toBe(true)
  })

  it('exclui fora do periodo', () => {
    expect(dentroDoPeriodo('2026-09-30', '2026-10-01', '2026-10-31')).toBe(false)
    expect(dentroDoPeriodo('2026-11-01', '2026-10-01', '2026-10-31')).toBe(false)
  })

  it('data ausente nao entra no periodo e nunca vale como zero', () => {
    expect(dentroDoPeriodo(null, '2026-10-01', '2026-10-31')).toBe(false)
  })

  it('periodo invertido nao seleciona nada', () => {
    expect(dentroDoPeriodo('2026-10-10', '2026-10-31', '2026-10-01')).toBe(false)
  })
})

describe('datas de campo', () => {
  it('soma dias e compara sem fuso', () => {
    expect(diferencasDias('2026-10-01', '2026-10-15')).toBe(14)
    expect(diferencasDias('2026-10-15', '2026-10-01')).toBe(-14)
    expect(compararDatas('2026-10-01', '2026-10-01')).toBe(0)
    expect(compararDatas('2026-10-01', '2026-10-02')).toBe(-1)
    expect(compararDatas('2026-10-03', '2026-10-02')).toBe(1)
  })

  it('rejeita data mal formada', () => {
    expect(compararDatas('2026-13-01', '2026-10-01')).toBeNull()
    expect(compararDatas(null, '2026-10-01')).toBeNull()
    expect(deParaDia(NaN)).toBeNull()
  })
})

describe('validarDataAbertura (p. 4)', () => {
  it('aceita abertura no dia seguinte a eclosao', () => {
    expect(validarDataAbertura('2026-10-02', '2026-10-02')).toBe('ok')
  })

  it('recusa abertura anterior a eclosao', () => {
    expect(validarDataAbertura('2026-10-05', '2026-10-02')).toBe('invalida')
  })

  it('aceita abertura sem eclosao registrada', () => {
    expect(validarDataAbertura(null, '2026-10-02')).toBe('ok')
    expect(validarDataAbertura('2026-10-02', null)).toBe('sem_eclosao')
  })
})
