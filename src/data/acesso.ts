import { doc, getDocFromServer, getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { obterFirebase } from '../services/firebase'

export interface AcessoProjeto { id: string; nome: string; papel: 'consulta' | 'campo' | 'coordenacao' }
let banco: ReturnType<typeof getFirestore> | null = null
function obterBanco() {
  if (!banco) {
    const { app, emuladores } = obterFirebase(); banco = getFirestore(app)
    if (emuladores) connectFirestoreEmulator(banco, '127.0.0.1', 8080)
  }
  return banco
}
/** ID informado não é segredo. A regra do servidor decide o acesso; sem leitura de cache. */
export async function confirmarAcessoProjeto(projetoId: string, uid: string): Promise<AcessoProjeto> {
  if (!projetoId.trim() || projetoId.includes('/') || !uid || uid.includes('/')) throw new Error('Informe um ID de projeto válido.')
  const db = obterBanco()
  const membro = await getDocFromServer(doc(db, 'projetos', projetoId.trim(), 'membros', uid))
  const m = membro.data()
  if (!m || m.ativo !== true || m.uid !== uid || m.projeto_id !== projetoId.trim() || !['consulta','campo','coordenacao'].includes(String(m.papel))) throw new Error('Vínculo ativo não confirmado. Consulte a coordenação.')
  const projeto = await getDocFromServer(doc(db, 'projetos', projetoId.trim()))
  const p = projeto.data()
  if (!p || p.ativo !== true || typeof p.nome !== 'string') throw new Error('Projeto ativo não confirmado.')
  return { id: projetoId.trim(), nome: p.nome, papel: m.papel as AcessoProjeto['papel'] }
}
