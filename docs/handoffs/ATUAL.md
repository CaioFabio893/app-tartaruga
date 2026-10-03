# Continuação — Codex

02/10/2026. Usuário autorizou implementação após esgotar OpenCode e informou GitHub para commit; depois autorizou publicação do treino (P01). Hosting em https://monitoramento-de-tartarugas.web.app, projeto Spark separado. Sem push ou publicação do backend oficial.

Ler AGENTS.md, STATUS.md, BACKLOG.md e tarefa escolhida. E02/E03 entregues para treino; E04 tem acesso/regras testados; E05–E09 têm avanços locais, não integração oficial. Fórmulas v2 preservadas (D-002); não voltar a v1 do pedido antigo.

Entradas: src/App.tsx, src/report/*, src/app/treino.ts, src/data/treino.ts, src/features/treino/*, src/services/{gps,pwa,auth}.ts, firestore.rules, vite.config.ts. Tarefas detalham escopos e limitações. Evidências em TESTING.md.

Próxima implementação: definir tarefa específica para persistência oficial/transações/projeções/fila remota; manter escrita de campo negada até validar schema, isolamento, idempotência e concorrência. Treino não vira dado oficial silenciosamente. Não apagar estado local corrompido nem rascunho em conflito.

Pendências em DECISIONS.md/DOMAIN_RULES.md §8. Layout PDF precisa aprovação da equipe; GPS físico e instalação em celulares não testados. Nenhum deploy ou Firebase real validado.
