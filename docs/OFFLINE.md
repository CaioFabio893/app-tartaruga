# Offline

## Distinção importante

Cache da interface e **persistência de dados** são coisas distintas (`AGENTS.md`).

- Gravação aceita no cache local **não** significa "sincronizado".
- Só diga "sincronizado confirmado" após confirmação do servidor.
- Relatório definitivo exige online + sincronização confirmada. Exportação offline é marcada como **parcial**.

## Implementado localmente

Treino em `src/data/treino.ts`: IndexedDB nativo, operações/revisões auditadas em transação única; uma aba com revisão antiga não sobrescreve outra. Falha mantém formulário. Estrutura inválida/incompatível gera erro e não reset. Exportação integral JSON disponível; não há importação/restauração pela interface ainda.

SW de produção cacheia somente assets estáticos próprios, inclusive módulos PDF. Navegação tem fallback offline após cache instalado; requisições Firebase/tokens e outras origens não são cacheados. Atualização fica aguardando, sem skipWaiting automático; fechar abas quando não houver rascunho. Instalação física ainda não testada.

## Estratégia remota planejada (ainda não integrada)

- Fila de escritas pendentes em `IndexedDB` (repositório futuro `src/data/fila.ts`, ainda ausente): cada operação pendente guarda
  `operationId` (idempotência), `baseVersion` (detecção de conflito), `payload.versao` (= `baseVersion` + 1),
  caminho, tipo e estado. O contrato de transições está em `src/domain/fila.ts`.
- Interface exibe: `alteração pendente de sincronização`, `sincronizado confirmado`, `conflito entre
  aparelhos`, `sem internet`, `erro de permissão`.
- Ao reconectar: processar fila em ordem, com tentativas com backoff exponencial.
- Erro de permissão na sincronização: mover item para fila com erro, exibir mensagem clara e não reescrever
  dados locais silenciosamente. Não reenviar automaticamente item com erro de permissão.
- Uma operação que já foi aplicada no servidor (resposta idempotente) vira `confirmada`, nunca é reaplicada.

## Conflitos

`last-write-wins` **não** é padrão automático. Política proposta:

1. Se a operação pendente carrega `baseVersion` menor que a versão atual do servidor, tratar como
   **conflito** (não comparar só por `updated_at`; a versão do documento é a fonte de detecção).
2. Marcar registro com `conflito: true` e apresentar resolução ao usuário (manter remoto, manter local,
   mesclar). Não sobrescrever automaticamente; preservar o rascunho local para a decisão.
3. Resolver conflitos antes de gerar relatório definitivo.

Integração remota E09 permanece pendente (com testes de comportamento próprios). O contrato de estados/finalidade já
está fechado em `src/domain/fila.ts` (`tests/fila.test.ts`).

## IDs e concorrência

Registros nascem com UUID v4 local. Números oficiais (`N_REGISTRO`, `N_NINHO`) podem ficar `null` offline
(`DATA_MODEL.md §6`) e são confirmados na sincronização com reserva determinística de unicidade
(`src/domain/reserva.ts`, `tests/reserva.test.ts`).

## Exportação

PDF/JSON/CSV gerados offline recebem a marca `parcial: true`. O app avisa isso claramente antes do download.