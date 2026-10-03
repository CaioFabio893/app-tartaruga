import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dadosDemonstracao } from '../../src/report/exemplos'
import { montarRelatorio, totalObservado, gerarCSV, gerarJSON } from '../../src/report/relatorio'
import { gerarPDF } from '../../src/report/pdf'

const fonte = { demonstracao: true, online: false, sincronizacaoConfirmada: false, conjuntoCompleto: true }
function entrada() { return { projetoNome: 'Projeto demonstrativo', consulta: { projetoId: 'projeto-demo',
  criterio: 'ECLOS' as const, inicio: '2026-10-01', fim: '2026-10-31' }, dados: dadosDemonstracao(), fonte, geradoEm: '2026-10-02T18:00:00-03:00' } }

describe('relatório: seleção única e insumos preservados', () => {
  it('inclui eclosão antes da abertura e não inventa contagens', () => {
    const r = montarRelatorio(entrada())
    expect(r.registros).toHaveLength(5)
    expect(r.registros[4]!.linha.vivos).toBeNull()
    expect(r.registros[4]!.linha.dataCriterio).toBe('2026-10-05')
    expect(r.registros[2]!.linha.vivos).toBe(0)
    expect(r.parcial).toBe(true)
  })
  it('período de um dia inclui o limite nas três consultas', () => {
    for (const [criterio, dia] of [['OCORR','2026-08-01'], ['ECLOS','2026-10-01'], ['ABERT','2026-10-02']] as const) {
      const e = entrada(); const r = montarRelatorio({ ...e, consulta: { ...e.consulta, criterio, inicio: dia, fim: dia } })
      expect(r.registros.map(x => x.ficha.ninho.id)).toEqual(['ninho-demo-1'])
    }
  })
  it('conta ausentes no escopo conhecido e oculta contagem quando incompleto', () => {
    const e = entrada()
    const r = montarRelatorio({ ...e, consulta: { ...e.consulta, criterio: 'OCORR', inicio: '2026-08-01', fim: '2026-08-31' } })
    expect(r.exclusoes?.dataAusente).toBe(1)
    expect(montarRelatorio({...e, fonte: {...fonte, conjuntoCompleto: false}}).exclusoes).toBeNull()
  })
  it('combina praia/especie/temporada sem OU implícito', () => {
    const e = entrada()
    e.dados[0]!.ocorrencia!.localOrigem.praiaCodigo = 'codigo-fornecido-em-teste'
    const r = montarRelatorio({...e, consulta: {...e.consulta, filtros: { praiaCodigo: 'codigo-fornecido-em-teste', especieCodigo: 'CC', temporadaId: 'temporada-demo-2026' }}})
    expect(r.registros.map(x => x.ficha.ninho.id)).toEqual(['ninho-demo-1'])
  })
  it('recusa vínculo cruzado, duplicidade e período impossível', () => {
    const e = entrada(); e.dados[0]!.aberturas[0]!.projetoId = 'outro'
    expect(() => montarRelatorio(e)).toThrow('Vínculo')
    const d = entrada(); d.dados.push(d.dados[0]!)
    expect(() => montarRelatorio(d)).toThrow('duplicado')
    expect(() => montarRelatorio({...entrada(), consulta: {...entrada().consulta, fim: '2026-02-30'}})).toThrow()
  })
  it('sinaliza datas divergentes e múltiplas contagens sem escolher uma', () => {
    const e = entrada(); const a = e.dados[0]!.aberturas[0]!
    a.noiteReferenciaEclosao = '2026-10-02'
    const r = montarRelatorio(e)
    expect(r.exclusoes?.dataAmbigua).toBe(1)
    a.noiteReferenciaEclosao = a.dataEclosao
    e.dados[0]!.aberturas.push({...a, id: 'outra-abertura'})
    expect(montarRelatorio(e).registros[0]!.linha.ovosTotais).toBeNull()
  })
  it('snapshot não acompanha edição dos dados de origem e preserva localização', () => {
    const e = entrada(); const antes = JSON.stringify(e); const r = montarRelatorio(e)
    expect(JSON.stringify(e)).toBe(antes)
    e.dados[0]!.ocorrencia!.numeroRegistro = 'alterado'
    expect(r.registros[0]!.linha.numeroRegistro).toBe('0001')
    expect(r.registros[1]!.ficha.ocorrencia!.localOrigem.localKm).toBe('2')
    expect(r.registros[1]!.ficha.posicaoAtual.local.localKm).toBe('8')
  })
  it('todos os valores ausentes não geram total zero', () => {
    const e = entrada(); e.dados = [e.dados[4]!]
    expect(totalObservado(montarRelatorio(e), 'vivos')).toEqual({valor: null, observados: 0, ausentes: 1})
  })
  it('valores inválidos não entram em totais e datas de outros critérios são conferidas', () => {
    const e=entrada();e.dados[0]!.aberturas[0]!.vivos=-1
    expect(()=>montarRelatorio(e)).toThrow('Contagem inválida')
    const d=entrada();d.dados[0]!.aberturas[0]!.dataAbertura='2026-02-30'
    expect(()=>montarRelatorio(d)).toThrow('Data de abertura')
  })
  it('divergência de datas torna parcial mesmo com servidor confirmado', () => {
    const e=entrada();e.dados[0]!.aberturas[0]!.noiteReferenciaEclosao='2026-10-02'
    expect(montarRelatorio({...e,fonte:{demonstracao:false,online:true,sincronizacaoConfirmada:true,conjuntoCompleto:true}}).parcial).toBe(true)
  })
  it('definitivo só com conjunto completo e confirmação online', () => {
    const e = entrada()
    expect(montarRelatorio({...e, fonte: {demonstracao: false, online: true, sincronizacaoConfirmada: true, conjuntoCompleto: true}}).parcial).toBe(false)
    expect(montarRelatorio({...e, fonte: {demonstracao: false, online: true, sincronizacaoConfirmada: false, conjuntoCompleto: true}}).parcial).toBe(true)
  })
})

describe('exportações', () => {
  it('JSON mantém zeros, null, origens e fórmulas; CSV neutraliza texto executável', () => {
    const e = entrada(); e.dados[0]!.ocorrencia!.observacoes = ' \t=SUM(1;2) "ação"\nsegunda linha'
    const r = montarRelatorio(e); const json = JSON.parse(gerarJSON(r))
    expect(json.registros[0].campos.N_REGISTRO).toBe('0001')
    expect(json.registros[4].campos.VIVOS).toBeNull()
    expect(json.registros[0].campos.VERSAO_FORMULA).toBe('v2')
    expect(json.registros[0].campos.OBS).toBe(e.dados[0]!.ocorrencia!.observacoes)
    expect(gerarCSV(r)).toContain("' \t=SUM")
    expect(gerarCSV(r)).toContain('"0001"')
    expect(gerarCSV(r)).toContain('""ação""')
  })
  it('PDF A4 tem páginas válidas, acentos e observação longa sem erro', async () => {
    const e = entrada(); e.dados[0]!.ocorrencia!.observacoes = ('Ação de conservação, eclosão e transferência. '.repeat(70)) + 'PALAVRALONGA'.repeat(25) + ' FIM_DA_OBSERVACAO 🐢'
    const r = montarRelatorio(e); const bytes = await gerarPDF(r); const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBeGreaterThan(10)
    expect(pdf.getPages().every(p => Math.abs(p.getWidth() - 595.28) < .01)).toBe(true)
    if(process.env.E02_GRAVAR_EXEMPLO==='1') {
      mkdirSync('tmp/pdfs/e02',{recursive:true})
      writeFileSync('tmp/pdfs/e02/observacao-longa.pdf',bytes)
    }
  })
  it('vazio gera uma página explicativa sem ficha em branco', async () => {
    const e = entrada(); e.dados = []
    const r = montarRelatorio(e)
    expect((await PDFDocument.load(await gerarPDF(r))).getPageCount()).toBe(1)
    expect(gerarCSV(r)).toContain('N_REGISTRO')
    expect(gerarCSV(r)).toContain('TEMP_INCUB')
    expect(gerarCSV(r)).toContain('OVOS_N_ECL')
  })
  it('mais de 500 registros sem truncamento e amostra reproduzível', async () => {
    const e = entrada(); const base = e.dados[0]!
    e.dados = Array.from({length: 501}, (_, i) => {
      const d = structuredClone(base); d.ninho.id = `n-${i}`; d.ocorrencia!.id = `o-${i}`
      d.ocorrencia!.ninhoId = d.ninho.id; d.ninho.ocorrenciaId = d.ocorrencia!.id
      d.aberturas[0]!.ninhoId = d.ninho.id; d.aberturas[0]!.id = `a-${i}`; return d
    })
    const r = montarRelatorio(e)
    expect(r.registros).toHaveLength(501)
    expect(JSON.parse(gerarJSON(r)).registros.map((x: {ficha: {ninho: {id: string}}}) => x.ficha.ninho.id)).toEqual(r.registros.map(x => x.ficha.ninho.id))
    expect((await PDFDocument.load(await gerarPDF(r))).getPageCount()).toBeGreaterThan(501)
    if (process.env.E02_GRAVAR_EXEMPLO === '1') {
      mkdirSync('output/pdf', {recursive: true})
      writeFileSync('output/pdf/relatorio-demonstracao.pdf', await gerarPDF(montarRelatorio(entrada())))
    }
  }, 30000)
})
