export interface ConfiguracaoFirebase {
  apiKey: string; authDomain: string; projectId: string; appId: string
}
export type ResultadoConfiguracao = { ok: true; config: ConfiguracaoFirebase; emuladores: boolean } | { ok: false; motivo: string }
/** Não recebe nem imprime credenciais de serviço; configuração Web não é autorização. */
export function validarConfiguracao(env: Record<string, unknown>): ResultadoConfiguracao {
  if (env.VITE_FIREBASE_USAR_EMULADORES === 'true') return { ok: true, emuladores: true,
    config: { apiKey: 'demo-key', authDomain: 'localhost', projectId: 'demo-tartarugas', appId: 'demo-app' } }
  const campos = ['VITE_FIREBASE_API_KEY','VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_APP_ID'] as const
  const ausentes = campos.filter(c => typeof env[c] !== 'string' || !(env[c] as string).trim())
  if (ausentes.length) return { ok: false, motivo: 'Acesso ao projeto real ainda não configurado. A coordenação precisa conectar o projeto.' }
  const config = { apiKey: String(env.VITE_FIREBASE_API_KEY).trim(), authDomain: String(env.VITE_FIREBASE_AUTH_DOMAIN).trim(),
    projectId: String(env.VITE_FIREBASE_PROJECT_ID).trim(), appId: String(env.VITE_FIREBASE_APP_ID).trim() }
  if (!/^[a-z][a-z0-9-]{4,62}$/.test(config.projectId) || /[\s/:]/.test(config.authDomain)) return { ok: false, motivo: 'Configuração Web inválida: confira ID do projeto e domínio de autenticação.' }
  return { ok: true, config, emuladores: false }
}
