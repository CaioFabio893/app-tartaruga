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
| E04 | Login, projetos e Firestore | Codex | integrada em P03 | alta | E03 | [E04](tasks/E04-acesso.md) | Login e membro online testados no emulador; CRUD oficial entregue em P03 |
| E05 | Ocorrência e ninho | Codex | integrada em P03 | alta | E04 | [E05–E07 local](tasks/E05-E07-treino-local.md) | Somente CD cria ninho; persistência/transações validadas em P03 |
| E06 | Transferências e visitas | Codex | integrada em P03 | média | E05 | [E05–E07 local](tasks/E05-E07-treino-local.md) | História própria e origem imutável; backend entregue em P03 |
| E07 | Abertura/eclosão/cálculos | Codex | integrada em P03 | alta | E05/E06 | [E05–E07 local](tasks/E05-E07-treino-local.md) | v2 e correção auditada local; falta backend oficial |
| E08 | GPS/esquema/lista | Codex | concluída local; campo pendente | média | E05 local | [E08](tasks/E08-gps-mapa-local.md) | GPS simulado e lista/teclado passaram; validar aparelho físico |
| E09 | Offline/sincronização | Codex | integrada em P03 | alta | E04–E07 | [E09-cache](tasks/E09-cache-interface.md), OFFLINE.md | Fila, confirmação servidor e conflito validados em P03 |
| E10 | Relatório oficial | Codex | integrado em P03; layout a conferir | alta | E07/E09 oficiais | src/report/* e tarefa a definir | Fonte real completa e sincronização confirmada antes de definitivo |
| E11 | Revisão/entrega oficial | Codex | técnica P03 concluída; campo pendente | alta | E01–E10 | docs/* e tarefa a definir | Validar fluxo oficial, índices reais e ciência antes de publicar |
| R03 | Integridade final local | Codex | concluída | alta | E09-cache | [R03](tasks/R03-integridade-final.md) | Evidências finais, docs coerentes e commit local |
| P01 | Hosting do treino | Codex | publicado; download IAB não confirmado | alta | R03 | [P01](tasks/P01-hosting-treino.md) | Hosting Spark HTTPS; sem alterar backend/outro app |
| P02 | Login de teste externo | Codex | absorvida por P03 | alta | P01 | [P02](tasks/P02-login-teste.md) | Esclarecimento: produto compartilhado em nuvem |
| P05 | Estimativa de capacidade Spark | Codex | concluída (análise) | média | P04 | [P05](tasks/P05-capacidade-spark.md) | Consulta só leitura, cálculo explícito e limites documentados |
| P06 | Segurança, README e GitHub | Codex | concluída; Hosting/GitHub confirmados | alta | P05 | [P06](tasks/P06-seguranca-github.md) | Revisão rastreável, ignore, README atual, testes e SHA remoto conferido |
| P07 | PDF completo em menos páginas | Codex | concluída e publicada | alta | P06 | [P07](tasks/P07-pdf-menos-paginas.md) | 19 → 11 páginas na mesma amostra, conteúdo integral e validação/publicação documentadas |
| P04 | Mapa, GPS e relatório legível | Codex | concluída e publicada | alta | P03 | [P04](tasks/P04-mapa-gps-relatorio.md) | Mapa-base, captura destino, cm e PDF completo legível |
| P03 | Integração compartilhada em nuvem | Codex | concluída e publicada | alta | P01/R03 | [P03](tasks/P03-integracao-nuvem.md) | Transações, Auth, regras, idempotência, conflitos e relatórios reais |

E01/R01/R02 descrevem entregas históricas. P03 integra E04–E10 com evidências em sua tarefa/TESTING. Execução sequencial; criar tarefa antes de novos caminhos. Próximo trabalho: validação da equipe em campo/layout, conforme STATUS.md.
