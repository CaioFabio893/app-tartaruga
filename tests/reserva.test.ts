import { describe, expect, it } from 'vitest'
import {
  chaveReserva,
  documentoReserva,
  interpretarReservaExistente,
  prepararReserva,
} from '../src/domain/reserva.ts'

const pedido = {
  projetoId: 'p1',
  tipo: 'N_REGISTRO' as const,
  numero: '007',
  temporadaId: 't2026',
  documentoAlvo: 'projetos/p1/ocorrencias/o1',
  operationId: 'op-1',
}

describe('chave de reserva deterministica (F09)', () => {
  it('mesmo escopo e mesmo numero produzem a mesma chave', () => {
    const a = chaveReserva(pedido)
    const b = chaveReserva({ ...pedido, documentoAlvo: 'projetos/p1/ocorrencias/o2' })
    expect(a).toEqual(b)
    expect(a.ok && a.chave).toBe('reserva-v1/n_registro/p1/t2026/007')
  })

  it('zeros iniciais fazem parte do numero: 007 e diferente de 7', () => {
    const comZero = chaveReserva(pedido)
    const semZero = chaveReserva({ ...pedido, numero: '7' })
    expect(comZero.ok && semZero.ok && comZero.chave).not.toBe(semZero.ok ? semZero.chave : '')
  })

  it('escopo sem temporada fica no nivel do projeto', () => {
    const r = chaveReserva({ ...pedido, temporadaId: null })
    expect(r.ok && r.chave).toBe('reserva-v1/n_registro/p1/-/007')
  })

  it('N_NINHO exige cercado: sem escopo nao ha unicidade', () => {
    const r = chaveReserva({ ...pedido, tipo: 'N_NINHO', numero: '12', cercadoId: null })
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.motivo).toContain('cercado')
  })

  it('N_NINHO com cercado tem escopo proprio', () => {
    const r = chaveReserva({ ...pedido, tipo: 'N_NINHO', numero: '12', cercadoId: 'c9' })
    expect(r.ok && r.chave).toBe('reserva-v1/n_ninho/p1/c9/12')
  })

  it('numero ausente fica pendente, nunca com chave de documento vazio', () => {
    const r = prepararReserva({ ...pedido, numero: null })
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.numeroPendente).toBe(true)
    expect(r.ok === false && r.motivo).toContain('pendente de numero')
  })

  it('numero com caractere de caminho e recusado', () => {
    const r = chaveReserva({ ...pedido, numero: 'p1/o2' })
    expect(r.ok).toBe(false)
  })
})

describe('disputa de numero', () => {
  it('dois aparelhos no mesmo numero: o segundo ve numero em uso', () => {
    const primeiro = prepararReserva(pedido)
    expect(primeiro.ok).toBe(true)

    const jaGravada = documentoReserva(
      {
        chave: primeiro.ok ? primeiro.chave : '',
        tipo: 'N_REGISTRO',
        numero: '007',
        documentoAlvo: 'projetos/p1/ocorrencias/o1',
        operationId: 'op-1',
        temporadaId: 't2026',
        cercadoId: null,
        criadoEm: '2026-10-02T21:40:00-03:00',
        projetoId: 'p1',
      },
      '2026-10-02T21:40:00-03:00',
    )

    expect(interpretarReservaExistente(null, pedido)).toEqual({ tipo: 'livre' })
    expect(interpretarReservaExistente(jaGravada, pedido)).toEqual({ tipo: 'mesmoDono' })
    expect(interpretarReservaExistente(jaGravada, { ...pedido, operationId: 'op-2' })).toEqual({
      tipo: 'outroDono',
      documentoAlvo: 'projetos/p1/ocorrencias/o1',
    })
  })

  it('o documento de reserva fica dentro do projeto', () => {
    const r = prepararReserva(pedido)
    expect(r.ok && r.caminho.startsWith('projetos/p1/reservas/')).toBe(true)
  })
})
