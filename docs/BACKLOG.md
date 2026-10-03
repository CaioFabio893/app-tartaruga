# Backlog

Tarefas com dono, escopo e critérios de aceite. Uma tarefa ativa por vez, caminhos exclusivos por dono
(AGENTS.md).

| ID | Título | Dono | Status | Prioridade | Dependências | Caminhos afetados | Critérios de aceite |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E01 | Base, contratos e domínio | OpenCode (build) | **concluída** | alta | — | `AGENTS.md`, `docs/*`, `src/domain/*`, `tests/*`, `tsconfig.json`, `vite.config.ts`, `.gitignore`, `.env.example`, `package.json`, `package-lock.json`, `index.html`, `public/manifest.webmanifest`, `src/App.tsx`, `src/main.tsx`, `src/styles/base.css` | Build e typecheck OK; testes 40/40; documentos coerentes entre si; sem violação dos limites (sem fotos/Blaze/Storage/IA no app) |
| R01 | Revisão inicial e correções pontuais | Codex | **concluída** | alta | E01 | `src/domain/*`, `tests/*`, `docs/*`, `AGENTS.md`, `README.md`, `.env.example` | Achados e evidências em REVISAO-BASE.md; regressões e build passando |
| R02 | Fechar contratos após revisão | OpenCode | **concluída** | alta | R01 | `src/domain/tipos.ts`, `docs/{DATA_MODEL,DOMAIN_RULES,FIELD_DICTIONARY,REPORT_SPEC,OFFLINE,SECURITY,ARCHITECTURE,TESTING,DECISIONS}.md`, `package.json`, `package-lock.json`, registros da tarefa | Resolver F07-F12 de REVISAO-BASE.md: consultas reais por critério, política transacional/idempotente, reservas de numeração, fontes únicas de campos, fuso e estado real da PWA; tipos/build/testes passando; sem implementar Firebase/relatório inteiro |
| E02 | Relatório com dados fictícios | Codex | concluída (treino) | alta | R02 | [E02](tasks/E02-relatorio.md) | PDF/JSON/CSV do mesmo snapshot; período inclusivo; A4; null/zero; testes reais |
| E03 | Interface | Codex | concluída (base local) | alta | E02 | [E03](tasks/E03-interface.md) | Visual Claude preservado; navegação/responsividade/downloads validados |
| E04 | Login, projetos e Firestore | Codex | parcial: acesso/regras | alta | E03 | [E04](tasks/E04-acesso.md) | Login e membro online testados no emulador; CRUD oficial ainda pendente |
| E05 | Ocorrência e ninho | Codex | treino entregue; oficial pendente | alta | E04 | [E05–E07 local](tasks/E05-E07-treino-local.md) | Somente CD cria ninho; falta persistência oficial/transações |
| E06 | Transferências e visitas | Codex | treino entregue; oficial pendente | média | E05 | [E05–E07 local](tasks/E05-E07-treino-local.md) | História própria e origem imutável; falta backend oficial |
| E07 | Abertura/eclosão/cálculos | Codex | treino entregue; oficial pendente | alta | E05/E06 | [E05–E07 local](tasks/E05-E07-treino-local.md) | v2 e correção auditada local; falta backend oficial |
| E08 | GPS/esquema/lista | Codex | concluída local; campo pendente | média | E05 local | [E08](tasks/E08-gps-mapa-local.md) | GPS simulado e lista/teclado passaram; validar aparelho físico |
| E09 | Offline/sincronização | Codex | cache/CAS local entregues; remoto pendente | alta | E04–E07 | [E09-cache](tasks/E09-cache-interface.md), OFFLINE.md | Falta fila remota e conflito entre aparelhos; não afirmar sincronizado |
| E10 | Relatório oficial | Codex | pendente | alta | E07/E09 oficiais | src/report/* e tarefa a definir | Fonte real completa e sincronização confirmada antes de definitivo |
| E11 | Revisão/entrega oficial | Codex | pendente | alta | E01–E10 | docs/* e tarefa a definir | Validar fluxo oficial, índices reais e ciência antes de publicar |
| R03 | Integridade final local | Codex | concluída | alta | E09-cache | [R03](tasks/R03-integridade-final.md) | Evidências finais, docs coerentes e commit local |
| P01 | Hosting do treino | Codex | publicado; download IAB não confirmado | alta | R03 | [P01](tasks/P01-hosting-treino.md) | Hosting Spark HTTPS; sem alterar backend/outro app |

E01/R01/R02 descrevem entregas históricas. Escopos locais não equivalem à conclusão oficial de E04–E10. Execução sequencial; criar tarefa antes de novos caminhos. Próximo trabalho: integração oficial, conforme STATUS.md.
