import { describe, expect, it } from 'vitest'
import {
  ESTADOS_FINAIS,
  mesmaOperacao,
  ordenarFila,
  podeEnviarAutomaticamente,
  preservaRascunho,
  proximoEstado,
  rotuloEstado,
  temPendencias,
  type OperacaoPendente,
} from '../src/domain/fila.ts'

const base: OperacaoPendente = {
  operationId: 'op-1',
  tipo: 'alterar',
  caminho: 'projetos/p1/ninhos/n1',
  baseVersion: 3,
  payload: { versao: 4 },
  estado: 'pendente',
  tentativas: 0,
  ultimoErro: null,
  criadoEm: '2026-10-02T21:40:00-03:00',
  versaoConfirmada: null,
}

describe('fila offline nao e confirmacao (F08)', () => {
  it('escrita no cache nao vira sincronizado', () => {
    expect(temPendencias([{ ...base, estado: 'pendente' }])).toBe(true)
    expect(temPendencias([{ ...base, estado: 'enviando' }])).toBe(true)
    expect(rotuloEstado('pendente', false)).toContain('sem internet')
    expect(rotuloEstado('confirmada', true)).toBe('sincronizado confirmado')
  })

  it('so fica sincronizada depois da confirmacao do servidor', () => {
    const r = proximoEstado('enviando', { tipo: 'confirmada', versao: 4 })
    expect(r.estado).toBe('confirmada')
    expect(r.versaoConfirmada).toBe(4)
    expect(temPendencias([{ ...base, ...r }])).toBe(false)
  })

  it('queda depois do commit nao reaplica a operacao', () => {
    const r = proximoEstado('enviando', { tipo: 'idempo_ja_aplicada', versao: 4 })
    expect(r.estado).toBe('confirmada')
    expect(r.versaoConfirmada).toBe(4)
    expect(mesmaOperacao(base, { ...base })).toBe(true)
  })

  it('dois aparelhos com a mesma baseVersion: um vence, o outro vira conflito', () => {
    const r = proximoEstado('enviando', {
      tipo: 'conflito',
      versaoServidor: 5,
      mensagem: 'versao do servidor e 5, operacao esperava 3',
    })
    expect(r.estado).toBe('conflito')
    expect(preservaRascunho(r.estado)).toBe(true)
    expect(r.ultimoErro).toContain('3')
  })

  it('erro de permissao preserva o rascunho e nao vira pendente de novo', () => {
    const r = proximoEstado('enviando', { tipo: 'permissao', mensagem: 'sem papel de campo' })
    expect(r.estado).toBe('erro_permissao')
    expect(preservaRascunho(r.estado)).toBe(true)
    expect(podeEnviarAutomaticamente({ ...base, ...r })).toBe(false)
  })

  it('transacao indisponivel devolve para pendente, sem perder a operacao', () => {
    const r = proximoEstado('enviando', { tipo: 'transacao_indisponivel', mensagem: 'offline' })
    expect(r.estado).toBe('pendente')
    expect(podeEnviarAutomaticamente({ ...base, ...r })).toBe(true)
  })

  it('estado final nao volta para o fluxo automatico', () => {
    for (const estado of ESTADOS_FINAIS) {
      const r = proximoEstado(estado, { tipo: 'conflito', versaoServidor: 9, mensagem: 'tarde demais' })
      expect(r.estado).toBe(estado)
      expect(podeEnviarAutomaticamente({ ...base, estado })).toBe(false)
    }
  })

  it('fila ordena por criacao e desempatada pelo operationId', () => {
    const lista = [
      { ...base, operationId: 'op-b', criadoEm: '2026-10-02T21:40:00-03:00' },
      { ...base, operationId: 'op-a', criadoEm: '2026-10-02T21:40:00-03:00' },
      { ...base, operationId: 'op-c', criadoEm: '2026-10-01T08:00:00-03:00' },
    ]
    expect(ordenarFila(lista).map((o) => o.operationId)).toEqual(['op-c', 'op-a', 'op-b'])
  })
})
