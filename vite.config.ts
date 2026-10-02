import { defineConfig } from 'vite'

// PWA de arquivos estaticos. Sem plugin de service worker: o cache e controlado por codigo
// (public/sw.js) para manter o comportamento previsivel e testavel (docs/OFFLINE.md).
export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
} as Parameters<typeof defineConfig>[0])
