/** Registro somente de produção. Atualização espera fechamento das abas; não descarta formulário. */
export async function registrarCacheInterface(aoMudar:(mensagem:string)=>void):Promise<()=>void> {
  if(!import.meta.env.PROD || !('serviceWorker' in navigator)) return ()=>{}
  const registro=await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'})
  let ativo=true
  const comunicar=()=>{
    if(!ativo)return
    if(registro.waiting) aoMudar('Atualização disponível. Salve os formulários, feche as abas do aplicativo e reabra.')
    else if(registro.active) aoMudar('Cache da interface instalado. Dados locais continuam não sincronizados.')
  }
  let instalando:ServiceWorker|null=null
  const mudou=()=>comunicar()
  const nova=()=>{instalando?.removeEventListener('statechange',mudou);instalando=registro.installing;instalando?.addEventListener('statechange',mudou)}
  registro.addEventListener('updatefound',nova);nova();comunicar()
  void navigator.serviceWorker.ready.then(()=>comunicar())
  return ()=>{ativo=false;registro.removeEventListener('updatefound',nova);instalando?.removeEventListener('statechange',mudou)}
}
