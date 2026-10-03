import { describe, expect, it } from 'vitest'
import {
  compararInstantes,
  conferirOffset,
  dataReferenciaNoiteDoProjeto,
  fusoConhecido,
  horaDeCampo,
  instanteDoProjeto,
  offsetEsperadoNaZona,
  problemaDeFuso,
} from '../src/domain/fuso.ts'

describe('entrada local obrigatoria (revisao F11)', () => {
  it('monta o instante com o deslocamento observado', () => {
    expect(instanteDoProjeto({ data: '2026-10-02', hora: '21:40', offsetMinutos: -180 })).toBe(
      '2026-10-02T21:40:00-03:00',
    )
    expect(instanteDoProjeto({ data: '2026-10-02', hora: '21:40:30', offsetMinutos: -180 })).toBe(
      '2026-10-02T21:40:30-03:00',
    )
  })

  it('recusa entrada invalida em vez de assumir UTC', () => {
    expect(instanteDoProjeto(null)).toBeNull()
    expect(instanteDoProjeto({ data: '2026-02-30', hora: '10:00', offsetMinutos: -180 })).toBeNull()
    expect(instanteDoProjeto({ data: '2026-10-02', hora: '24:00', offsetMinutos: -180 })).toBeNull()
    expect(instanteDoProjeto({ data: '2026-10-02', hora: '10:00', offsetMinutos: Number.NaN })).toBeNull()
    expect(instanteDoProjeto({ data: '2026-10-02', hora: '10:00', offsetMinutos: -15 * 60 })).toBeNull()
  })

  it('hora de campo vem do relogio local, sem passar por UTC', () => {
    expect(horaDeCampo({ data: '2026-10-02', hora: '21:40', offsetMinutos: -180 })).toBe('21:40')
    // Mesmo instante real, outra hora local: a hora de campo e a local.
    expect(horaDeCampo({ data: '2026-10-03', hora: '00:40', offsetMinutos: -180 })).toBe('00:40')
  })
  it('deslocamento zero observado é válido, ausência não vira zero', () => {
    expect(instanteDoProjeto({data:'2026-10-02',hora:'10:00',offsetMinutos:0})).toBe('2026-10-02T10:00:00+00:00')
    expect(conferirOffset('Etc/UTC',{data:'2026-10-02',hora:'10:00',offsetMinutos:0}).conferido).toBe(true)
    expect(instanteDoProjeto(null)).toBeNull()
  })
})

describe('data de referencia a partir da entrada local', () => {
  it('madrugada pertence a noite anterior', () => {
    expect(dataReferenciaNoiteDoProjeto({ data: '2026-10-03', hora: '01:30', offsetMinutos: -180 })).toBe(
      '2026-10-02',
    )
  })

  it('o texto UTC de toISOString nao entra direto na funcao', () => {
    // '2026-10-03T04:30:00Z' e o mesmo instante real, mas escrito em UTC. Como a funcao le o texto,
    // usá-la assim daria a noite errada. A entrada local evita isso por contrato.
    const local = instanteDoProjeto({ data: '2026-10-03', hora: '01:30', offsetMinutos: -180 })
    expect(local).toBe('2026-10-03T01:30:00-03:00')
    expect(new Date(local as string).toISOString()).toBe('2026-10-03T04:30:00.000Z')
    expect(dataReferenciaNoiteDoProjeto({ data: '2026-10-03', hora: '01:30', offsetMinutos: -180 })).toBe(
      '2026-10-02',
    )
  })

  it('12:00 continua na noite anterior pelo mesmo caminho', () => {
    expect(dataReferenciaNoiteDoProjeto({ data: '2026-10-03', hora: '12:00', offsetMinutos: -180 })).toBe(
      '2026-10-02',
    )
    expect(dataReferenciaNoiteDoProjeto({ data: '2026-10-03', hora: '12:01', offsetMinutos: -180 })).toBe(
      '2026-10-03',
    )
  })
})

describe('conferencia de deslocamento, sem conversao silenciosa', () => {
  it('fuso null e estado conhecido: avisa e nao converte', () => {
    const r = conferirOffset(null, { data: '2026-10-02', hora: '21:40', offsetMinutos: -180 })
    expect(r.conferido).toBe(false)
    expect(r.aviso).toContain('fuso do projeto nao confirmado')
  })

  it('fuso invalido nao vira deslocamento chute', () => {
    expect(fusoConhecido('Mars/Base')).toBeNull()
    expect(problemaDeFuso('Mars/Base').ok).toBe(false)
    expect(problemaDeFuso(null).ok).toBe(false)
    expect(problemaDeFuso('America/Sao_Paulo').ok).toBe(true)
  })

  it('divergencia entre deslocamento registrado e fuso vira aviso', () => {
    const ok = conferirOffset('America/Sao_Paulo', { data: '2026-10-02', hora: '21:40', offsetMinutos: -180 })
    expect(ok.conferido).toBe(true)
    expect(ok.aviso).toBeNull()

    const divergente = conferirOffset('America/Sao_Paulo', {
      data: '2026-10-02',
      hora: '21:40',
      offsetMinutos: -120,
    })
    expect(divergente.conferido).toBe(false)
    expect(divergente.aviso).toContain('difere do esperado')
  })

  it('offset da zona e calculado a partir do instante, nao assumido', () => {
    expect(offsetEsperadoNaZona('America/Sao_Paulo', '2026-10-02T21:40:00-03:00')).toBe(-180)
    // O Brasil nao tem horario de verao desde 2019: janeiro e outubro tem o mesmo deslocamento.
    expect(offsetEsperadoNaZona('America/Sao_Paulo', '2026-01-15T10:00:00-03:00')).toBe(-180)
    // Zona que tem horario de verao mostra a diferenca, porque a conta e feita pela zona.
    expect(offsetEsperadoNaZona('America/New_York', '2026-07-15T10:00:00-04:00')).toBe(-240)
    expect(offsetEsperadoNaZona('America/New_York', '2026-01-15T10:00:00-05:00')).toBe(-300)
    expect(offsetEsperadoNaZona('Mars/Base', '2026-01-15T10:00:00-03:00')).toBeNull()
  })
})

describe('comparacao de instantes para ordenar', () => {
  it('ordena pelo instante real, nao pelo texto local', () => {
    expect(compararInstantes('2026-10-02T23:30:00-05:00', '2026-10-03T02:30:00-03:00')).toBe(-1)
    expect(compararInstantes('2026-10-03T01:30:00-03:00', '2026-10-03T01:30:00-03:00')).toBe(0)
    expect(compararInstantes(null, '2026-10-03T01:30:00-03:00')).toBeNull()
  })

  it('o mesmo instante escrito em dois fusos e o mesmo instante', () => {
    // 23:30-05:00 e 01:30-03:00 sao o mesmo momento real. A data de campo e outra coisa (corte 12:00).
    expect(compararInstantes('2026-10-02T23:30:00-05:00', '2026-10-03T01:30:00-03:00')).toBe(0)
  })
})
