// Fachada de acesso: features não conhecem o repositório nem instâncias Firebase.
export { entrar, sair, observarSessao, mensagemAcesso } from '../services/auth'
export type { AcessoProjeto } from '../data/acesso'
export async function confirmarAcessoProjeto(projetoId: string, uid: string) {
  const repositorio = await import('../data/acesso')
  return repositorio.confirmarAcessoProjeto(projetoId, uid)
}
