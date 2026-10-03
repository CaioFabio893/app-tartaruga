import { describe, expect, it } from 'vitest'
import {
  compararDatas,
  dataReferenciaNoite,
  deParaDia,
  dentroDoPeriodo,
  diferencasDias,
  validarDataAbertura,
  paraDia,
  partesInstante,
  somarDias,
  sugerirTempoTransferencia,
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

  it('interpreta a hora do texto; o chamador deve fornecer o horario local do projeto', () => {
    expect(dataReferenciaNoite('2026-10-03T11:30:00-03:00')).toBe('2026-10-02')
    expect(dataReferenciaNoite('2026-10-03T14:30:00Z')).toBe('2026-10-03')
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
  it('aceita abertura na mesma data de campo da eclosao', () => {
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

describe('entradas de calendario e horario invalidas', () => {
  it.each(['2026-02-29', '2026-02-30', '2026-04-31', '0000-01-01'])('recusa a data impossivel %s', (data) => {
    expect(paraDia(data)).toBeNull()
    expect(dentroDoPeriodo(data, '2026-01-01', '2026-12-31')).toBe(false)
  })
  it('aceita ano bissexto e preserva ano abaixo de 100', () => {
    expect(somarDias('2024-02-28', 1)).toBe('2024-02-29')
    expect(deParaDia(paraDia('0099-01-01')!)).toBe('0099-01-01')
    expect(deParaDia(1e15)).toBeNull()
    expect(() => somarDias('2026-10-02', 0.5)).toThrow()
  })
  it.each(['2026-10-02T24:00:00-03:00', '2026-10-02T12:60:00-03:00', '2026-10-02T12:00:60-03:00', '2026-02-30T10:00:00-03:00', '2026-10-02T12:00:00+14:01', '2026-10-02T12:00:00-03:60'])('recusa o instante invalido %s', (instante) => {
    expect(partesInstante(instante)).toBeNull()
    expect(dataReferenciaNoite(instante)).toBeNull()
  })
  it('aceita ISO sem segundos e cobre o corte imediatamente apos meio-dia', () => {
    expect(dataReferenciaNoite('2026-10-03T01:30-03:00')).toBe('2026-10-02')
    expect(dataReferenciaNoite('2026-10-03T12:00:01-03:00')).toBe('2026-10-03')
  })
  it('09:00 pertence a B; somente depois pertence a C', () => {
    expect(sugerirTempoTransferencia('2026-10-03T08:59:59-03:00')).toBe('B')
    expect(sugerirTempoTransferencia('2026-10-03T09:00:00-03:00')).toBe('B')
    expect(sugerirTempoTransferencia('2026-10-03T09:00:01-03:00')).toBe('C')
  })
  it('nao aceita abertura impossivel mesmo sem eclosao informada', () => {
    expect(validarDataAbertura(null, '2026-02-30')).toBe('invalida')
  })
})
