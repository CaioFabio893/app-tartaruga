import { useEffect, useRef, useState } from 'react'
import tabua from './recife-2026.json'
import { dataRecife, eventosDoDia, mudarDia, proximoEvento, type DiasMare } from '../../domain/mares'
import '../../styles/mares.css'

const dias:DiasMare=tabua.dias
const meses=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const formatarData=(data:string)=>new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(data+'T12:00:00Z'))
const altura=(n:number)=>n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+' m'
export default function Mares({online}:{online:boolean}) {
  const [agora,setAgora]=useState(()=>new Date()),[data,setData]=useState(()=>dataRecife())
  const [mes,setMes]=useState(()=>dataRecife().slice(5,7)),[erro,setErro]=useState('')
  const secao=useRef<HTMLElement>(null),calendario=useRef<HTMLDetailsElement>(null)
  useEffect(()=>{const atualizar=()=>setAgora(new Date());const timer=setInterval(atualizar,30000);window.addEventListener('focus',atualizar);return()=>{clearInterval(timer);window.removeEventListener('focus',atualizar)}},[])
  const hoje=dataRecife(agora),eventos=eventosDoDia(dias,data),proximo=data===hoje?proximoEvento(dias,agora):null
  function escolher(nova:string){if(!nova)return;setData(nova);setMes(nova.slice(5,7));setErro('')}
  const diasMes=Object.keys(dias).filter(d=>d.slice(5,7)===mes)
  return <section className="cartao mares" ref={secao}>
    <p className="sobretitulo">PORTO DO RECIFE · PERNAMBUCO</p>
    <h2>Marés de {data===hoje?'hoje':formatarData(data)}</h2>
    {data===hoje&&<p className="mares-data">{formatarData(data)}</p>}
    <p className="ajuda">Horários de Recife (UTC−03:00) · alturas em metros.</p>
    <div className="mares-navegacao" aria-label="Escolher dia">
      <button className="btn" disabled={data<='2026-01-01'||data>'2026-12-31'} onClick={()=>escolher(mudarDia(data,-1))}>← Dia anterior</button>
      <button className="btn prim" onClick={()=>escolher(hoje)}>Hoje</button>
      <button className="btn" disabled={data<'2026-01-01'||data>='2026-12-31'} onClick={()=>escolher(mudarDia(data,1))}>Próximo dia →</button>
    </div>
    <label className="mares-escolha">Escolher outra data<input type="date" min="2026-01-01" max="2026-12-31" value={data} onChange={e=>{const v=e.target.value;if(v&&!dias[v]){setErro('Escolha uma data de 2026.');return}escolher(v)}}/></label>
    {erro&&<p role="alert">{erro}</p>}
    {eventos.length>0?<>
      {proximo&&<div className="mares-proxima"><span>Próxima maré {proximo.tipo}{proximo.data!==hoje?' · amanhã':''}</span><strong>{proximo.hora}</strong><span>{altura(proximo.altura)}</span></div>}
      <ul className="mares-eventos" aria-label="Marés do dia">{eventos.map(e=><li key={e.hora} className={e.tipo==='alta'?'mare-alta':'mare-baixa'}><span className="mares-tipo">{e.tipo==='alta'?'↑ Maré alta':'↓ Maré baixa'}</span><strong>{e.hora}</strong><span>{altura(e.altura)}</span></li>)}</ul>
    </>:<p className="mensagem aviso">A tábua disponível cobre 2026. Ainda não temos dados para {data.slice(0,4)}. Escolha uma data de 2026 abaixo.</p>}
    <details className="mares-ano" ref={calendario}><summary>Consultar o ano inteiro · 2026</summary>
      <label className="mares-escolha">Mês<select value={mes} onChange={e=>setMes(e.target.value)}>{meses.map((m,i)=><option key={m} value={String(i+1).padStart(2,'0')}>{m}</option>)}</select></label>
      <div className="mares-calendario" aria-label={`Dias de ${meses[Number(mes)-1]}`}>{diasMes.map(d=><button key={d} className="btn" aria-label={`Consultar ${formatarData(d)}`} aria-pressed={data===d} onClick={()=>{escolher(d);if(calendario.current)calendario.current.open=false;secao.current?.scrollIntoView({block:'start'})}}>{Number(d.slice(8))}</button>)}</div>
    </details>
    {!online&&<p className="ajuda">Sem internet. Esta tábua está incluída no aplicativo; não depende de consulta externa.</p>}
    <details className="mares-fonte"><summary>Fonte e informações da previsão</summary><p>Previsões do Centro de Hidrografia da Marinha, edição DG6-63, páginas 82–84, ano 2026. Dados para a estação Porto do Recife; outras praias podem ter diferenças. Não é medição do nível do mar em tempo real. A próxima maré usa o relógio do aparelho.</p><p>A edição de outro ano precisa ser incorporada ao aplicativo.</p><a href={tabua.url} target="_blank" rel="noopener noreferrer">Conferir tábua original da Marinha</a></details>
  </section>
}
