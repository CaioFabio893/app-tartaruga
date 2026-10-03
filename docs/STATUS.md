# Status — 02/10/2026

Codex assumiu a implementação a pedido do usuário após a cota do OpenCode. Execução sequencial; visual Claude preservado. R01/R02 existentes foram mantidas.

## Entrega atual

- E02: relatório de treino por período inclusivo e critério OCORR/ECLOS/ABERT; prévia e PDF/JSON/CSV usam o mesmo snapshot. A4 paginado, históricos, null distinto de zero, derivados v2. Layout ainda é proposta para a equipe.
- E03: interface responsiva com ninhos, ocorrências, mapa, relatórios e acesso.
- E04-base: login email/senha e confirmação online de membro/projeto; regras negam por padrão. Escritas de campo e projeções no Firestore continuam bloqueadas.
- E05–E07 local: somente CD cria ninho; transferência, visita, eclosão/abertura e correção auditada. IndexedDB atômico, revisão por operação, conflito entre abas rejeitado com formulário preservado; backup integral JSON.
- E08 local: GPS por botão, entrada manual e esquema SVG com lista equivalente. Não é mapa de navegação. Testado por simulação, sem capturar localização real.
- E09-cache: interface de produção e geração PDF disponíveis offline após cache instalado; atualização aguarda sem descartar formulário.
- R03: validação de datas/contagens/estrutura local, UTC zero observado aceito, totais ausentes null, nenhuma média percentual inventada, CSV vazio com cabeçalho e avisos de ambiguidade.

**Modo de treino:** não cadastrar fichas oficiais. Salvo no aparelho não significa sincronizado. Todos os relatórios desta interface são parciais/demonstrativos, mesmo com login. O login não transforma dados de treino em dados do projeto.

## Verificação

Resultados e reprodução em [TESTING.md](TESTING.md). Revisão final concluída: `npx vitest run` (165 passaram / 7 ignorados sem emulador), `npx tsc --noEmit` e `npx vite build` passaram após acabamento do PDF. Sete testes de regras passaram separadamente no emulador demo. Amostra final A4 renderizada e revisada.

Já executado: 165 testes passaram e 7 testes de regras foram ignorados na suíte sem emulador; os mesmos 7 passaram separadamente no Firestore Standard local demo. Tipos/build passaram; npm audit retornou zero vulnerabilidades. Edge validou downloads, celular 390px, IndexedDB, conflito entre abas, login local, GPS simulado, uso offline e atualização com rascunho preservado. Nenhum Firebase de produção ou aparelho físico validado.

## Próximo passo

P01: treino publicado a pedido do usuário em https://monitoramento-de-tartarugas.web.app, projeto separado Spark. Somente Hosting; nenhuma integração oficial liberada. Escopo/evidências/limite do teste de download em [P01](tasks/P01-hosting-treino.md). Dados permanecem por aparelho/navegador/origem; localhost não migra automaticamente.

Integrar dados oficiais E05–E07/E09/E10: transações, operação idempotente, reservas, projeções e confirmação de sincronização antes de liberar escritas. Resolver perguntas em [DECISIONS.md](DECISIONS.md) e [DOMAIN_RULES.md §8](DOMAIN_RULES.md). Validar exemplar PDF e protocolo GPS em campo. Não publicar integração oficial sem validação.

Escopos e arquivos: [BACKLOG.md](BACKLOG.md), [tarefas](tasks/). Continuação: [handoffs/ATUAL.md](handoffs/ATUAL.md).
