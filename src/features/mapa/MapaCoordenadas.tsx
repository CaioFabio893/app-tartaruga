import type { RegistroRelatorio } from '../../report/relatorio'

export default function MapaCoordenadas({registros,abrir}:{registros:RegistroRelatorio[];abrir:(id:string)=>void}) {
  const pontos=registros.flatMap((r,i)=>{
    const l=r.ficha.posicaoAtual.local
    return l.latitude!==null&&l.longitude!==null&&Number.isFinite(l.latitude)&&Number.isFinite(l.longitude)?[{id:r.ficha.ninho.id,codigo:r.ficha.ninho.codigoInterno,lat:l.latitude,lon:l.longitude,numero:i+1}]:[]
  })
  if(!pontos.length)return <section className="cartao"><h2>Posições dos ninhos</h2><p>Sem coordenadas disponíveis. Consulte os ninhos na lista abaixo.</p></section>
  const minLon=Math.min(...pontos.map(p=>p.lon)),maxLon=Math.max(...pontos.map(p=>p.lon))
  const minLat=Math.min(...pontos.map(p=>p.lat)),maxLat=Math.max(...pontos.map(p=>p.lat))
  const escala=Math.max((maxLon-minLon)/520,(maxLat-minLat)/230,.0000001)
  const centroLon=(minLon+maxLon)/2,centroLat=(minLat+maxLat)/2
  return <section className="cartao"><h2>Esquema das posições atuais</h2><p className="ajuda">Coordenadas em graus, sem mapa-base ou conversão entre datums. Os pontos podem se sobrepor. Use a lista para identificar cada ninho. Este esquema não serve para navegação.</p>
    <svg className="mapa-svg" viewBox="0 0 600 320" aria-label="Esquema interativo de coordenadas, com lista equivalente abaixo">
      <rect width="600" height="320" rx="12" fill="var(--mar-100)"/><path d="M30 160h540M300 30v260" stroke="var(--mar-700)" strokeDasharray="4 5" opacity=".25"/>
      <text x="300" y="20" textAnchor="middle" fill="var(--mar-900)">N ↑</text>
      {pontos.map(p=><g key={p.id} role="button" tabIndex={0} aria-label={`Abrir ${p.codigo}, latitude ${p.lat}, longitude ${p.lon}`} onClick={()=>abrir(p.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();abrir(p.id)}}} transform={`translate(${300+(p.lon-centroLon)/escala},${165-(p.lat-centroLat)/escala})`}><circle r="17" fill="var(--mar-900)" stroke="white" strokeWidth="2"/><text textAnchor="middle" y="5" fill="white" fontSize="14">{p.numero}</text></g>)}
    </svg><p className="ajuda">{pontos.length} posições disponíveis · {registros.length-pontos.length} ninhos sem par de coordenadas</p>
  </section>
}
