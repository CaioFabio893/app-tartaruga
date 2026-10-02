# Changelog

## 2026-10-02 — E01 Base, contratos e domínio
- Extração do manual (7 páginas) para `FIELD_DICTIONARY.md` e `DOMAIN_RULES.md`, com página de origem em
  toda afirmação. 8 dúvidas científicas rastreadas (§8).
- Contratos: `DATA_MODEL.md`, `ARCHITECTURE.md`, `PRODUCT.md`, `REPORT_SPEC.md`.
- Domínio: tipos, datas (noite de monitoramento, 12:00:00 → noite anterior), cálculos derivados versionados
  (OVOS_TOT com exceção explícita P/T + problema, PCT_VIVOS, TEMP_INCUB). 40 testes de comportamento
  (datas + cálculos).
- Scaffold: Vite, TypeScript strict, React, tokens do design, manifest PWA, estrutura de pastas.
- Build e typecheck passando; testes verdes.
- Decisões registradas (D-001 a D-010).
- STATUS, INDEX, BACKLOG, DECISIONS, CHANGELOG inicializados.

**Arquivos principais alterados/criados**: `docs/FIELD_DICTIONARY.md`, `docs/DOMAIN_RULES.md`,
`docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`, `docs/PRODUCT.md`, `docs/REPORT_SPEC.md`,
`src/domain/{tipos.ts, datas.ts, calculos.ts, validacao.ts}`, `tests/{datas.test.ts, calculos.test.ts}`,
`package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`, `.env.example`, `index.html`,
`public/manifest.webmanifest`, `src/{App.tsx, main.tsx, styles/base.css}`, `docs/{STATUS.md, INDEX.md,
BACKLOG.md, DECISIONS.md, CHANGELOG.md}`.