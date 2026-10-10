# Status — 10/10/2026

P15 concluída e publicada, dono Codex: cadastro por etapas, edição auditada e exclusão individual. 234 testes passaram/1 opt-in produção ignorado no emulador; tipos/build passaram; npm audit zero. Regras/Hosting publicados e HTTP 200 confirmados; nenhuma ficha real alterada. [Entrega/limites](tasks/P15-cadastro-guiado.md).

P14 concluída (05/10/2026), dono Codex: quatro capturas proporcionais publicadas no README/GitHub e postagem LinkedIn com texto aprovado e quatro imagens; dados fictícios. Commit de imagens 8f6881f enviado/conferido no remoto. [Tarefa](tasks/P14-imagens-portfolio.md).

P13 concluída, dono Codex: 2 ninhos/11 documentos vinculados apagados a pedido do usuário para teste. Backups JSON/PDF locais conferidos, commit administrativo atômico com pré-condições/recibo; Firestore real confirmou zero ninhos/projeções/organizações e 404 dos 11 documentos. Acessos/regras/auditorias/reservas e 1 ocorrência sem ninho preservados. [Evidências/limites](tasks/P13-limpar-ninhos-teste.md). Aparelhos precisam conferir dados online; rascunhos locais não foram apagados.

P12 concluída e publicada, dono Codex: marés de Recife dentro do app, 365 dias/1.411 eventos da tábua oficial 2026; hoje/próxima maré, cartões grandes e consulta mensal recolhida. 196 testes passaram/23 ignorados sem emulador; tipos/build passaram, navegador local e viewport celular sem overflow conferidos. Hosting/raiz/bundle/cache HTTP confirmados. [Entrega/limites](tasks/P12-mares-no-app.md). Edição futura exige atualização; offline físico/aparelho real não testados.

P11 concluída e publicada, dono Codex: cadastro explicita “Sem transferência”, destino apenas em T/P; nova área Marés acessa tábuas anuais oficiais com Recife/Suape. 192 testes passaram/23 ignorados sem emulador, tipos/build passaram; cadastro fictício sem transferência e área Marés conferidos no navegador local. Hosting/bundles HTTP 200. Nenhuma ficha real alterada. [Entrega e limites](tasks/P11-transferencia-mares.md).

P10 concluída, dono OpenCode: repositório apresentável para recrutadores. README reestruturado (visão geral, telas, destaques técnicos, diagramas, testes, segurança), licença MIT, CI do GitHub Actions e screenshots fictícias do protótipo; nenhum código/regra/dado alterado. Validação sem emulador: 191 passaram/23 ignorados; tipos/build OK. [Entrega](tasks/P10-portfolio-readme.md).

P09 concluída/publicada, dono Codex: rótulos priorizam número de registro (ex. Ninho 002), sem alterar identificadores/dados. 213 testes passaram/1 opt-in ignorado; tipos/build passaram; Hosting/bundle HTTP 200 confirmados. [Entrega](tasks/P09-rotulo-registro.md).

P08 implementada e publicada, dono Codex: Excel em colunas, ano/número na nuvem, previsão informada, medição manual de armazenamento e retenção protegida somente coordenação. 212 testes passaram/1 opt-in ignorado; tipos/build/audit passaram. Regras/Hosting e bundle HTTP 200 confirmados. Nenhuma ficha real alterada ou apagada. Interface pública com dados confirmados e download XLSX do build local conferidos; push do commit efbb2f7 confirmado no GitHub; escopo/evidências/limitações em [P08](tasks/P08-gestao-excel.md).

P07 concluída e publicada: PDF completo em menos páginas, dono Codex. Amostra fictícia 19 → 11 páginas; 728 rótulos/valores presentes, sem caracteres fora das margens; páginas renderizadas conferidas. JSON/CSV e domínio preservados. Final: 202 testes passaram/1 opt-in ignorado com emulador pronto; tipos/build passaram. Hosting publicado e bundle atual confirmado via HTTP. Push origin/master passou; SHA `f0ffab1` conferido no remoto antes deste registro documental. Escopo/evidências/limitações em [P07](tasks/P07-pdf-menos-paginas.md).

P06 concluída, dono Codex: segurança/README/GitHub, [entrega](tasks/P06-seguranca-github.md). CSV corrigido após autorização de escopo; headers/protótipo/ignore/README revisados. Validação: 201 passaram/1 opt-in ignorado; tipos/build passaram; npm audit zero. Hosting publicado e HTTP/cabeçalhos confirmados. Push origin/master passou, SHA remoto conferido (`f04819c`, antes deste registro documental). Riscos residuais: senha simples compartilhada e dados locais após logout; ver [revisão](reviews/P06-seguranca.md).

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

P05: estimativa documental de capacidade concluída; amostra atual ≈266 KiB incluindo índices estimados, faixa de planejamento 2.000–3.000 conjuntos semelhantes, sem garantia de disponibilidade/escala. Ver [P05](tasks/P05-capacidade-spark.md). Nenhum dado/código/plano alterado.

## Próximo passo e limites

P03/P04/P07/P08/P15 concluídas. Fichas antigas aguardam ano/número explícitos em Sem ano definido; previsão depende da equipe e quota de medição manual. Conta Adriano campo segue sem retenção administrativa (D-025). Próximo passo: equipe conferir o layout do PDF e testar GPS/offline no aparelho de campo; coordenação validar a exclusão individual em produção (backup conferido fora do app). Manter perguntas científicas em [DECISIONS.md](DECISIONS.md)/[DOMAIN_RULES.md](DOMAIN_RULES.md): listas/unidades/fuso, numeração e reabertura. Nova reabertura distinta bloqueada até protocolo; complementos da abertura existente preservam histórico na auditoria. Layout PDF proposto aguarda validação da coordenação; GPS físico/instalação em aparelhos não testados. Spark sujeito às cotas, não ilimitado.

Continuação: [handoffs/ATUAL.md](handoffs/ATUAL.md); escopo/dono: [BACKLOG.md](BACKLOG.md).
