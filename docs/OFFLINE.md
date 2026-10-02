# Offline

## Distinção importante

Cache da interface e **persistência de dados** são coisas distintas (`AGENTS.md`).

- Gravação aceita no cache local **não** significa "sincronizado".
- Só diga "sincronizado confirmado" após confirmação do servidor.
- Relatório definitivo exige online + sincronização confirmada. Exportação offline é marcada como **parcial**.

## Estratégia

- Fila de escritas pendentes em `IndexedDB` (`src/data/fila.ts`): cada operação pendente guarda o `id` do
  documento, coleção/caminho, tipo (create/update/delete lógico) e timestamp.
- Interface exibe: `alteração pendente de sincronização`, `sincronizado confirmado`, `conflito entre
  aparelhos`, `sem internet`.
- Ao reconectar: processar fila em ordem, com tentativas com backoff exponencial.
- Erro de permissão na sincronização: mover item para fila com erro, exibir mensagem clara e não reescrever
  dados locais silenciosamente.

## Conflitos

`last-write-wins` **não** é padrão automático. Política proposta:

1. Se o documento foi modificado no servidor após a versão pendente (timestamp/`updated_at`), tratar como
   **conflito**.
2. Marcar registro com `conflito: true` e apresentar resolução ao usuário (manter remoto, manter local,
   mesclar). Não sobrescrever automaticamente.
3. Resolver conflitos antes de gerar relatório definitivo.

Detalhes finais definidos na tarefa E09 (com testes de comportamento).

## IDs e concorrência

Registros nascem com UUID v4 local. Números oficiais (`N_REGISTRO`, `N_NINHO`) podem ficar `null` offline
(`DATA_MODEL.md §6`) e são confirmados na sincronização com verificação de unicidade.

## Exportação

PDF/JSON/CSV gerados offline recebem a marca `parcial: true`. O app avisa isso claramente antes do download.