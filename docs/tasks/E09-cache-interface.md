# E09 — Cache da interface (preparação, sem fila remota)

Dono: Codex. Continuar sequencialmente após E08.

Escopo: `vite.config.ts`, `src/services/pwa.ts`, `src/App.tsx`, `public/icons/*`, `public/manifest.webmanifest`, `index.html`, `.gitignore` (somente intermediários locais), `tests/services/pwa.test.ts` se necessário e docs afetados.

Objetivo: service worker apenas no build, precache de assets locais (inclui PDF sob demanda), navegação offline, cache versionado, atualização sem forçar descarte de formulários. Ícone SVG local, sem imagens geradas/fotos. Não cachear requisições Firebase, tokens, dados externos ou conteúdo fora da origem/escopo.

Aceite: build local servido no navegador, instalação com cache confirmado, recarga offline e geração PDF no treino funcionando; atualização sem skipWaiting automático. Isso não é sincronização E09: dados locais já têm proteção entre abas; fila remota e conflitos entre aparelhos seguem pendentes. Estado: cache local concluído; fila remota pendente. Evidências em ../TESTING.md.
Cache de produção validado no Edge: 12 assets locais precacheados, recarga offline, cadastro local, recarga com dados mantidos e download PDF offline passaram. Atualização de worker ficou waiting sem skipWaiting e preservou rascunho; artefato dist/sw.js de teste foi restaurado. Sem erros de página. Instalação em aparelhos reais ainda não testada; fila remota não implementada.
