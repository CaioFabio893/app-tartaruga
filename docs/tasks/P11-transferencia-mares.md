# P11 — transferência opcional e consulta de marés

03/10/2026. Dono: Codex; execução sequencial autorizada pelo usuário.

Escopo: `src/features/treino/Formularios.tsx`, `src/App.tsx`, novo `src/features/mares/Mares.tsx`, `tests/treino/treino.test.ts`, documentos PRODUCT/DECISIONS/STATUS/BACKLOG/CHANGELOG e esta tarefa. Sem alterar regras, modelos ou fichas reais.

Objetivo: explicitar cadastro sem transferência (I), exigir destino apenas em P/T e disponibilizar acesso às tábuas anuais oficiais do CHM. Estação local depende de informação da equipe; não inferir previsão para uma praia a partir de um porto.

Estado: concluída e publicada.

Entrega: rótulos claros I/T/P, orientação para não preencher transferência se não ocorreu e registro posterior na ficha. Conservação segue explicitamente informada, sem valor inferido; requisitos condicionais de destino preservados. Área Marés na navegação com link para edição 2026 do CHM, Recife/Suape e novas edições. Decisão D-027; PRODUCT atualizado.

Validação:
- `npm test -- --maxWorkers=2`: 192 passaram/23 ignorados (27 arquivos), sem emulador; não valida Firebase real. Novo teste cadastra sem transferência e depois transfere mantendo origem, ausência de ovos = null.
- `npm run typecheck` e `npm run build`: passaram; `git diff --check` passou (avisos LF/CRLF apenas).
- Navegador integrado, Vite local com VITE_PROJETO_ID vazio: cadastro P11-FICTICIO com CD/REPRODUTIVO/I, nenhum campo de transferência exibido; salvar abriu ficha com I, campos vazios e “Nenhuma transferência registrada”. Cancelada organização anual; área Marés carregou links/instruções. Apenas IndexedDB de treino, sem fichas reais.
- `firebase deploy --only hosting --project monitoramento-de-tartarugas --account SUA_CONTA_AUTORIZADA --non-interactive`: passou com conta proprietária existente. Primeira conta da CLI não tinha acesso e foi substituída pela conta já autorizada, sem alteração de permissão. Regras não publicadas.
- HTTP 200 da raiz, entrada index-D2sMs1Dj.js referenciada e módulo Mares-BMcWYQqu.js público confirmado.

Limites: consulta externa, sem dados de marés incorporados, sem atualização automática de edição. Web confirmou Recife/Suape na lista 2026; HTTP direto encontrou desafio anti-bot e download do PDF não foi validado. Não extrapolar Recife para todo litoral. Interface autenticada de produção e aparelho físico não testados nesta tarefa. Próximo passo: equipe selecionar a estação adequada e conferir a tábua no aparelho.
