# Testes

## Evidência atual — Codex, 02/10/2026

- `npx vitest run`: **165 passaram / 7 ignorados**, 14 arquivos (13 passaram, segurança sem emulador ignorada). Última execução após acabamento PDF, com E02_GRAVAR_EXEMPLO=1 para regenerar amostra.
- `npx tsc --noEmit`: passou. `npx vite build`: passou, sem aviso de chunk; módulos PDF/Auth/Firestore separados sob demanda. Entrada principal 83,80 kB gzip; PDF 178,17 kB gzip sob demanda.
- `firebase emulators:exec --only firestore --project demo-tartarugas "npx vitest run tests/security"`: **7/7 passaram** no Firestore Standard emulado. Também repetido com FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 após override grpc; 7/7. CLI 15.30.1/Java 21. Isso não valida produção ou índices.
- `npm audit`: zero vulnerabilidades após override pontual D-015, incluindo dependências de desenvolvimento. Não foi usado audit fix --force.
- Uma falha inicial de treino após validar corrupção antecipadamente foi expectativa de mensagem antiga; corrigida para verificar rejeição e estado original intacto. Suíte final passou.

## Verificações no Edge local

Playwright com Edge, sem conta ou localização real:

- Prévia de cinco casos fictícios, downloads PDF/JSON/CSV, filtro DC, invalidação da prévia ao mudar filtro, detalhe original/transferido; tela 390px sem overflow; nenhum erro de página.
- IndexedDB nativo: ML não cria ninho; CD cria; transferência para cercado; eclosão antes de abertura; edição com zero observado e histórico; recarga mantém dados; duas abas com revisão antiga rejeitam gravação sem perder rascunho. Testes unitários usam fake-indexeddb, distintos desta verificação nativa.
- Auth+Firestore demo locais: login, membro campo online confirmado, projeto sem vínculo negado e logout. Sem SDK configurado o treino não exige login. Fixtures apenas fictícias.
- GPS simulado (0,0, precisão 2 m) preservado; esquema SVG/lista e abertura pelo teclado. Testes de GPS cobrem negação, coordenadas inválidas, timeout e cancelamento. Nenhum GPS físico testado.
- Build em preview: 12 assets próprios no cache, recarga offline, PDF offline, cadastro local e recarga com estado mantido. Atualização de worker ficou waiting e manteve rascunho; mudança temporária foi apenas em dist/sw.js e restaurada. Smoke após build final: sem overflow/erro de página.

## PDF renderizado

Amostra final `output/pdf/relatorio-demonstracao.pdf`: 11 páginas A4, todas com texto, mosaico de todas revisado. Acentos, travessão, vazio/zero, rodapé e identificação de ficha continuada presentes. Intermediário de observação longa: 13 páginas, marcador final FIM_DA_OBSERVACAO recuperado por extração, palavra longa quebrada e aviso de glifo não suportado inspecionados visualmente. Intermediários ficam em tmp/pdfs/e02 (ignorados).

15 testes de relatório incluem 501 fichas sem truncamento, vazio, três critérios, datas inclusivas, ambiguidade, null/zero, filtros combinados, vínculos e dados inválidos. Não foi afirmada equivalência com modelo oficial: layout é proposta.

Limites da entrega local anterior: não validava Firebase real nem fila remota. P03 abaixo acrescenta essas provas. Instalação física/iOS e aprovação científica/layout continuam pendentes.

## Comandos

```powershell
# Rodar todos os testes
npx vitest run

# Rodar em modo watch
npx vitest

# Checagem de tipos
npx tsc --noEmit

# Build de produção
npx vite build

# Preview local
npx vite preview
```

## Cenários obrigatórios (comportamento)

| Área | Cenário | Evidência |
| --- | --- | --- |
| Datas | Madrugada pertence à noite anterior (01:30 → noite de dia anterior). **12:00:00** pertence à noite anterior; **12:00:01** pertence ao novo dia. | `tests/datas.test.ts` |
| Período | Inclusivo em ambas as pontas. Data ausente nunca entra. Período invertido não seleciona nada. | `tests/datas.test.ts` |
| OVOS_TOT | Soma normal 4 componentes; componente ausente → `null`, nunca `0`. Zero real é aceito. | `tests/calculos.test.ts` |
| Exceção OVOS_TOT | `SITUACAO = P` ou `T` + `problemaIncubacao = true` → usa `OVOS_TRANS`. Se `problemaIncubacao = null` → **não** aplica (sem inferência). | `tests/calculos.test.ts` |
| PCT_VIVOS | Só com `CD + SU + OVOS_TOT > 0`. Total zero ou indefinido bloqueia. | `tests/calculos.test.ts` |
| TEMP_INCUB | Só com `CD + SU` e ambas as datas. `DATA_OCORR` em branco → `null` (desova localizada depois). Eclosão anterior à postura → `null`. | `tests/calculos.test.ts` |
| Tipo ocorrência | `SD` exige `verificacaoPraiaRealizada = true` (p. 3). Só `CD` cria ninho. | `tests/validacao.test.ts` e `tests/treino/treino.test.ts` (ver cobertura específica e P03) |
| Condicionais | `HIST_NINHO = OT` exige OBS. `TUMORES` obrigatório no flagrante. `EVIDENCIA_INT_PESCA` exige `TIPO_EVIDENCIA`. | `tests/validacao.test.ts` e `tests/treino/treino.test.ts` (ver cobertura específica e P03) |
| Transferência | Cercado exige `N_NINHO`; praia **proíbe** `N_NINHO` (p. 4). | `tests/validacao.test.ts` e `tests/treino/treino.test.ts` (ver cobertura específica e P03) |
| Relatório | Filtro = PDF (mesmo conjunto). Período inclusivo. Datas vazias excluídas e contabilizadas. Vazios impressos como `—`. | `tests/consultas.test.ts` + `tests/report/relatorio.test.ts` |
| Consulta (F07) | Três critérios (`OCORR`/`ECLOS`/`ABERT`) isolam por projeto. Filtro com `data_criterio >= inicio` e `<= fim`, filtros opcionais escalares; sem `data_criterio` fica fora e é contabilizado à parte. | `tests/consultas.test.ts` |
| Persistência (F10) | Ida e volta camelCase/snake_case; dono único por campo; número oficial preserva zeros; documento completo sem divergência de chaves. | `tests/persistencia.test.ts` |
| Fila offline (F08) | Cache ≠ sincronizado. `baseVersion` em conflito preserva rascunho. Erro de permissão não reenvia. | `tests/fila.test.ts` |
| Reserva de número (F09) | Mesmo número no mesmo escopo → mesmo dono; zeros iniciais diferenciam; número pendente não gera chave vazia. | `tests/reserva.test.ts` |
| Agregado/posição (F10) | Posição atual derivada; abertura ambígua não calcula derivados; `OVOS_FURAD` entra uma vez. | `tests/agregado.test.ts` |
| Fuso (F11) | Offset observado prevalece; zona inválida não vira chute; Intl confere sem conversão de DST. | `tests/fuso.test.ts` |

**Regra**: Domínio, filtros, permissões e sincronização exigem **teste de comportamento**. Não escrever teste
que só repete a implementação nem teste que só verifica CSS.

Observação Git: diff --check apontou apenas linhas vazias finais em src/App.tsx e src/domain/tipos.ts; sem falha funcional. Mantidas para não ampliar edição de tipos fora do escopo final.

## P03 — integração real (02/10/2026)

- Suíte completa final: `$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'; npx vitest run` — 188 passaram, 1 prova de produção opt-in ignorada; 18 arquivos. `npx tsc --noEmit` e `npx vite build` passaram. Emulador demo separado; não confundir com produção.
- tests/nuvem/nuvem.test.ts: transações entre clientes, reenvio idempotente, revisão antiga, campos preenchidos/duas reservas, eclosão antes da escavação, abertura zero/correção/pre-imagem, espécie posterior e N_REGISTRO sem renumerar, três critérios inclusivos/PDF e filtros. Regras rejeitam cliente com papel falso, origem alterada, dados/códigos/projeção adulterados e operação antiga reutilizada. tests/security preserva isolamento/autoelevação/negativa por padrão.
- tests/nuvem/pendencias.test.ts: fake-indexeddb + SDK mock; pendência recuperada, isolada por usuário, confirmação necessária para limpar, erro sem reenvio automático e arquivo exportável ao adotar remoto. Isso não é teste de rede física.
- Prova real separada `npx vitest run tests/nuvem/producao.test.ts`, somente com opt-in P03_VALIDAR_PRODUCAO e senha em variável temporária P03_SENHA (não registrar valor): 1 passou. SDK Firebase real, dois clientes da mesma conta adriano, escrita e reenvio/leitura/abertura zero/visita/PDF por OCORR/ECLOS/ABERT; senha incorreta/sem sessão negados; projeto principal conferido vazio. Fichas sintéticas isoladas em validacao-p03-interna, sem coordenadas reais, jamais no projeto principal.
- Primeira prova real falhou por índice BUILDING; API confirmou READY antes da reexecução. Emulador não valida índices. Regras finais compiladas e publicadas sem avisos.
- Interface no navegador integrado, build local com backend real: login adriano, fonte confirmada, prévia vazia e download PDF. Arquivo C:/Users/caiof/Downloads/ninhos-confirmado-eclos-2026-10-01-2026-10-31.pdf observado com 2.134 bytes e modificação desta sessão; nenhum erro capturado. O evento de download da ferramenta falhou em P01, mas nesta verificação o arquivo salvo foi observado diretamente (sem insistir na mesma API).
- Falhas resolvidas: DTO de ocorrência enviado erroneamente como subcoleção; leitura de documento inexistente para CAS; adaptação compat/modular do SDK de testes; fixture sem OBS obrigatório. Limite de 1.000 expressões em ficha completa resolveu-se com projeção mínima e autorização central na operação nova, mantendo validação de schema/domínio/pré-imagem/versões. Nenhuma negativa foi removida para fazer teste passar.

Limites atuais: GPS real/instalação física e rede offline em aparelho não testados nesta P03; PDF é layout proposto até conferência da equipe. Reabertura distinta bloqueada; perguntas científicas em DECISIONS/DOMAIN_RULES. Carga inicial lê o projeto/históricos e consome cotas Spark. Relatório não promete contagem global fora do intervalo. Site pós-publicação conferido conforme DEPLOY/P03.

Pós-publicação: deploy de firestore:rules,hosting passou; URL pública autenticou adriano, exibiu dados confirmados e prévia ECLOS vazia com PDF/JSON/CSV disponíveis; nenhum erro de console capturado. PDF baixado inspecionado com pdf-lib: uma página A4 (595,28 × 841,89 pt), metadados de critério ECLOS e sincronização confirmada. Área validacao-p03-interna e membro desativados via API (HTTP 200), sem excluir fontes/auditoria.

## P04 — 03/10/2026

`$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'; npx vitest run`: 195 passaram/1 opt-in ignorado, 19 arquivos. `npx tsc --noEmit` e `npx vite build` passaram após últimos ajustes. Casos novos: todos inclui múltiplos ninhos/sem datas/filtros/isolamento; dados de período mantidos; todos os campos do manual no PDF; vazio/zero/indeterminado distintos; GPS conserva melhor leitura e cancela sem aplicar. Mock GPS não é precisão física.

Amostra fictícia gerada pelo teste com P04_GRAVAR_EXEMPLO=1; 19 páginas A4 renderizadas e inspecionadas, incluindo texto longo. Fontes de substituição Poppler advertidas, sem falha de renderização nas páginas conferidas. PDF público de cinco páginas baixado e conferido: nome Adriano, nenhum UID/destino JSON/null, campos de transferência legíveis. Mapa geográfico, atribuição, botão GPS de destino e leitura confirmada de 1 ninho verificados no navegador público, sem erros de console. Nenhum dado real escrito; formulário cancelado. Comandos/deploy/limites em tarefa P04 e DEPLOY.

## P08 — 03/10/2026
Emuladores Auth/Firestore locais prontos. `$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'; npx vitest run --maxWorkers=2`: 212 passaram/1 teste real opt-in ignorado, 26 arquivos. Novos: reservas simultâneas 001/002, reinício em 2027, conflito e duplicidade, papel adulterado, bloqueio de exclusão sem recibo/hashes/backup vigente, retenção mantendo outro ano/reservas; cache separado e reserva real offline negada, filtros/alerta/null. Não houve exclusão ou escrita de teste em produção.
`$env:P08_GRAVAR='1'; npx vitest run tests/report/p08.test.ts`: cria amostra fictícia. Python empacotado + `tests/report/p08-verificar.py`: leitor openpyxl, 364 rótulos/valores presentes, 5 colunas 001–005, congelamento B2, zero numérico, nenhuma fórmula. Artifact Tool import/inspect confirmou cabeçalhos/campos; render PNG encerrou com exit 1 sem diagnóstico, então não afirmar conferência visual do arquivo no Excel. Primeira chamada de importação falhou pelo URI Windows sem file:// e foi corrigida. Reprodução usa planilha produzida pelo app, não substituição por outra biblioteca.
Typecheck/build finais e publicação são registrados na tarefa P08. Dependência fflate local e MIT; `npm audit --omit=dev`: zero vulnerabilidades.
