import { expect, it } from 'vitest'
import { dadosDemonstracao } from '../../src/report/exemplos'
import { gerarCSV, gerarJSON, montarRelatorio } from '../../src/report/relatorio'

it.each(['=1+1', '+1+1', '-1+1', '@SUM(1)', '\t=1+1'])('lista %s não vira fórmula CSV e JSON conserva origem', (entrada) => {
  const dados = dadosDemonstracao()
  const o = dados[0]!.ocorrencia!
  o.coletaMaterialBiologico = [entrada, 'material observado']
  o.localOrigem.latitude = -8.1234567
  const r = montarRelatorio({ projetoNome: 'Teste fictício', dados,
    consulta: { projetoId: 'projeto-demo', todos: true, criterio: 'ECLOS', inicio: '2026-10-01', fim: '2026-10-31' },
    geradoEm: '2026-10-03T00:00:00Z',
    fonte: { demonstracao: true, online: false, sincronizacaoConfirmada: false, conjuntoCompleto: true },
  })
  const csv = gerarCSV(r)
  expect(csv).toContain(`"'${entrada} | material observado"`)
  expect(csv).toContain('"-8.1234567"')
  expect(csv).not.toContain('"\'-8.1234567"')
  const original = JSON.parse(gerarJSON(r)).registros.find((v: { campos: { COLETA_MATERIAL_BIOLOGICO: unknown } }) => Array.isArray(v.campos.COLETA_MATERIAL_BIOLOGICO) && v.campos.COLETA_MATERIAL_BIOLOGICO[0] === entrada)
  expect(original.campos.COLETA_MATERIAL_BIOLOGICO).toEqual([entrada, 'material observado'])
  expect(o.coletaMaterialBiologico).toEqual([entrada, 'material observado'])
})
