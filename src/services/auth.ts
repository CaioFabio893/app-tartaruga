import { onAuthStateChanged, signInWithEmailAndPassword, signOut, getAuth, connectAuthEmulator, setPersistence, browserSessionPersistence, type User } from 'firebase/auth'
import { obterFirebase } from './firebase'

let sessao: ReturnType<typeof iniciarSessao> | null = null
function iniciarSessao() {
  const { app, emuladores } = obterFirebase(); const auth = getAuth(app)
  if (emuladores) connectAuthEmulator(auth, 'http://127.0.0.1:9099', {disableWarnings: true})
  return { auth, persistencia: setPersistence(auth, browserSessionPersistence) }
}
function obterSessao() { sessao ??= iniciarSessao(); return sessao }
export async function entrar(email: string, senha: string): Promise<User> {
  if (!email.trim() || !senha) throw new Error('Informe e-mail e senha.')
  const firebase = obterSessao(); await firebase.persistencia
  return (await signInWithEmailAndPassword(firebase.auth, email.trim(), senha)).user
}
export function observarSessao(aoMudar: (user: User | null) => void) { return onAuthStateChanged(obterSessao().auth, aoMudar) }
export function sair() { return signOut(obterSessao().auth) }
export function mensagemAcesso(erro: unknown): string {
  const codigo = typeof erro === 'object' && erro !== null && 'code' in erro ? String(erro.code) : ''
  if (['auth/invalid-credential','auth/user-not-found','auth/wrong-password','auth/invalid-email'].includes(codigo)) return 'Não foi possível entrar. Confira seu e-mail e senha.'
  if (codigo === 'permission-denied') return 'Acesso negado: confira o ID do projeto e seu vínculo com a coordenação.'
  if (codigo === 'auth/too-many-requests') return 'Muitas tentativas. Aguarde antes de tentar novamente.'
  if (codigo === 'auth/network-request-failed' || codigo === 'unavailable') return 'Sem conexão com o servidor. Nenhum acesso foi confirmado.'
  return erro instanceof Error && !codigo ? erro.message : 'Não foi possível confirmar o acesso ao projeto.'
}
