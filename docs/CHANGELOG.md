# Changelog

## 2026-10-03 — P10 apresentação para recrutadores
- README reestruturado com visão geral, telas, destaques técnicos, diagramas Mermaid, stack, execução, testes, segurança e custo; conteúdo interno preservado por resumo + link. Nenhum código/regra/dado alterado.
- Licença MIT e CI do GitHub Actions (tipos, build e testes). Screenshots fictícias do protótipo em `docs/images/`.
- Validação sem emulador: 191 testes passaram/23 ignorados (214 no total), tipos e build OK; `npm ci --dry-run` consistente. Detalhes/limitações em `tasks/P10-portfolio-readme.md`.

## 2026-10-03 — P09 rótulo pelo registro
- Identificação compartilhada prioriza N_REGISTRO com zeros, mantendo identificadores persistidos e Excel. Decisão D-026.
- 213 testes passaram/1 opt-in ignorado no emulador; tipos/build passaram. Hosting e bundle HTTP confirmados; tarefa P09 documenta reprodução/limites.


## 2026-10-03 — P08 Excel e gestão anual
- Excel `.xlsx` com um ninho por coluna e números na primeira linha; todos os campos/históricos e continuação de texto, sem fórmulas de usuário. Amostra independente: 364 rótulos/valores presentes.
- Ano/número operacional auditado e reservado online; mapa/lista por ano, legado em Sem ano definido. Previsão informada com antecedência, sem prazo científico presumido.
- Armazenamento com medição manual e aviso; coordenação pode reter por ano/período após PDF/JSON e confirmação. Regras/revisões/recibos protegem; conta campo e fichas reais preservadas. Decisões D-023–D-025.
- 212 testes passaram/1 opt-in ignorado no emulador; tipos/build/audit passaram. Regras/Hosting publicados e bundle HTTP confirmado. Detalhes/limitações em tarefa P08.


## 2026-10-03 — P07 PDF completo em menos páginas

- Campos curtos em pares, textos longos com largura inteira, margens/espaçamentos menores e paginação por espaço disponível. Um único relatório completo; nenhuma regra/dado/JSON/CSV alterado.
- Mesma amostra fictícia: 19 → 11 páginas (≈42% menos). 728 rótulos/valores presentes, sem caracteres fora das margens; 11 páginas renderizadas e conferidas.
- 202 testes passaram/1 opt-in ignorado após emulador pronto, tipos/build passaram. Hosting publicado e bundle atual HTTP 200. Falha inicial ambiental e reprodução em tasks/P07-pdf-menos-paginas.md.

## 2026-10-03 — P06 segurança/README/GitHub

- Revisão documentada, neutralização de fórmula CSV em listas sem alterar JSON/números; escape do ID externo no protótipo. Headers Hosting reforçados, publicados e confirmados por HTTP.
- `.gitignore` ampliado para env/credenciais/exportações/intermediários; histórico pesquisado sem segredos identificados nos padrões. README detalha construção, funcionalidades, configuração, testes e limites atuais.
- 201 testes passaram/1 opt-in ignorado no emulador; tipos/build e npm audit zero. Dados reais e visual preservados. Riscos residuais e entrega Git em tasks/P06-seguranca-github.md/reviews/P06-seguranca.md.
- Push inicial ao origin/master passou; SHA do commit de entrega `f04819c` confirmado no remoto, sem force push.

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
