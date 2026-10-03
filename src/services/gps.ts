/** API W3C fornece WGS84 (https://www.w3.org/TR/geolocation/); não converter para SIRGAS2000. */
export interface CapturaGPS {
  latitude:number;longitude:number;datum:'WGS84';fonteGps:'dispositivo';precisaoGpsM:number;capturadoEm:string
}
export function capturarGPS(fonte:Pick<Geolocation,'getCurrentPosition'>|null = typeof navigator==='undefined'?null:navigator.geolocation??null,
  opcoes:{signal?:AbortSignal;timeoutMs?:number}={}):Promise<CapturaGPS> {
  if(!fonte)return Promise.reject(new Error('GPS indisponível. Digite as coordenadas manualmente ou deixe os campos vazios.'))
  return new Promise((resolve,reject)=>{
    let finalizado=false
    const tempo=opcoes.timeoutMs??15000
    const parar=(erro:Error)=>{if(finalizado)return;finalizado=true;clearTimeout(timer);opcoes.signal?.removeEventListener('abort',abortar);reject(erro)}
    const abortar=()=>parar(new Error('Captura cancelada. Nenhuma coordenada foi alterada.'))
    const timer=setTimeout(()=>parar(new Error('GPS demorou a responder. Tente novamente ou use a entrada manual.')),tempo)
    if(opcoes.signal?.aborted){abortar();return}
    opcoes.signal?.addEventListener('abort',abortar,{once:true})
    try {fonte.getCurrentPosition(pos=>{
      if(finalizado)return
      const {latitude,longitude,accuracy}=pos.coords
      if(![latitude,longitude,accuracy,pos.timestamp].every(Number.isFinite)||Math.abs(latitude)>90||Math.abs(longitude)>180||accuracy<0||!Number.isFinite(new Date(pos.timestamp).getTime())) {
        parar(new Error('GPS retornou coordenadas inválidas. Nenhum dado foi preenchido.'));return
      }
      finalizado=true;clearTimeout(timer);opcoes.signal?.removeEventListener('abort',abortar)
      resolve({latitude,longitude,datum:'WGS84',fonteGps:'dispositivo',precisaoGpsM:accuracy,capturadoEm:new Date(pos.timestamp).toISOString()})
    },erro=>parar(new Error(erro.code===1?'Permissão de localização negada. Você pode usar a entrada manual.':erro.code===3?'GPS sem resposta no prazo. Você pode tentar novamente.':'Localização indisponível no momento. Use a entrada manual.')),
    {enableHighAccuracy:true,maximumAge:0,timeout:Math.min(tempo,10000)})}
    catch {parar(new Error('Não foi possível iniciar o GPS. A entrada manual continua disponível.'))}
  })
}
