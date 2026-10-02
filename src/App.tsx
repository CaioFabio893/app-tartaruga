import './styles/base.css'

function App() {
  return (
    <main style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Monitoramento de Ninhos</h1>
      <p>Base do app criada seguindo AGENTS.md, DOMAIN_RULES.md e DATA_MODEL.md.</p>
      <ul>
        <li>Vite + TypeScript strict</li>
        <li>Domínio puro com cálculos versionados</li>
        <li>Regras de data (noite de monitoramento) com 40 testes</li>
      </ul>
    </main>
  )
}

export default App
