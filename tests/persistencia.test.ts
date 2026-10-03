import { describe, expect, it } from 'vitest'
import {
  CHAVES_ESPERADAS,
  aberturaParaDoc,
  docParaAbertura,
  docParaNinho,
  docParaOcorrencia,
  docParaProjeto,
  docParaTransferencia,
  docParaVisita,
  ninhoParaDoc,
  ocorrenciaParaDoc,
  projetoParaDoc,
  transferenciaParaDoc,
  verificarCampos,
  visitaParaDoc,
} from '../src/domain/persistencia.ts'
import { aberturaBase, ninhoBase, ocorrenciaBase, transferenciaBase } from './auxiliares-agregado.ts'
import type { Visita } from '../src/domain/tipos.ts'

const visita: Visita = {
  id: 'v1',
  projetoId: 'p1',
  ninhoId: 'n1',
  dataVisita: '2026-10-10',
  noiteReferencia: '2026-10-09',
  responsavelId: 'u1',
  condicao: 'areia firme',
  eventos: ['mare'],
  observacoes: null,
  criadoPor: 'u1',
  criadoEm: '2026-10-10T07:00:00-03:00',
  atualizadoPor: 'u1',
  atualizadoEm: '2026-10-10T07:00:00-03:00',
  versao: 2,
}

const projeto = {
  id: 'p1',
  nome: 'Projeto tartaruga',
  sigla: 'PT',
  ativo: true,
  fuso: null,
  criadoEm: '2026-01-01T10:00:00-03:00',
  versao: 1,
}

describe('mapeamento camelCase <-> snake_case (F10)', () => {
  it('ida e volta nao perde valor nem converte null em zero', () => {
    const doc = ocorrenciaParaDoc({ ...ocorrenciaBase, numeroRegistro: '007', comprimentoCasco: null })
    expect(doc.numero_registro).toBe('007')
    expect(doc.comprimento_casco).toBeNull()
    expect(doc.local_origem).toMatchObject({ praia_codigo: '001', precisao_gps_m: 4 })

    const volta = docParaOcorrencia(doc)
    expect(volta.numeroRegistro).toBe('007')
    expect(volta.localOrigem.praiaCodigo).toBe('001')
    expect(volta.localOrigem.latitude).toBe(-12.34567)
    expect(volta.versao).toBe(1)
  })

  it('zeros iniciais do numero oficial sobrevivem a ida e volta', () => {
    const doc = transferenciaParaDoc(transferenciaBase)
    expect(doc.numero_ninho_cercado).toBe('12')
    expect(typeof doc.ovos_transferencia).toBe('number')
    expect(docParaTransferencia(doc).numeroNinhoCercado).toBe('12')
    expect(docParaTransferencia(doc).ovosTransferencia).toBe(92)
  })

  it('ninho nao grava copia de campo da ocorrencia nem da transferencia', () => {
    const doc = ninhoParaDoc(ninhoBase)
    const chaves = Object.keys(doc)
    for (const proibida of [
      'numero_registro',
      'local_origem',
      'local_atual',
      'tempo_transferencia',
      'numero_ninho_cercado',
      'ovos_transferencia',
    ]) {
      expect(chaves).not.toContain(proibida)
    }
    expect(docParaNinho(doc).ocorrenciaId).toBe('o1')
  })

  it('transferencia nao tem ovos_furados: OVOS_FURAD pertence a abertura', () => {
    const doc = transferenciaParaDoc(transferenciaBase)
    expect(Object.keys(doc)).not.toContain('ovos_furados')
    expect(Object.keys(aberturaParaDoc(aberturaBase))).toContain('ovos_furados')
  })

  it('todas as entidades tem projeto_id, trilha e versao', () => {
    const docs = [
      ocorrenciaParaDoc(ocorrenciaBase),
      ninhoParaDoc(ninhoBase),
      transferenciaParaDoc(transferenciaBase),
      visitaParaDoc(visita),
      aberturaParaDoc(aberturaBase),
    ]
    for (const doc of docs) {
      expect(typeof doc.projeto_id).toBe('string')
      expect(typeof doc.versao).toBe('number')
      expect(typeof doc.criado_em).toBe('string')
      expect(doc).toHaveProperty('atualizado_por')
    }
  })

  it('projeto guarda o fuso como texto, e null quando nao confirmado', () => {
    expect(projetoParaDoc(projeto).fuso).toBeNull()
    expect(docParaProjeto(projetoParaDoc({ ...projeto, fuso: 'America/Sao_Paulo' })).fuso).toBe(
      'America/Sao_Paulo',
    )
  })

  it('visita e abertura voltam completas', () => {
    expect(docParaVisita(visitaParaDoc(visita))).toMatchObject({ dataVisita: '2026-10-10', eventos: ['mare'] })
    expect(docParaAbertura(aberturaParaDoc(aberturaBase))).toMatchObject({
      vivos: 55,
      ovosFurados: 3,
      noiteReferenciaEclosao: '2026-10-24',
    })
  })
})

describe('campo desconhecido e campo faltante sao detectados', () => {
  it('acha chave a mais, que e a assinatura de copia sem dono', () => {
    const doc = { ...ninhoParaDoc(ninhoBase), local_origem: { praia_codigo: '001' } }
    const achadas = verificarCampos(doc, CHAVES_ESPERADAS.ninho())
    expect(achadas).toEqual([
      { caminho: '', tipo: 'desconhecido', chave: 'local_origem' },
    ])
  })

  it('acha chave faltante, que e a assinatura de gravacao parcial', () => {
    const { versao: _versao, ...semVersao } = ninhoParaDoc(ninhoBase)
    const achadas = verificarCampos(semVersao, CHAVES_ESPERADAS.ninho())
    expect(achadas).toEqual([{ caminho: '', tipo: 'ausente', chave: 'versao' }])
  })

  it('documento completo nao gera divergencia', () => {
    expect(verificarCampos(ninhoParaDoc(ninhoBase), CHAVES_ESPERADAS.ninho())).toEqual([])
  })

  it('o mapeador e a lista de chaves nunca divergem entre si', () => {
    // Um mapeador com chave errada (ex.: `patente` no lugar de `flagrante`) quebra aqui.
    const pares = [
      [ocorrenciaParaDoc(ocorrenciaBase), CHAVES_ESPERADAS.ocorrencia()],
      [ninhoParaDoc(ninhoBase), CHAVES_ESPERADAS.ninho()],
      [transferenciaParaDoc(transferenciaBase), CHAVES_ESPERADAS.transferencia()],
      [visitaParaDoc(visita), CHAVES_ESPERADAS.visita()],
      [aberturaParaDoc(aberturaBase), CHAVES_ESPERADAS.abertura()],
    ] as const
    for (const [doc, esperado] of pares) {
      expect(verificarCampos(doc, esperado)).toEqual([])
      expect(esperado).toContain('versao')
    }
  })

  it('ida e volta preserva o booleano do flagrante', () => {
    const doc = ocorrenciaParaDoc(ocorrenciaBase)
    expect(doc).toHaveProperty('flagrante', true)
    expect(doc).not.toHaveProperty('patente')
    expect(docParaOcorrencia(doc).flagrante).toBe(true)
  })
})
