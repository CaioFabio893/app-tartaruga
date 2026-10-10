# P15 — Cadastro guiado, correção e exclusão individual

Dono: Codex. Ativa em 09/10/2026; execução sequencial autorizada pelo usuário.

Escopo: src/features/treino/*, src/features/gestao/ExcluirNinho.tsx, src/app/treino.ts, src/data/nuvem.ts, src/data/gestao-exclusao.ts, src/App.tsx, src/styles/interface.css, firestore.rules, tests/cadastro/*, tests/security/cadastro.test.ts, docs/{STATUS,BACKLOG,CHANGELOG,DECISIONS,SECURITY,DATA_MODEL,DOMAIN_RULES,FIELD_DICTIONARY,OFFLINE}.md e esta tarefa.

Objetivo: cadastro por etapas com nomes oficiais preservados, ajuda condicional, erros por campo, revisão; edição auditada com motivo e valores anteriores; transferência posterior mantida; exclusão individual somente coordenação, online e com backups. Não alterar dados reais para testar.

Usuário autorizou corrigir todos os dados informados, inclusive erros na origem e número: registrar exceção explícita ao bloqueio anterior, sem transformar transferência em correção. IDs/vínculos técnicos e derivados não são editáveis; invariantes científicos continuam validados.

## Estado: concluída (10/10/2026)

Cadastro em 5 etapas (ocorrência, localização, tartaruga, situação condicional em CD, observações/revisão), com rascunho local por usuário/projeto/ocorrência e versão-base; erros mapeados por campo via `validacaoCadastro.ts` e devolvidos ao passo correspondente; nomes oficiais (`TIPO_OCORR`, `DATA_OCORR`, `N_REGISTRO`, `LATITUDE`, `DATUM`…) preservados e código técnico nunca exposto como rótulo.

Edição auditada: `corrigirCadastro` (operação `cadastro`) preserva IDs/vínculos/autoria, exige motivo, registra pré-imagem e incrementa versão; só não pode transformar CD com ninho em ocorrência sem desova nem mudar situação (manejo segue por transferência própria). Edição de transferência existente mantém ID/sequência sem duplicar o manejo. Exclusão individual (`ExcluirNinho.tsx`) exige coordenação, online, sincronização confirmada, backup PDF/JSON conferidos e digitação `EXCLUIR`.

Firestore `firestore.rules`: libera escrita de campo somente por transação com operação nova e imutável; `cadastro` e edição de transferência com `motivo`, pré-imagem e reservas (antigas não liberadas); `numeroReservado` aceita re-reserva ao mesmo documento e edição de N_NINHO em atualização com motivo.

## Validação

- `npx tsc --noEmit` e `npx vite build`: passaram.
- `$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'; npx vitest run --maxWorkers=2`: **234 passaram/1 opt-in produção ignorado**, 29 arquivos. Emulador Firestore loopback já em execução (processo Java anterior); sem escrita real.
- `tests/cadastro/cadastro.test.ts` (10): rascunho por versão, campos condicionais, zero/vírgula/ausência, correção auditada, transferência posterior preservando origem, exclusão de treino com pré-imagem.
- `tests/security/cadastro.test.ts` (6, emulador): correção origem/data/número com motivo/pré-imagem/reserva; nega escrita direta/consulta/intruso/motivo ausente/conflito; edita transferência preservando ID/origem; correção antes/após abertura e data incompatível negada; exclusão individual só do ninho escolhido e negada ao campo.
- `npm audit`: 0 vulnerabilidades. `git diff --check`: limpo.

## Limites

Emulador e fake-indexeddb; sem prova de escrita/regras em produção nem teste em aparelho físico. Rascunho de cadastro é local ao navegador (localStorage), não sincronizado, limpo após salvar. Exclusão individual depende de coordenação com backup conferido fora do app; hashes não comprovam arquivo guardado. Correção de número não renumera a sequência oficial nem libera reservas antigas. Dados reais não foram alterados para testar.
