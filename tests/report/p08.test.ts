import {expect,it} from 'vitest'
import {unzipSync,strFromU8} from 'fflate'
import {mkdirSync,writeFileSync} from 'node:fs'
import {gerarXLSX} from '../../src/report/xlsx'
import {montarRelatorio,gerarJSON} from '../../src/report/relatorio'
import {dadosDemonstracao} from '../../src/report/exemplos'
import {secoesFicha} from '../../src/report/apresentacao'
import type {GestaoNinho} from '../../src/domain/gestao'
it('Excel transpõe todos os campos e históricos, mantendo número como texto e conteúdo seguro',()=>{
 const dados=dadosDemonstracao();dados[0]!.ocorrencia!.observacoes='=HYPERLINK("https://example.test") '+ 'observação longa '.repeat(160)+'FIM_P08'
 const r=montarRelatorio({projetoNome:'Amostra fictícia P08',dados,consulta:{projetoId:'projeto-demo',todos:true,criterio:'OCORR',inicio:'2026-01-01',fim:'2026-12-31'},fonte:{demonstracao:true,online:false,sincronizacaoConfirmada:false,conjuntoCompleto:true},geradoEm:'2026-10-03T12:00:00Z'})
 r.organizacao=Object.fromEntries(r.registros.map((n,i)=>[n.ficha.ninho.id,{id:n.ficha.ninho.id,projeto_id:'projeto-demo',ano:2026,numero:String(i+1).padStart(3,'0'),previsao_eclosao:null,antecedencia_dias:7,nota_previsao:null,versao:1,operacao_id:'ficticio',atualizado_por:'equipe fictícia',confirmado_em:null} satisfies GestaoNinho]));r.anoOrganizacao='2026'
 const antes=gerarJSON(r),b=gerarXLSX(r),files=unzipSync(b),xml=strFromU8(files['xl/worksheets/sheet1.xml']!)
 expect(gerarJSON(r)).toBe(antes);expect(xml).toContain('r="B1" s="1" t="inlineStr"');expect(xml).toContain('>001</t>');expect(xml).toContain('>002</t>');expect(xml).toContain('state="frozen"');expect(xml).not.toContain('<f>');expect(xml).toContain('FIM_P08');expect(xml).toContain('Não informado');expect(xml).not.toContain('>null<');expect(xml).toContain('Latitude');expect(xml).toContain('Longitude');expect(xml).toContain('Transferência');expect(xml).toContain('Localização original');expect(xml).toContain('t="n"><v>0</v>')
 if(process.env.P08_GRAVAR==='1'){mkdirSync('output/xlsx',{recursive:true});mkdirSync('tmp/xlsx',{recursive:true});writeFileSync('output/xlsx/ninhos-p08-demonstracao.xlsx',b);writeFileSync('tmp/xlsx/esperado.json',JSON.stringify(r.registros.map(n=>({numero:r.organizacao![n.ficha.ninho.id]!.numero,linhas:secoesFicha(n).flatMap(s=>s.linhas)})),null,2))}
})
