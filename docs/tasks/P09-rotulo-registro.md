# P09 — identificar o ninho pelo número de registro

Dono Codex, sequencial. Pedido: mostrar número de registro no lugar de NINHO-851eb5bf para facilitar identificação.

Escopo: `src/domain/gestao.ts`, `tests/gestao/rotulo.test.ts`; esta tarefa e STATUS/BACKLOG/CHANGELOG/DECISIONS. Publicação Hosting e envio Git autorizados na continuidade da entrega. Não editar dados, regras ou formato do Excel.

Apresentação compartilhada por lista/ficha/mapa/alertas/PDF prioriza N_REGISTRO textual, preservando zeros. Sem registro, mantém número anual se definido, senão código técnico. Não muda nenhum dos identificadores persistidos. Decisão D-026.

Concluída: `npx vitest run --maxWorkers=2` com emulador local: 213 passaram/1 opt-in ignorado. `npx tsc --noEmit` e `npx vite build` passaram. Teste cobre registro 002 prevalecendo sobre anual 001, zeros, alternativas sem registro e dados inalterados. Hosting publicado; página/bundle HTTP 200 e index-CPlHyiMC.js confirmados. Nenhum documento/regras do Firestore alterado. Próximo passo: usuário conferir Ninho 002 na lista/mapa/ficha; se houver aviso de atualização, fechar e reabrir o app.
