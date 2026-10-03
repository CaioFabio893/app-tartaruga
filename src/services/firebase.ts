import { initializeApp } from 'firebase/app'
import { validarConfiguracao } from './configuracao'

let instancia: ReturnType<typeof criarFirebase> | null = null
function criarFirebase() {
  const resultado = validarConfiguracao(import.meta.env)
  if (!resultado.ok) throw new Error(resultado.motivo)
  // Emulador usa sempre projeto demo; nunca conecta um ID real por engano.
  const app = initializeApp(resultado.config, 'monitoramento-ninhos')
  return { app, emuladores: resultado.emuladores }
}
export function obterFirebase() { instancia ??= criarFirebase(); return instancia }
