import { defineConfig } from 'vite'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

// Apenas assets locais. Dados e tokens Firebase nunca entram neste cache.
function cacheInterface():Plugin {
  return {name:'ninhos-cache-interface',apply:'build',enforce:'post',generateBundle:{order:'post',handler(_opcoes,bundle){
    const arquivos=[...new Set(['/index.html','/manifest.webmanifest','/icons/ninho.svg',
      ...Object.keys(bundle).filter(a=>!a.endsWith('.map')).map(a=>'/'+a)])].sort()
    const hash=createHash('sha256').update(JSON.stringify(arquivos))
    for(const [nome,item] of Object.entries(bundle).filter(([nome])=>!nome.endsWith('.map')).sort(([a],[b])=>a.localeCompare(b))) hash.update(nome).update(item.type==='chunk'?item.code:item.source)
    hash.update(readFileSync('public/manifest.webmanifest')).update(readFileSync('public/icons/ninho.svg'))
    const versao=hash.digest('hex').slice(0,16)
    const source=`const CACHE='ninhos-interface-${versao}';
const ARQUIVOS=${JSON.stringify(arquivos)};
self.addEventListener('install',evento=>evento.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ARQUIVOS))));
self.addEventListener('activate',evento=>evento.waitUntil(caches.keys().then(chaves=>Promise.all(chaves.filter(c=>c.startsWith('ninhos-interface-')&&c!==CACHE).map(c=>caches.delete(c)))).then(()=>self.clients.claim())));
self.addEventListener('message',evento=>{if(evento.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',evento=>{
 const r=evento.request,url=new URL(r.url);
 if(r.method!=='GET'||url.origin!==self.location.origin)return;
 if(r.mode==='navigate'){evento.respondWith(fetch(r).catch(()=>caches.open(CACHE).then(cache=>cache.match('/index.html'))));return;}
 if(!ARQUIVOS.includes(url.pathname)||url.search)return;
 evento.respondWith(caches.open(CACHE).then(cache=>cache.match(url.pathname)).then(resposta=>resposta||fetch(r)));
});`
    this.emitFile({type:'asset',fileName:'sw.js',source})
  }}}
}
export default defineConfig({
  plugins:[cacheInterface()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
} as Parameters<typeof defineConfig>[0])
