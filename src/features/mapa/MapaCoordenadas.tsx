import {useEffect,useRef,useState} from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { RegistroRelatorio } from '../../report/relatorio'
import {rotuloNinho,type GestaoNinho} from '../../domain/gestao'

export default function MapaCoordenadas({registros,abrir,organizacao={}}:{registros:RegistroRelatorio[];abrir:(id:string)=>void;organizacao?:Record<string,GestaoNinho>}) {
  const elemento=useRef<HTMLDivElement>(null),[falha,setFalha]=useState(false)
  const [online,setOnline]=useState(navigator.onLine)
  useEffect(()=>{const atualizar=()=>setOnline(navigator.onLine);window.addEventListener('online',atualizar);window.addEventListener('offline',atualizar);return()=>{window.removeEventListener('online',atualizar);window.removeEventListener('offline',atualizar)}},[])
  const pontos=registros.flatMap(r=>{const l=r.ficha.posicaoAtual.local;return l.latitude!==null&&l.longitude!==null&&Number.isFinite(l.latitude)&&Number.isFinite(l.longitude)?[{id:r.ficha.ninho.id,codigo:rotuloNinho(r,organizacao[r.ficha.ninho.id]),lat:l.latitude,lon:l.longitude,precisao:l.precisaoGpsM,datum:l.datum}]:[]})
  useEffect(()=>{
    if(!elemento.current||!online||!pontos.length)return
    setFalha(false)
    const mapa=L.map(elemento.current)
    const base=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(mapa)
    base.on('tileerror',()=>setFalha(true))
    for(const p of pontos){const rotulo=document.createElement('span');rotulo.textContent=p.codigo;L.circleMarker([p.lat,p.lon],{radius:10,color:'#ffffff',fillColor:'#0b3c49',fillOpacity:1}).addTo(mapa).bindTooltip(rotulo.outerHTML,{permanent:true,direction:'top'}).on('click',()=>abrir(p.id));if(p.precisao!==null)L.circle([p.lat,p.lon],{radius:p.precisao,color:'#0b3c49',weight:1,fillOpacity:.12}).addTo(mapa)}
    if(pontos.length===1)mapa.setView([pontos[0]!.lat,pontos[0]!.lon],17)
    else mapa.fitBounds(pontos.map(p=>[p.lat,p.lon] as [number,number]),{padding:[35,35],maxZoom:17})
    L.control.scale({imperial:false}).addTo(mapa)
    return()=>mapa.remove()
  },[registros,abrir,online,organizacao])
  return <section className="cartao"><h2>Mapa dos ninhos</h2><p className="ajuda">Posição atual, derivada das transferências. Toque no ponto para abrir a ficha. O círculo indica a margem de erro registrada, quando disponível. Datums originais preservados, sem conversão; confirme a localização em campo.</p>{!pontos.length?<p>Sem coordenadas disponíveis. Consulte os ninhos na lista.</p>:online?<div ref={elemento} className="mapa-geografico" aria-label="Mapa geográfico dos ninhos"/>:<p role="status">Sem internet: mapa-base indisponível. As coordenadas continuam disponíveis na lista.</p>}{falha&&<p role="status">Não foi possível carregar partes do mapa-base. Use a lista de coordenadas e tente novamente com conexão.</p>}<p className="ajuda">{pontos.length} posições disponíveis · {registros.length-pontos.length} ninhos sem par de coordenadas. Base geográfica OpenStreetMap online, sem download offline.</p></section>
}
