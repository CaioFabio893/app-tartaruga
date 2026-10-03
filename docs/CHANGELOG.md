# Changelog

## 2026-10-03 — P06 segurança/README/GitHub

- Revisão documentada, neutralização de fórmula CSV em listas sem alterar JSON/números; escape do ID externo no protótipo. Headers Hosting reforçados, publicados e confirmados por HTTP.
- `.gitignore` ampliado para env/credenciais/exportações/intermediários; histórico pesquisado sem segredos identificados nos padrões. README detalha construção, funcionalidades, configuração, testes e limites atuais.
- 201 testes passaram/1 opt-in ignorado no emulador; tipos/build e npm audit zero. Dados reais e visual preservados. Riscos residuais e entrega Git em tasks/P06-seguranca-github.md/reviews/P06-seguranca.md.

## 2026-10-03 — P05 estimativa Spark

- Consulta somente leitura e estimativa de documentos/índices da amostra atual. Faixa de planejamento 2.000–3.000 ninhos semelhantes acumulados, sem garantia; histórico e cotas diárias podem limitar antes. Metodologia/ressalvas em tasks/P05-capacidade-spark.md. Sem alteração de código/dados/plano, sem novos testes ou publicação.

## 2026-10-03 — P04 mapa/GPS/relatório

- Leaflet/OpenStreetMap online com atribuição, posição atual coerente e margem de erro disponível. GPS no destino e captura de melhor leitura cancelável; precisão não garantida. Casco em cm conforme confirmação do usuário.
- Relatório padrão de todos os ninhos, incluindo sem datas; opção por período preservada. PDF com todos os campos em tabelas legíveis, condições/motivos e códigos explicados; sem destino JSON/null/UID como nome. Insumos e fórmulas preservados.
- 195 testes passaram/1 opt-in ignorado; tipos/build e Hosting passaram. Amostra A4 renderizada, PDF público baixado e mapa/consulta de servidor conferidos. Evidências/arquivos/limites em tasks/P04-mapa-gps-relatorio.md.

## 2026-10-02 — P03 aplicativo em nuvem publicado

- Acesso único adriano, Auth real e Firestore Standard/Hosting Spark. Cadastros, transferências, visitas, abertura e complementos auditados, origem imutável e derivados v2.
- Transações com revisão/versão, idempotência, reservas e regras de acesso; pendência local durável, confirmação servidor e conflito explícito. Relatórios por três critérios, PDF/JSON/CSV do mesmo snapshot.
- 188 testes passaram/1 opt-in ignorado; tipos/build passaram. Prova real separada passou; login e prévia confirmada na URL pública. Área sintética desativada sem apagar auditoria; principal vazio. Arquivos/evidências/limites em tasks/P03-integracao-nuvem.md e TESTING.md.

## 2026-10-02 — P01 Hosting do treino

- Configuração estática Hosting, SPA/cache do SW e exclusão de source maps; publicação solicitada pelo usuário, em outra conta Google.
- 165 testes passaram/7 ignorados sem emulador; tipos/build passaram. Usuário concluiu login adicional, Hosting publicado no projeto monitoramento-de-tartarugas (Spark). Prévia/cache e HTTP validados; download IAB não confirmado (ver tarefa). Backend/sincronização continuam pendentes.

## 2026-10-02 — E02–E09 locais e R03 (Codex)

- Relatório A4/JSON/CSV por período e três critérios, snapshot único, históricos, valores ausentes e ambiguidades explícitas; exemplo em output/pdf.
- Interface Claude preservada; cadastro de treino, transferências, visitas e abertura/correções auditadas no IndexedDB. Conflito entre abas preserva formulário.
- Login e confirmação online de membro/projeto; regras deny-default testadas no emulador. Escritas oficiais ainda negadas.
- GPS independente, esquema SVG/lista, cache estático de produção e atualização sem descarte de rascunho. Sem serviços externos de mapa.
- R03: contagens/datas/estrutura local validadas, UTC zero aceito, totais ausentes null, média percentual sem fonte removida, CSV vazio completo e identificação em continuação de ficha.
- Override transitivo grpc corrigido; auditoria sem vulnerabilidades. Evidências em TESTING.md; escopos em tasks. Nenhum deploy/push ou sincronização oficial entregue.

## 2026-10-02 - R02 Fechamento de contratos (OpenCode)

- Contratos F07-F12 de REVISAO-BASE.md fechados como domínio puro (sem Firebase): dono único de campo,
  consulta por projeção (`OCORR`/`ECLOS`/`ABERT`), fila offline idempotente (`operationId`/`baseVersion`),
  reserva numérica determinística, fuso IANA + offset observado, posição atual derivada e abertura de
  referência sem escolha silenciosa.
- Novos módulos: `src/domain/{consultas,persistencia,fila,reserva,fuso,agregado}.ts` e testes
  `tests/{consultas,persistencia,fila,reserva,agregado,fuso}.test.ts` + `tests/auxiliares-agregado.ts`.
- `src/domain/tipos.ts` ajustado (Trilha/Projeto/auditoria, dono único); `DATA_MODEL.md` atualizado; `DOMAIN_RULES.md` com páginas normalizadas; `OFFLINE/SECURITY/ARCHITECTURE/REPORT_SPEC/
  TESTING` alinhados aos contratos.
- React 19 movido para `dependencies` (F12); PWA/emuladores declarados pendentes, não entregues.
- Decisões D-012 e D-013; D-002 corrigida para v2.
- 133 testes, typecheck e build passando. Detalhes em docs/tasks/R02-contratos.md.

## 2026-10-02 - R01 Revisão inicial Codex

- Calendário/horários/offsets e corte 09h corrigidos; cálculos rejeitam contagens inconsistentes (v2).
- Códigos e observações validados; flagrante explícito no tipo.
- Correções do manual, configuração sem Storage, Claude como autor visual, README.
- Transcrição do usuário salva e indexada para consulta por campo.
- 63 testes e build/typecheck passando. Achados F07-F12 encaminhados a R02.
- Detalhes em docs/reviews/REVISAO-BASE.md e docs/tasks/R01-revisao-base.md.

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
