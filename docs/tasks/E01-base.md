# Tarefa E01 — Base, contratos e domínio

**Status**: concluída
**Dono**: OpenCode (build)
**Data conclusão**: 02/10/2026

## Objetivo

Criar base executável, documentação, contratos e domínio puro com testes. Não concluir todo o app.

## Arquivos alterados/criados

- `AGENTS.md`
- `docs/{STATUS,INDEX,BACKLOG,CHANGELOG,DECISIONS,TEAM,TESTING,FIREBASE,SECURITY,OFFLINE,DEPLOY,FIELD_DICTIONARY,DOMAIN_RULES,DATA_MODEL,ARCHITECTURE,PRODUCT,REPORT_SPEC}.md`
- `docs/handoffs/ATUAL.md`
- `docs/tasks/E01-base.md`
- `src/domain/{tipos.ts, datas.ts, calculos.ts, validacao.ts}`
- `tests/{datas.test.ts, calculos.test.ts}`
- `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`, `.env.example`
- `index.html`, `public/manifest.webmanifest`, `src/{App.tsx, main.tsx, styles/base.css}`

## Decisões

Ver `docs/DECISIONS.md` D-001 a D-010. Principais: noite de monitoramento com limite 12:00:00, cálculos
derivados versionados, exceção OVOS_TOT com `problemaIncubacao` (projeto), números oficiais podem ficar `null`
offline, vazio≠zero.

## Testes executados

- `npx vitest run`: **40/40 passed** (2 arquivos)
- `npx tsc --noEmit`: **sem erros**
- `npx vite build`: **build OK** (dist gerado)

## Limitações

8 dúvidas científicas em `DOMAIN_RULES.md §8` (não resolvidas). Unidades de biometria indefinidas (DÚVIDA 01).
`problemaIncubacao` é acréscimo do projeto (DÚVIDA 04). Layout A4 marcado como proposta.

## Próximo passo

Executar **Prompt 3** (Codex) com `docs/handoffs/ATUAL.md`. Após revisão, converter achados em tarefas no
`BACKLOG.md` e executar **Prompt 4** tarefa por tarefa.