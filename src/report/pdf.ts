import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import {rotuloNinho} from '../domain/gestao'
import {totalObservado,type Relatorio} from './relatorio'
import {dataLegivel,legivel,secoesFicha,valorCampo,type LinhaCampo} from './apresentacao'

/** PDF A4 com resumo de todo o snapshot e fichas completas; dados originais no JSON. */
export async function gerarPDF(r:Relatorio):Promise<Uint8Array> {
 const doc=await PDFDocument.create();doc.setTitle('Monitoramento de ninhos - relatório');doc.setSubject((r.consulta.todos?'Todos os ninhos':'Critério '+r.consulta.criterio)+'; '+(r.parcial?'PARCIAL':'sincronização confirmada'));doc.setCreationDate(new Date(r.geradoEm))
 const normal=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold)
 const margem=32,largura=595.28-2*margem,cor=rgb(.07,.19,.23),suave=rgb(.94,.96,.96)
 let pagina:PDFPage,y=0,contexto='',alternar=false
 const substituidos=new Set<string>()
 function seguro(s:string,font:PDFFont){return [...s.normalize('NFC')].map(c=>{if(['\r','\n','\t'].includes(c))return ' ';try{font.encodeText(c);return c}catch{substituidos.add(c);return '?'}}).join('')}
 function quebrar(s:string,font:PDFFont,size:number,width:number){width-=4;const saida:string[]=[];for(const p of s.split(/\r?\n/)){let linha='';for(const c of seguro(p,font)){if(font.widthOfTextAtSize(linha+c,size)>width&&linha){const i=linha.lastIndexOf(' ');if(i>0){saida.push(linha.slice(0,i));linha=linha.slice(i+1)+c}else{saida.push(linha);linha=c}}else linha+=c}saida.push(linha)}return saida}
 function nova(){pagina=doc.addPage([595.28,841.89]);pagina.drawRectangle({x:0,y:786,width:595.28,height:56,color:rgb(.043,.235,.286)});pagina.drawText('MONITORAMENTO DE NINHOS',{x:margem,y:814,size:12,font:bold,color:rgb(1,1,1)});pagina.drawText(r.fonte.demonstracao?'DEMONSTRAÇÃO - PARCIAL':r.parcial?'RELATÓRIO PARCIAL':'DADOS CONFIRMADOS NO SERVIDOR',{x:margem,y:798,size:8,font:normal,color:rgb(1,1,1)});y=764;if(contexto){const ls=quebrar(contexto,bold,9,largura);for(const l of ls){pagina.drawText(l,{x:margem,y,size:9,font:bold,color:cor});y-=13}y-=6}}
 function texto(s:string,size=9,font=normal){for(const l of quebrar(s,font,size,largura)){if(y<70)nova();pagina.drawText(l,{x:margem,y,size,font,color:cor});y-=12}y-=3}
 function titulo(s:string){if(y<125)nova();y-=5;pagina.drawRectangle({x:margem,y:y-6,width:largura,height:21,color:suave});pagina.drawText(seguro(s,bold),{x:margem+7,y,size:10,font:bold,color:cor});y-=24}
 function linha([rotulo,valor]:LinhaCampo){const esq=quebrar(rotulo,bold,8.5,184),dir=quebrar(valor,normal,9,largura-206),n=Math.max(esq.length,dir.length);let i=0;while(i<n){if(y<88)nova();const quant=Math.min(n-i,Math.floor((y-66)/12));if(alternar)pagina.drawRectangle({x:margem,y:y-quant*12+3,width:largura,height:quant*12+4,color:suave});for(let j=0;j<quant;j++){if(esq[i+j])pagina.drawText(esq[i+j]!,{x:margem+6,y:y-j*12,size:8.5,font:bold,color:cor});if(dir[i+j])pagina.drawText(dir[i+j]!,{x:margem+200,y:y-j*12,size:9,font:normal,color:cor})}i+=quant;y-=quant*12+5}alternar=!alternar}
 const nomeNinho=(n:Relatorio['registros'][number])=>rotuloNinho(n,r.organizacao?.[n.ficha.ninho.id])+(r.organizacao?.[n.ficha.ninho.id]?' (ano '+r.organizacao[n.ficha.ninho.id]!.ano+')':'')
 const coluna=(largura-12)/2
 function compacto(l:LinhaCampo){return quebrar(l[0]+': '+l[1],normal,9,coluna-12).length<=4}
 function par(a:LinhaCampo,b?:LinhaCampo){
  const celulas=[a,...b?[b]:[]].map(l=>quebrar(l[0]+': '+l[1],normal,9,coluna-12))
  const altura=Math.max(...celulas.map(c=>c.length*12+2))
  if(y-altura<66)nova()
  celulas.forEach((c,i)=>{const x=margem+i*(coluna+12);pagina.drawRectangle({x,y:y-altura+7,width:coluna,height:altura,color:suave});let yy=y;for(const l of c){pagina.drawText(l,{x:x+6,y:yy,size:9,font:normal,color:cor});yy-=12}})
  y-=altura+3
 }
 function campos(linhas:LinhaCampo[]){for(let i=0;i<linhas.length;i++){const a=linhas[i]!;if(compacto(a)){const b=linhas[i+1];if(b&&compacto(b)){par(a,b);i++}else par(a)}else{texto(a[0],8.5,bold);texto(a[1])}}}
 nova();texto(r.projetoNome,16,bold);texto(r.consulta.todos?'Abrangência: todos os ninhos do projeto, conforme filtros.':'Período: '+dataLegivel(r.consulta.inicio)+' a '+dataLegivel(r.consulta.fim)+' (datas inclusivas).');texto('Critério de data: '+({OCORR:'Ocorrência',ECLOS:'Eclosão',ABERT:'Abertura'}[r.consulta.criterio])+(r.consulta.todos?' (apenas referência; sem filtro por data)':''));texto('Gerado em: '+r.geradoEm+' | Fórmula: '+r.versaoFormula+' | Ninhos incluídos: '+r.registros.length)
 const nomesFiltros:Record<string,string>={praiaCodigo:'Praia',especieCodigo:'Espécie',temporadaId:'Temporada',situacao:'Situação',historicoNinho:'Histórico',natureza:'Natureza'}
 texto('Filtros adicionais: '+(Object.entries(r.consulta.filtros??{}).filter(([,v])=>v!=null&&v!=='').map(([k,v])=>(nomesFiltros[k]??k)+': '+legivel(v)).join('; ')||'nenhum'))
 texto('Não informado: sem dado coletado. Não aplicável: condição não atendida. Indeterminado: resposta registrada. Zero: valor observado. Coordenadas com sete casas para consulta; casas decimais não aumentam a precisão do GPS.')
 if(r.exclusoes){linha(['Ninhos excluídos por data ausente',legivel(r.exclusoes.dataAusente)]);linha(['Datas divergentes: conferir',legivel(r.exclusoes.dataAmbigua)]);if(r.exclusoes.foraPeriodo!==null)linha(['Excluídos fora do período',legivel(r.exclusoes.foraPeriodo)]);if(r.exclusoes.outrosFiltros!==null)linha(['Excluídos por outros filtros',legivel(r.exclusoes.outrosFiltros)])}
 for(const a of r.avisos.filter(a=>!a.startsWith('—')))texto(a)
 titulo('Totais dos valores observados')
 const rotulos={vivos:'Filhotes vivos',natimortos:'Filhotes natimortos',ovosNaoEclodidos:'Ovos não eclodidos',ovosFurados:'Ovos furados',ovosTotais:'Total de ovos'}
 for(const k of Object.keys(rotulos) as (keyof typeof rotulos)[]){const t=totalObservado(r,k);linha([rotulos[k],legivel(t.valor)+' ('+t.observados+' ninhos com valor; '+t.ausentes+' sem valor)'+(t.motivo?'. '+t.motivo:'')])}
 titulo('Resumo de todos os ninhos incluídos')
 if(!r.registros.length)texto('Nenhum ninho atende à abrangência e aos filtros selecionados.')
 for(const [i,n] of r.registros.entries()){texto((i+1)+'. Registro '+legivel(n.linha.numeroRegistro)+' - '+nomeNinho(n),10,bold);texto('Data de referência: '+dataLegivel(n.linha.dataCriterio)+'; praia original: '+legivel(n.linha.praiaCodigo)+'; espécie: '+valorCampo('ESPECIE',n.linha.especieCodigo)+'; conservação: '+valorCampo('SITUACAO',n.linha.situacao)+'; histórico: '+valorCampo('HIST_NINHO',n.linha.historicoNinho)+'; vivos: '+legivel(n.linha.vivos)+'; total de ovos: '+legivel(n.linha.ovosTotais)+'; vivos (%): '+legivel(n.linha.percentualVivos))}
 for(const [i,n] of r.registros.entries()){contexto='Ficha '+(i+1)+' de '+r.registros.length+' - Registro '+legivel(n.linha.numeroRegistro)+' - '+nomeNinho(n);if(y<230)nova();else{y-=12;texto(contexto,10,bold)}const g=r.organizacao?.[n.ficha.ninho.id];if(g){titulo('Organização do projeto');campos([['Ano de organização',String(g.ano)],['Número anual',g.numero],['Previsão da equipe',dataLegivel(g.previsao_eclosao)],['Origem da previsão',legivel(g.nota_previsao)],['Avisar antes (dias)',String(g.antecedencia_dias)]])}for(const s of secoesFicha(n,r.nomesResponsaveis)){titulo(s.titulo);campos(s.linhas)}}
 if(substituidos.size){contexto='Conferência de caracteres';nova();titulo('Caracteres não disponíveis na fonte local');texto(substituidos.size+' caracteres distintos foram substituídos por ?. O JSON mantém o texto integral. Confira a cópia JSON para esses trechos.')}
 const pages=doc.getPages();for(const [i,p] of pages.entries()){p.drawLine({start:{x:margem,y:45},end:{x:595.28-margem,y:45},thickness:.5,color:rgb(.7,.7,.7)});p.drawText('Página '+(i+1)+' de '+pages.length+' | '+(r.consulta.todos?'Todos os ninhos':dataLegivel(r.consulta.inicio)+' a '+dataLegivel(r.consulta.fim))+' | '+(r.parcial?'Parcial':'Confirmado'),{x:margem,y:29,size:8,font:normal,color:cor})}
 return doc.save()
}
