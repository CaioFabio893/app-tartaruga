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

Limites: sem Firebase de produção, índices reais, fila remota, conflito entre aparelhos, instalação física/iOS ou aprovação científica/layout. Escritas oficiais permanecem negadas.

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
| Tipo ocorrência | `SD` exige `verificacaoPraiaRealizada = true` (p. 3). Só `CD` cria ninho. | `tests/validacao.test.ts` e `tests/treino/treino.test.ts` (ver cobertura específica; formulários oficiais pendentes) |
| Condicionais | `HIST_NINHO = OT` exige OBS. `TUMORES` obrigatório no flagrante. `EVIDENCIA_INT_PESCA` exige `TIPO_EVIDENCIA`. | `tests/validacao.test.ts` e `tests/treino/treino.test.ts` (ver cobertura específica; formulários oficiais pendentes) |
| Transferência | Cercado exige `N_NINHO`; praia **proíbe** `N_NINHO` (p. 4). | `tests/validacao.test.ts` e `tests/treino/treino.test.ts` (ver cobertura específica; formulários oficiais pendentes) |
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
