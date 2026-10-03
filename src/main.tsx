import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
const App=lazy(()=>import('./App.tsx'))
import EntradaTeste from './features/acesso/EntradaTeste.tsx'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <Suspense fallback={<p role="status">Abrindo aplicativo…</p>}>{import.meta.env.VITE_PROJETO_ID ? <EntradaTeste /> : <App />}</Suspense>
  </StrictMode>,
)
