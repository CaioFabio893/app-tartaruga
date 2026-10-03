import { describe, expect, it } from 'vitest'
import { validarTipoOcorrencia, validarSituacao, validarHistoricoNinho, validarTumores } from '../src/domain/validacao.ts'

describe('codigos e condicionais do manual', () => {
  it('recusa codigos desconhecidos recebidos de formularios ou importacao', () => {
    expect(validarTipoOcorrencia('INVALIDO', true)).toHaveLength(1)
    expect(validarSituacao('CD', 'INVALIDO')).toHaveLength(1)
    expect(validarHistoricoNinho('CD', 'INVALIDO', 'observacao')).toHaveLength(1)
    expect(validarTumores(true, 'INVALIDO')).toHaveLength(1)
  })
  it('situacao so se aplica a CD e SD exige verificacao', () => {
    expect(validarSituacao('ML', 'I')).toHaveLength(1)
    expect(validarSituacao('CD', 'I')).toHaveLength(0)
    expect(validarTipoOcorrencia('SD', null)).toHaveLength(1)
  })
  it('todo historico informado precisa de complemento em OBS', () => {
    expect(validarHistoricoNinho('CD', 'SU', ' ')).toHaveLength(1)
    expect(validarHistoricoNinho('CD', 'SU', 'Abertura concluida.')).toHaveLength(0)
    expect(validarHistoricoNinho('CD', null, null)).toHaveLength(0)
  })
})
