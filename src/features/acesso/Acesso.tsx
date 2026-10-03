import { useEffect, useState } from 'react'
import { validarConfiguracao } from '../../services/configuracao'
import type { AcessoProjeto } from '../../app/acesso'

export default function Acesso() {
  const config = validarConfiguracao(import.meta.env)
  const [uid, setUid] = useState<string | null>(null), [email, setEmail] = useState(''), [senha, setSenha] = useState('')
  const [projetoId, setProjetoId] = useState(''), [acesso, setAcesso] = useState<AcessoProjeto | null>(null)
  const [erro, setErro] = useState(''), [ocupado, setOcupado] = useState(false)
  useEffect(() => {
    if (!config.ok) return
    let ativo = true; let parar: (() => void) | undefined
    void import('../../app/acesso').then(a => {
      if (ativo) parar = a.observarSessao(u => { setUid(u?.uid ?? null); setAcesso(null) })
    }).catch(() => { if (ativo) setErro('Não foi possível iniciar o acesso. Confira a configuração.') })
    return () => { ativo = false; parar?.() }
  }, [config.ok])
  async function executar(acao: 'entrar' | 'projeto' | 'sair') {
    setErro(''); setOcupado(true)
    try {
      const auth = await import('../../app/acesso')
      if (acao === 'entrar') { await auth.entrar(email, senha); setSenha('') }
      if (acao === 'sair') { await auth.sair(); setAcesso(null); setSenha('') }
      if (acao === 'projeto' && uid) setAcesso(await auth.confirmarAcessoProjeto(projetoId, uid))
    } catch (e) {
      setAcesso(null)
      try { const auth = await import('../../app/acesso'); setErro(auth.mensagemAcesso(e)) }
      catch { setErro('Não foi possível carregar o acesso. Confira a conexão e recarregue a página.') }
    }
    finally { setOcupado(false) }
  }
  return <section className="cartao" aria-busy={ocupado}><h2>Acesso ao projeto</h2>
    {!config.ok ? <p>{config.motivo}</p> : <>
      {config.emuladores && <p className="mensagem aviso">Emuladores locais · projeto demo · sem dados reais</p>}
      {erro && <p className="mensagem erro" role="alert">{erro}</p>}
      {!uid ? <form onSubmit={e => {e.preventDefault(); void executar('entrar')}}><div className="filtros">
        <label>E-mail<input autoComplete="username" type="email" value={email} required onChange={e => setEmail(e.target.value)} /></label>
        <label>Senha<input autoComplete="current-password" type="password" value={senha} required onChange={e => setSenha(e.target.value)} /></label>
        </div><div className="acoes"><button className="btn prim" disabled={ocupado}>Entrar</button></div><p className="ajuda">Use o acesso fornecido pela coordenação. O aplicativo não cria contas administrativas.</p></form> : <>
        <p>Login confirmado. O acesso a cada projeto é verificado no servidor.</p>
        <form onSubmit={e => { e.preventDefault(); void executar('projeto') }}><div className="filtros"><label>ID do projeto<input value={projetoId} required onChange={e => {setProjetoId(e.target.value); setAcesso(null)}} /></label></div><div className="acoes"><button className="btn prim" disabled={ocupado}>Confirmar acesso</button><button type="button" className="btn" disabled={ocupado} onClick={() => void executar('sair')}>Sair da conta</button></div></form>
        {acesso && <div className="mensagem"><strong>{acesso.nome}</strong><p>Papel confirmado: {acesso.papel}. Leitura validada online.</p><p>Dados reais ainda não são carregados nas telas de demonstração. Escritas de campo aguardam a integração transacional.</p></div>}
      </>}
    </>}
  </section>
}
