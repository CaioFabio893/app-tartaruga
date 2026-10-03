# Status — 03/10/2026

P04 concluída e publicada: mapa geográfico, GPS no destino, cm e relatório completo legível, dono Codex. Escopo em [P04](tasks/P04-mapa-gps-relatorio.md). P03: aplicativo compartilhado em nuvem autorizado pelo usuário, com **um único acesso adriano**. Dono Codex, execução sequencial; visual Claude preservado. Build final P03 e regras publicados e conferidos; endereço https://monitoramento-de-tartarugas.web.app .

## Implementado

- Auth email/senha padrão; membro campo provisionado administrativamente, sem auto-administração. Firestore Standard São Paulo + Hosting Spark; sem faturamento/serviços fora do escopo.
- Ocorrência/CD+ninho e transferência inicial atômicos; transferências/visitas, eclosão/abertura e correções com auditoria. Complemento de espécie/animal e primeira atribuição de N_REGISTRO, sem renumerar. Origem imutável; derivados v2.
- Revisão global, versões por documento, operação nova imutável, pré-imagem e reenvio idempotente. Reservas de números por escopo técnico provisório. Regras negam acesso sem membro, papel falso, acesso cruzado e alteração de origem.
- Projeção técnica v2 mínima por ninho, três datas indexadas. Relatório inclusivo por OCORR/ECLOS/ABERT, PDF/JSON/CSV do mesmo snapshot; confirmado somente após consulta de servidor e sem pendências. Offline/parcial explícito.
- IndexedDB por usuário/projeto, uma pendência de cada vez, recuperação e conflito explícito. Adotar remoto arquiva o rascunho exportável; não faz mescla automática. Treino anterior permanece separado.

## Evidências atuais

P04: 195 testes passaram/1 opt-in ignorado; tipos/build e Hosting passaram. PDF renderizado e conferido; mapa/consulta/download verificados na URL pública, com 1 ninho existente. Nenhum dado real alterado. Detalhes em [P04](tasks/P04-mapa-gps-relatorio.md).

Validação final: 188 testes passaram no emulador/fake-indexeddb, 1 opt-in ignorado; tipos e build passaram. Prova real separada: 1 teste passou com dois clientes da mesma conta. Hosting e regras publicados; login e relatório confirmado conferidos na URL pública, sem erros capturados. Área técnica e seu vínculo desativados, registros/auditoria preservados; projeto principal sem fichas sintéticas. Resultados finais em [TESTING.md](TESTING.md) e [P03](tasks/P03-integracao-nuvem.md).

## Próximo passo e limites

P03/P04 concluídas e publicadas. Próximo passo: equipe conferir o layout do PDF e testar GPS/offline no aparelho de campo. Manter perguntas científicas em [DECISIONS.md](DECISIONS.md)/[DOMAIN_RULES.md](DOMAIN_RULES.md): listas/unidades/fuso, numeração e reabertura. Nova reabertura distinta bloqueada até protocolo; complementos da abertura existente preservam histórico na auditoria. Layout PDF proposto aguarda validação da coordenação; GPS físico/instalação em aparelhos não testados. Spark sujeito às cotas, não ilimitado.

Continuação: [handoffs/ATUAL.md](handoffs/ATUAL.md); escopo/dono: [BACKLOG.md](BACKLOG.md).
