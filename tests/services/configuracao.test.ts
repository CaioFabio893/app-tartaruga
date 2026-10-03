import { expect, it } from 'vitest'
import { validarConfiguracao } from '../../src/services/configuracao'
it('não inicializa configuração ausente ou parcial', () => {
  expect(validarConfiguracao({}).ok).toBe(false)
  expect(validarConfiguracao({VITE_FIREBASE_API_KEY: 'qualquer'}).ok).toBe(false)
})
it('emulador nunca reaproveita ID real', () => {
  const r = validarConfiguracao({VITE_FIREBASE_USAR_EMULADORES: 'true', VITE_FIREBASE_PROJECT_ID: 'real-project'})
  expect(r.ok && r.config.projectId).toBe('demo-tartarugas')
  expect(r.ok && r.emuladores).toBe(true)
})
it('flag diferente de true não ativa emulador silenciosamente', () => {
  expect(validarConfiguracao({VITE_FIREBASE_USAR_EMULADORES: '1'}).ok).toBe(false)
})
