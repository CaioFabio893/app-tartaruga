# Backlog

Tarefas com dono, escopo e critérios de aceite. Uma tarefa ativa por vez, caminhos exclusivos por dono
(AGENTS.md).

| ID | Título | Dono | Status | Prioridade | Dependências | Caminhos afetados | Critérios de aceite |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E01 | Base, contratos e domínio | OpenCode (build) | **concluída** | alta | — | `AGENTS.md`, `docs/*`, `src/domain/*`, `tests/*`, `tsconfig.json`, `vite.config.ts`, `.gitignore`, `.env.example`, `package.json`, `package-lock.json`, `index.html`, `public/manifest.webmanifest`, `src/App.tsx`, `src/main.tsx`, `src/styles/base.css` | Build e typecheck OK; testes 40/40; documentos coerentes entre si; sem violação dos limites (sem fotos/Blaze/Storage/IA no app) |
| E02 | Relatório com dados fictícios | OpenCode | **pendente** | alta | E01 | `src/report/*`, `tests/report/*`, `docs/REPORT_SPEC.md` (apenas correções pequenas), `docs/tasks/E02-*.md` | Gera PDF com pdf-lib, respeita vazio≠zero, paginação A4, exporta JSON/CSV, testes de filtro/periodo inclusivo |
| E03 | UI base + shell de rotas | OpenCode | **pendente** | alta | E01 | `src/ui/*`, `src/features/*`, `src/app/*`, `src/styles/*` | Tokens do design aplicados, rotas, acessibilidade (foco, ícones+texto), sem quebrar build |
| E04 | Login, projetos e Firestore | OpenCode | **pendente** | alta | E01, E03 | `src/data/*`, `src/services/*`, `firestore.rules`, `firestore.indexes.json`, `docs/FIREBASE.md`, `docs/SECURITY.md` | Regras negam por padrão, papéis, isolamento por projeto, build OK |
| E05 | Ocorrência e ninho | OpenCode | **pendente** | alta | E04 | `src/features/ocorrencias/*`, `src/features/ninhos/*`, `src/app/*` | Só CD cria ninho; localização original imutável; validações de domínio |
| E06 | Transferências e visitas | OpenCode | **pendente** | média | E05 | `src/features/transferencias/*`, `src/features/visitas/*` | Histórico como registros próprios, posição atual derivada |
| E07 | Abertura, eclosão e cálculos | OpenCode | **pendente** | alta | E05, E06 | `src/features/abertura/*` | Cálculos derivados versionados, condições de HIST_NINHO/SU |
| E08 | GPS, mapa e lista equivalente | OpenCode | **pendente** | média | E05 | `src/services/gps.ts`, `src/features/mapa/*` | Separados, funciona com coordenadas e lista sem mapa |
| E09 | Offline e sincronização | OpenCode | **pendente** | alta | E04–E07 | `src/data/fila.ts`, `src/data/sincronizacao.ts`, `docs/OFFLINE.md` | Fila pendente, não afirma sincronizado por cache local |
| E10 | Relatório com dados reais + exportação | OpenCode | **pendente** | alta | E02, E07, E09 | `src/report/*`, `docs/REPORT_SPEC.md` | Mesmo conjunto filtro=PDF, parcial marcado offline |
| E11 | Revisão e preparação de entrega | OpenCode | **pendente** | alta | E01–E10 | `docs/*`, `README.md`, `docs/DEPLOY.md`, `firestore.rules`, `firestore.indexes.json` | Build+tipos+testes, handoff para Codex (Prompt 5) com evidências |

**Nota**: E02 pode vir antes de E03 se desejado (paralelismo não necessário; execução sequencial). O relatório
entra cedo porque valida os contratos de dados.