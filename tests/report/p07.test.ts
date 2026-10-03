import { expect, it } from 'vitest'
import { mkdirSync, writeFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { dadosDemonstracao } from '../../src/report/exemplos'
import { montarRelatorio, gerarJSON } from '../../src/report/relatorio'
import { secoesFicha } from '../../src/report/apresentacao'
import { gerarPDF } from '../../src/report/pdf'

it('relatório completo ocupa menos páginas sem alterar o snapshot e fornece prova de conteúdo', async () => {
  const dados = dadosDemonstracao()
  dados[0]!.ocorrencia!.observacoes = 'Observação de teste sem dados reais. '.repeat(100) + ' FIM_OBSERVACAO_P07'
  const r = montarRelatorio({ projetoNome: 'Projeto demonstrativo', dados,
    consulta: { projetoId: 'projeto-demo', todos: true, criterio: 'OCORR', inicio: '2026-10-01', fim: '2026-10-31' },
    fonte: { demonstracao: true, online: false, sincronizacaoConfirmada: false, conjuntoCompleto: true },
    geradoEm: '2026-10-02T18:00:00-03:00',
  })
  const antes = gerarJSON(r), bytes = await gerarPDF(r), doc = await PDFDocument.load(bytes)
  expect(gerarJSON(r)).toBe(antes)
  expect(doc.getPages().every(p => Math.abs(p.getWidth() - 595.28) < .01 && Math.abs(p.getHeight() - 841.89) < .01)).toBe(true)
  if (process.env.P07_BASELINE !== '1') expect(doc.getPageCount()).toBeLessThan(19)
  if (process.env.P07_GRAVAR === '1' || process.env.P07_BASELINE === '1') {
    mkdirSync('tmp/pdfs/p07', { recursive: true })
    if (process.env.P07_BASELINE === '1') writeFileSync('tmp/pdfs/p07/antes.pdf', bytes)
    else {
      mkdirSync('output/pdf', { recursive: true })
      writeFileSync('output/pdf/relatorio-p07-demonstracao.pdf', bytes)
      writeFileSync('tmp/pdfs/p07/conteudo-esperado.json', JSON.stringify(r.registros.flatMap(n => secoesFicha(n).flatMap(s => s.linhas)), null, 2))
    }
  }
})
