import { strToU8, zipSync } from 'fflate'
import { secoesFicha, dataLegivel } from './apresentacao'
import { camposExportacao, type Relatorio } from './relatorio'

type Celula=string|number
interface Linha {valores:Celula[];secao?:boolean}
const NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
function xml(s:string){
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/u.test(s))throw new Error('Um texto contém caractere incompatível com Excel. Preserve o JSON e confira a observação antes de exportar.')
  return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!))
}
function coluna(n:number){let s='';for(n++;n>0;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s}
function partes(v:Celula):Celula[]{if(typeof v==='number')return [v];const p:string[]=[];let atual='',linhas=1,col=0;for(const c of v){if(atual.length>=800||linhas>=26){p.push(atual);atual='';linhas=1;col=0}atual+=c;if(c==='\n'){linhas++;col=0}else if(c!=='\r'&&++col>=32){linhas++;col=0}}if(atual)p.push(atual);return p.length?p:['']}
function folha(linhas:Linha[],congelar=true){
 if(linhas.length>1048576)throw new Error('O relatório excede o limite de linhas do Excel. Reduza o período ou a seleção.')
 const cols=Math.max(1,...linhas.map(l=>l.valores.length))
 const linhasXml=linhas.map((l,i)=>{
  const altura=l.secao||i===0?24:Math.min(409,Math.max(20,...l.valores.map((v,j)=>typeof v==='string'?v.split(/\r?\n/).reduce((a,l)=>a+Math.max(1,Math.ceil(l.length/(j===0?48:32))),0)*14+8:20)))
  return `<row r="${i+1}" ht="${altura}" customHeight="1">`+l.valores.map((v,j)=>{const s=i===0?1:l.secao?2:typeof v==='number'?4:3;const ref=coluna(j)+(i+1);return typeof v==='number'?`<c r="${ref}" s="${s}" t="n"><v>${v}</v></c>`:`<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`}).join('')+'</row>'
 }).join('')
 return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="${NS}"><dimension ref="A1:${coluna(cols-1)}${Math.max(1,linhas.length)}"/><sheetViews><sheetView workbookViewId="0">${congelar?'<pane xSplit="1" ySplit="1" topLeftCell="B2" activePane="bottomRight" state="frozen"/>':''}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="20"/><cols><col min="1" max="1" width="54" customWidth="1"/>${cols>1?`<col min="2" max="${cols}" width="36" customWidth="1"/>`:''}</cols><sheetData>${linhasXml}</sheetData><pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/></worksheet>`
}
/** XLSX OpenXML local: um ninho por coluna, sem fórmulas vindas do usuário. */
export function gerarXLSX(r:Relatorio):Uint8Array {
 const arquivos:Record<string,Uint8Array>={},nomes:string[]=[],add=(n:string,s:string)=>{arquivos[n]=strToU8(s)}
 const grupos=[];for(let i=0;i<r.registros.length;i+=16383)grupos.push(r.registros.slice(i,i+16383));if(!grupos.length)grupos.push([])
 for(const [i,registros] of grupos.entries()){
  nomes.push(grupos.length===1?'Ninhos':'Ninhos '+(i+1))
  const campos=registros.map(n=>{
   const m=new Map<string,{titulo:string;rotulo:string;valor:Celula}>(),g=r.organizacao?.[n.ficha.ninho.id]
   const secoes=[{titulo:'Organização do projeto',linhas:[['Ano de organização',g?String(g.ano):'Não definido'],['Número anual do ninho',g?.numero??'Não definido'],['Identificador técnico do ninho',n.ficha.ninho.id],['Previsão de eclosão (informada pela equipe)',dataLegivel(g?.previsao_eclosao)],['Origem da previsão',g?.nota_previsao??'Não informada'],['Avisar antes (dias)',g?String(g.antecedencia_dias):'Não configurado']] as [string,string][]},...secoesFicha(n,r.nomesResponsaveis)]
   const originais=camposExportacao(n)
   for(const s of secoes)for(const [j,[rotulo,valor]] of s.linhas.entries()){
    const k=/\(([A-Z_]+)\)$/.exec(rotulo)?.[1],original=k?originais[k as keyof typeof originais]:undefined
    const v=rotulo==='Ano de organização'&&g?g.ano:rotulo==='Avisar antes (dias)'&&g?g.antecedencia_dias:typeof original==='number'?['LATITUDE','LONGITUDE'].includes(k!)?String(original):original:valor
    m.set(`${s.titulo}\u0001${j}\u0001${rotulo}`,{titulo:s.titulo,rotulo,valor:v})
   }
   return m
  })
  const chaves=[...new Set(campos.flatMap(m=>[...m.keys()]))]
  // Agrupar seções de históricos mesmo quando têm quantidades diferentes entre ninhos.
  const titulos=[...new Set(chaves.map(k=>k.split('\u0001')[0]!))]
  const linhas:Linha[]=[{valores:['Informação',...registros.map(n=>r.organizacao?.[n.ficha.ninho.id]?.numero??n.ficha.ninho.codigoInterno)]}]
  for(const titulo of titulos){linhas.push({secao:true,valores:[titulo,...registros.map(()=> '')]});for(const k of chaves.filter(k=>k.startsWith(titulo+'\u0001'))){const celulas=campos.map(m=>m.get(k)?.valor??'Não se aplica a este ninho'),quant=Math.max(...celulas.map(v=>partes(v).length)),rotulo=campos.map(m=>m.get(k)).find(Boolean)!.rotulo
    for(let j=0;j<quant;j++)linhas.push({valores:[rotulo+(j?' (continuação '+(j+1)+')':''),...celulas.map(v=>partes(v)[j]??'')]})}}
  if(!registros.length)linhas.push({valores:['Resultado','Nenhum ninho atende aos filtros.']})
  add(`xl/worksheets/sheet${nomes.length}.xml`,folha(linhas))
 }
 nomes.push('Sobre o relatório')
 add(`xl/worksheets/sheet${nomes.length}.xml`,folha([
  {valores:['Relatório de monitoramento',r.projetoNome]},
  {valores:['Estado',r.fonte.demonstracao?'DEMONSTRAÇÃO / PARCIAL':r.parcial?'PARCIAL':'CONFIRMADO NO SERVIDOR']},
  {valores:['Gerado em',r.geradoEm]},{valores:['Ano de organização',r.anoOrganizacao??'Não filtrado']},
  {valores:['Abrangência',r.consulta.todos?'Todos os ninhos conforme filtros':dataLegivel(r.consulta.inicio)+' a '+dataLegivel(r.consulta.fim)]},
  {valores:['Critério de data',r.consulta.criterio]},{valores:['Ninhos incluídos',r.registros.length]},
  {valores:['Versão da fórmula',r.versaoFormula]},
  {valores:['Leitura','Cada coluna representa um ninho. Primeira linha e coluna de informações ficam fixas. Textos longos seguem em linhas de continuação. Não há fórmulas executáveis.']},
  {valores:['Números','Número anual não é N_REGISTRO nem N_NINHO do cercado. Zeros iniciais são texto.']},
  ...r.avisos.map(a=>({valores:['Aviso',a]})),
 ],false))
 add('[Content_Types].xml',`<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${nomes.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`)
 add('_rels/.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
 add('xl/workbook.xml',`<?xml version="1.0"?><workbook xmlns="${NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${nomes.map((n,i)=>`<sheet name="${xml(n)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`)
 add('xl/_rels/workbook.xml.rels',`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${nomes.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`)
 add('xl/styles.xml',`<?xml version="1.0"?><styleSheet xmlns="${NS}"><fonts count="2"><font><sz val="10"/><name val="Calibri"/><color rgb="FF12313B"/></font><font><b/><sz val="10"/><name val="Calibri"/><color rgb="FFFFFFFF"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0B3C49"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF1F2"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="49" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="49" fontId="0" fillId="3" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`)
 return zipSync(arquivos,{level:6})
}
