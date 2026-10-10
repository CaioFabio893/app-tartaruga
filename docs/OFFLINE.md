# Offline

## Distinção importante

Cache da interface e **persistência de dados** são coisas distintas (`AGENTS.md`).

- Gravação aceita no cache local **não** significa "sincronizado".
- Só diga "sincronizado confirmado" após confirmação do servidor.
- Relatório definitivo exige online + sincronização confirmada. Exportação offline é marcada como **parcial**.

## Implementado localmente

Treino em `src/data/treino.ts`: IndexedDB nativo, operações/revisões auditadas em transação única; uma aba com revisão antiga não sobrescreve outra. Falha mantém formulário. Estrutura inválida/incompatível gera erro e não reset. Exportação integral JSON disponível; não há importação/restauração pela interface ainda.

SW de produção cacheia somente assets estáticos próprios, inclusive módulos PDF. Navegação tem fallback offline após cache instalado; requisições Firebase/tokens e outras origens não são cacheados. Atualização fica aguardando, sem skipWaiting automático; fechar abas quando não houver rascunho. Instalação física ainda não testada.

Rascunho de cadastro P15: localStorage por usuário/projeto/ocorrência e versão-base. Retoma valores apenas na mesma versão; conteúdo corrompido/incompatível é ignorado sem apagar a chave. Não é registro cadastrado nem pendência sincronizada. Limpa após salvar com sucesso. É local ao navegador, não acompanha outro aparelho, não integra a cópia JSON de registros e permanece se a sessão terminar; evite aparelho compartilhado. Falha de armazenamento é indicada na tela.

## Implementação remota P03

`src/data/pendencias.ts` usa IndexedDB separado do treino, chave usuário+projeto. Guarda base confirmada e uma operação pendente (cadastro composto pode ter dois eventos locais), com IDs estáveis e versões. Não permite nova alteração antes de resolver a pendência. `src/app/nuvem.ts` grava a pendência **antes** do envio e só limpa após transação confirmada e nova leitura de servidor.

Estados: confirmada, cache, pendente, conflito, erro. Ao reconectar tenta uma sincronização; erro requer ação manual, sem laço de tentativas. Auth usa sessão do navegador: primeira entrada exige internet; reabrir offline na mesma sessão usa cópia local, com acesso/atualização não reconfirmados. Cache não concede permissão no servidor.

Conflito de revisão do projeto ou versão do documento preserva o rascunho. Interface permite tentar sincronizar ou **manter remoto e arquivar rascunho**; a cópia JSON contém também os arquivos locais. Não há mescla nem last-write-wins. Cache corrompido não é apagado silenciosamente. Revogação/permissão negada deixa erro e pendência preservada.

Relatório confirmado consulta servidor e verifica pendências antes e depois. Sem rede ou com pendência, prévia local/exportação é parcial. Snapshot exportado não muda durante o download. Limites/reprodução: [TESTING.md](TESTING.md), [P03](tasks/P03-integracao-nuvem.md).

## IDs e concorrência

Registros nascem com UUID v4 local. Números oficiais (`N_REGISTRO`, `N_NINHO`) podem ficar `null` offline
(`DATA_MODEL.md §6`) e são confirmados na sincronização com reserva determinística de unicidade
na transação real de `src/data/nuvem.ts` (escopo provisório em DATA_MODEL §6).

## Exportação

PDF/JSON/CSV gerados offline recebem a marca `parcial: true`. O app avisa isso claramente antes do download.
## P08 — organização e retenção
IndexedDB `ninhos-gestao-v1` separado por usuário/projeto (treino em chave própria). Cópia offline sempre não confirmada. Reserva anual real/alteração operacional exige online e ficha confirmada; não entra na fila científica nem promete sequência offline. Prévia confirmada confere revisões científicas e de gestão antes/depois; cache ou falha não vira confirmado. XLSX offline também parcial. Exclusão exige online/sincronização, backups e ausência de pendência local; mudança depois do backup bloqueia a remoção. Ver [P08](tasks/P08-gestao-excel.md).
