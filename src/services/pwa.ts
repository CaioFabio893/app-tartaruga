/** Registro somente de produção. Atualização aguarda ação do usuário (não descarta formulário). */
export interface ControleCache { parar: () => void; atualizar: () => void }
export async function registrarCacheInterface(aoMudar:(mensagem:string,atualizacao:boolean)=>void):Promise<ControleCache> {
  const vazio={parar:()=>{},atualizar:()=>{}}
  if(!import.meta.env.PROD || !('serviceWorker' in navigator)) return vazio
  const registro=await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'})
  let ativo=true
  const comunicar=()=>{
    if(!ativo)return
    if(registro.waiting) aoMudar('Atualização disponível. Salve os formulários antes de atualizar.',true)
    else if(registro.active) aoMudar('Cache da interface instalado. Confira acima o estado de sincronização dos dados.',false)
  }
  let instalando:ServiceWorker|null=null
  const mudou=()=>comunicar()
  const nova=()=>{instalando?.removeEventListener('statechange',mudou);instalando=registro.installing;instalando?.addEventListener('statechange',mudou)}
  registro.addEventListener('updatefound',nova);nova();comunicar()
  void navigator.serviceWorker.ready.then(()=>comunicar())
  const atualizar=()=>{
    const esperando=registro.waiting
    if(!esperando)return
    navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload())
    esperando.postMessage('SKIP_WAITING')
  }
  return {parar:()=>{ativo=false;registro.removeEventListener('updatefound',nova);instalando?.removeEventListener('statechange',mudou)},atualizar}
}
