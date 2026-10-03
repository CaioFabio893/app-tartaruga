import { lazy, Suspense, useEffect, useState } from 'react'
import { entrar, mensagemAcesso, observarSessao, sair } from '../../services/auth'
import { identidadeLogin } from '../../services/loginTeste'
import { confirmarAcessoProjeto } from '../../app/acesso'
import { carregarProjeto, abrirCopiaLocal } from '../../app/nuvem'
import type { EstadoTreino } from '../../app/treino'
import '../../styles/base.css'
import '../../styles/interface.css'

const App=lazy(()=>import('../../App'))
export default function EntradaTeste() {
  const [estado,setEstado]=useState<EstadoTreino|null>(null),[usuario,setUsuario]=useState(''),[senha,setSenha]=useState(''),[erro,setErro]=useState(''),[ocupado,setOcupado]=useState(true)
  useEffect(()=>{let ativo=true;let geracao=0;const parar=observarSessao(u=>{const atual=++geracao;setEstado(null);if(!u){setOcupado(false);return}setOcupado(true);void (navigator.onLine?confirmarAcessoProjeto(import.meta.env.VITE_PROJETO_ID,u.uid).then(a=>carregarProjeto({projetoId:a.id,nome:a.nome,papel:a.papel,usuario:u.uid,revisaoServidor:0})):abrirCopiaLocal(import.meta.env.VITE_PROJETO_ID,u.uid)).then(e=>{if(ativo&&atual===geracao)setEstado(e)}).catch(e=>{if(ativo&&atual===geracao)setErro(mensagemAcesso(e))}).finally(()=>{if(ativo&&atual===geracao)setOcupado(false)})});return()=>{ativo=false;geracao++;parar()}},[])
  async function login(){setErro('');setOcupado(true);try{await entrar(identidadeLogin(usuario,import.meta.env.VITE_LOGIN_DOMINIO),senha);setSenha('')}catch(e){setErro(mensagemAcesso(e));setOcupado(false)}}
  if(estado)return <Suspense fallback={<p role="status">Abrindo projeto…</p>}><App inicial={estado} aoSair={()=>void sair().catch(e=>setErro(mensagemAcesso(e)))}/></Suspense>
  return <main className="conteudo entrada-projeto" style={{maxWidth:520,margin:'8vh auto'}}><section className="cartao"><h1>Monitoramento de Tartarugas</h1><p>Entre com o acesso fornecido pela coordenação.</p>{erro&&<p className="mensagem erro" role="alert">{erro}</p>}<form onSubmit={e=>{e.preventDefault();void login()}}><div className="filtros"><label>Usuário<input required autoComplete="username" value={usuario} onChange={e=>setUsuario(e.target.value)}/></label><label>Senha<input required type="password" autoComplete="current-password" value={senha} onChange={e=>setSenha(e.target.value)}/></label></div><div className="acoes"><button className="btn prim" disabled={ocupado}>Entrar</button><button className="btn" type="button" onClick={()=>void sair()}>Limpar sessão</button></div>{ocupado&&<p role="status">Confirmando acesso e dados no servidor…</p>}</form><p className="ajuda">Somente membros autorizados acessam os dados do projeto. Não há cadastro administrativo nesta tela.</p></section></main>
}
