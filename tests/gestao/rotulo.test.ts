import {expect,it} from 'vitest'
import {rotuloNinho,type GestaoNinho} from '../../src/domain/gestao'
import {montarRelatorio,gerarJSON} from '../../src/report/relatorio'
import {dadosDemonstracao} from '../../src/report/exemplos'
it('identificação visível prioriza registro preservando zeros, sem mudar número anual ou UUID',()=>{
 const r=montarRelatorio({projetoNome:'Fictício',dados:dadosDemonstracao(),consulta:{projetoId:'projeto-demo',todos:true,criterio:'OCORR',inicio:'2026-01-01',fim:'2026-12-31'},fonte:{demonstracao:true,online:false,sincronizacaoConfirmada:false,conjuntoCompleto:true},geradoEm:'2026-10-03T12:00:00Z'})
 const n=r.registros[0]!,g:GestaoNinho={id:n.ficha.ninho.id,projeto_id:'projeto-demo',ano:2026,numero:'001',previsao_eclosao:null,antecedencia_dias:7,nota_previsao:null,versao:1,operacao_id:'op',atualizado_por:'teste',confirmado_em:null}
 n.origem.ocorrencia!.numeroRegistro='002';const antes=gerarJSON(r)
 expect(rotuloNinho(n,g)).toBe('Ninho 002');expect(rotuloNinho(n)).toBe('Ninho 002');expect(gerarJSON(r)).toBe(antes);expect(g.numero).toBe('001')
 n.origem.ocorrencia!.numeroRegistro=null;expect(rotuloNinho(n,g)).toBe('Ninho 001');expect(rotuloNinho(n)).toBe(n.ficha.ninho.codigoInterno)
})
