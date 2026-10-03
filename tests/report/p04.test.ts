import {expect,it} from 'vitest'
import {mkdirSync,writeFileSync} from 'node:fs'
import {PDFDocument} from 'pdf-lib'
import {dadosDemonstracao} from '../../src/report/exemplos'
import {montarRelatorio,camposExportacao} from '../../src/report/relatorio'
import {secoesFicha,legivel,valorCampo} from '../../src/report/apresentacao'
import {gerarPDF} from '../../src/report/pdf'
const entrada=()=>({projetoNome:'Projeto demonstrativo',consulta:{projetoId:'projeto-demo',criterio:'OCORR' as const,inicio:'2026-10-01',fim:'2026-10-31',todos:true},dados:dadosDemonstracao(),fonte:{demonstracao:true,online:false,sincronizacaoConfirmada:false,conjuntoCompleto:true},geradoEm:'2026-10-02T18:00:00-03:00'})
it('todos inclui datas fora do mês, ausentes e divergentes sem escolher uma data',()=>{
 const e=entrada();e.dados[0]!.aberturas[0]!.noiteReferenciaEclosao='2026-10-02'
 const r=montarRelatorio({...e,consulta:{...e.consulta,criterio:'ECLOS'}})
 expect(r.registros).toHaveLength(e.dados.length);expect(r.registros.some(x=>x.linha.dataCriterio===null)).toBe(true);expect(r.parcial).toBe(true)
 const periodo=montarRelatorio({...e,consulta:{...e.consulta,todos:false,criterio:'ECLOS'}});expect(periodo.registros).toHaveLength(e.dados.length-1)
})
it('todos ainda respeita filtros e a mesma cópia exportada',()=>{
 const e=entrada();e.dados[0]!.ocorrencia!.localOrigem.praiaCodigo='somente-teste'
 const r=montarRelatorio({...e,consulta:{...e.consulta,filtros:{praiaCodigo:'somente-teste'}}});expect(r.registros).toHaveLength(1)
 expect(montarRelatorio(entrada()).registros).toHaveLength(e.dados.length)
})
it('ficha contém todos os campos do manual e destinos legíveis, sem objetos/UIDs/null',()=>{
 const r=montarRelatorio(entrada());for(const n of r.registros){const secoes=secoesFicha(n);const labels=secoes.flatMap(s=>s.linhas.map(l=>l[0]));for(const k of Object.keys(camposExportacao(n)))expect(labels.some(l=>l.endsWith('('+k+')'))).toBe(true)
 const texto=secoes.flatMap(s=>s.linhas.map(l=>l[1])).join(' ');expect(texto).not.toContain('{');expect(texto).not.toContain('null');expect(texto).not.toContain(n.origem.ocorrencia!.responsavelId)}
 expect(legivel(0)).toBe('0');expect(legivel(null)).toBe('Não informado');expect(valorCampo('TUMORES','I')).toContain('Indeterminado');expect(secoesFicha(r.registros[0]!).flatMap(s=>s.linhas).find(l=>l[0].includes('Comprimento'))?.[0]).toContain('(cm)')
})
it('gera todas as fichas A4 com observações longas e oferece prova fictícia renderizável',async()=>{
 const e=entrada();e.dados[0]!.ocorrencia!.observacoes='Observação de teste sem dados reais. '.repeat(100)
 const r=montarRelatorio(e);const b=await gerarPDF(r);const doc=await PDFDocument.load(b);expect(doc.getPageCount()).toBeGreaterThan(e.dados.length);expect(doc.getPages().every(p=>Math.abs(p.getWidth()-595.28)<.01)).toBe(true)
 if(process.env.P04_GRAVAR_EXEMPLO==='1'){mkdirSync('output/pdf',{recursive:true});writeFileSync('output/pdf/relatorio-p04-demonstracao.pdf',b)}
})
