import { paraDia } from './datas'
import type { RegistroRelatorio, Relatorio } from '../report/relatorio'

/** Organização operacional do projeto. Não altera campos científicos do manual. */
export interface GestaoNinho {
  id: string; projeto_id: string; ano: number; numero: string;
  previsao_eclosao: string|null; antecedencia_dias: number; nota_previsao: string|null;
  versao: number; operacao_id: string; atualizado_por: string; confirmado_em: unknown;
}
export interface ConfigGestao {
  projeto_id: string; uso_mib: number|null; medido_em: string|null;
  versao: number; atualizado_por: string; confirmado_em: unknown;
}
export interface EntradaGestao { ano:number; numero:string; previsao_eclosao:string|null; antecedencia_dias:number; nota_previsao:string|null }
export function validarEntradaGestao(e:EntradaGestao) {
  if(!Number.isInteger(e.ano)||e.ano<1000||e.ano>9999)throw new Error('Informe o ano de organização com quatro dígitos.')
  if(e.numero!==''&&!/^\d{3,6}$/.test(e.numero))throw new Error('Número anual deve ter de 3 a 6 dígitos, preservando zeros iniciais.')
  if(e.numero!==''&&Number(e.numero)<1)throw new Error('A numeração anual começa em 001.')
  if(e.numero!==''&&e.numero!==String(Number(e.numero)).padStart(3,'0'))throw new Error('Use a forma anual 001, 002…; não adicione zeros além dos três dígitos mínimos.')
  if(e.previsao_eclosao!==null&&paraDia(e.previsao_eclosao)===null)throw new Error('Previsão de eclosão inválida.')
  if(!Number.isInteger(e.antecedencia_dias)||e.antecedencia_dias<0||e.antecedencia_dias>60)throw new Error('Aviso deve ser configurado entre 0 e 60 dias antes da previsão.')
  if(e.previsao_eclosao!==null&&!e.nota_previsao?.trim())throw new Error('Informe a origem da previsão fornecida pela equipe.')
}
export function rotuloNinho(r:RegistroRelatorio,g?:GestaoNinho){const registro=r.origem.ocorrencia?.numeroRegistro;return registro?.trim()?'Ninho '+registro:g?'Ninho '+g.numero:r.ficha.ninho.codigoInterno}
export function diaDoAparelho(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function alertaPrevisao(r:RegistroRelatorio,g:GestaoNinho|undefined,hoje:string):{dias:number;texto:string}|null {
  if(!g?.previsao_eclosao||r.origem.aberturas.some(a=>a.dataEclosao!==null||a.dataAbertura!==null))return null
  const atual=paraDia(hoje),previsto=paraDia(g.previsao_eclosao)
  if(atual===null||previsto===null)return null
  const dias=previsto-atual
  if(dias>g.antecedencia_dias)return null
  return {dias,texto:dias<0?'Previsão vencida: conferir em campo':dias===0?'Eclosão estimada para hoje':`Eclosão estimada em ${dias} dias`}
}
export function aplicarAno(r:Relatorio,g:Record<string,GestaoNinho>,ano:string,confirmada:boolean):Relatorio {
  const selecionados=ano==='todos'?r.registros: r.registros.filter(n=>ano==='sem-ano'?!g[n.ficha.ninho.id]:String(g[n.ficha.ninho.id]?.ano)===ano)
  const registros=[...selecionados].sort((a,b)=>{const x=g[a.ficha.ninho.id],y=g[b.ficha.ninho.id];return x&&y?x.ano-y.ano||Number(x.numero)-Number(y.numero):x?-1:y?1:0})
  const excluidos=r.registros.length-registros.length
  const incluidos=new Set(registros.map(n=>n.ficha.ninho.id))
  return {...r,registros,organizacao:structuredClone(Object.fromEntries(Object.entries(g).filter(([id])=>incluidos.has(id)))),anoOrganizacao:ano,
    parcial:r.parcial||!confirmada,fonte:{...r.fonte,sincronizacaoConfirmada:r.fonte.sincronizacaoConfirmada&&confirmada},
    avisos:[...r.avisos,...r.exclusoes?['Contagens de exclusão por data/filtros referem-se à consulta anterior ao filtro anual.']:[],`Ano de organização: ${ano==='todos'?'todos':ano==='sem-ano'?'não definido':ano}. ${excluidos} ninhos ficaram fora deste filtro.`,...confirmada?[]:['Organização anual não confirmada no servidor: exportação parcial.']]}
}
export function indicadorArmazenamento(c:ConfigGestao|null){
  if(c?.uso_mib==null)return {percentual:null,pertoLimite:false}
  const percentual=c.uso_mib/1024*100
  return {percentual,pertoLimite:percentual>=80}
}
