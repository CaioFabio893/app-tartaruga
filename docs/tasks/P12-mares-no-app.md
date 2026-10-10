# P12 — marés de Recife dentro do aplicativo

03/10/2026. Dono Codex, execução sequencial autorizada pelo usuário. Concluída e publicada.

Escopo: `src/features/mares/*`, `src/domain/mares.ts`, `src/styles/mares.css`, `tests/mares.test.ts`, `scripts/extrair-mares.py`, `docs/references/mares/*`, PRODUCT/DECISIONS/STATUS/BACKLOG/CHANGELOG e esta tarefa. Nenhuma ficha ou regra Firebase alterada.

Objetivo: consulta direta, poucos controles, hoje em destaque, navegação diária e mensal no ano completo. Usar tábua oficial Recife 2026, preservar fonte/horários/alturas, indicar estação/fuso. Sem cálculo de previsão, sem API paga ou dependência de rede após cache da interface.

Fonte localizada na lista CHM pelo navegador: `https://www.marinha.mil.br/chm/sites/www.marinha.mil.br.chm/files/dados_de_mare/24%20-%20PORTO%20DO%20RECIFE%20-%2082%20-%2084.pdf`. PDF 3 páginas, cabeçalho 2026, UTC -03.0. Original/hash/reprodução em [fonte](../references/mares/README.md).

Entrega: hoje e próxima maré em destaque; horários/alturas em cartões alta/baixa; três botões diários, seletor de data, ano inteiro por mês recolhido. Escolher dia mensal fecha a seleção e leva aos cartões. Fonte/notas recolhidas. D-028 substitui consulta externa P11; não calcula novas previsões, não depende de Firestore ou API.

Validação:
- Python empacotado + `scripts/extrair-mares.py`: 365 datas/1.411 eventos; invariantes de calendário/ordem/horas/quantidade e comparação independente de todos os pares com o texto completo das 3 páginas passaram. Página 84 renderizada e conferida visualmente; amostras 12/01 e 03/10 conferidas/testadas.
- `npm test -- --maxWorkers=2`: 196 passaram/23 ignorados, 28 arquivos; sem emulador ou prova Firebase real. Novos testes: dados anuais, amostras fonte, fuso Recife, evento amanhã, evento no instante exato, limites/ano ausente.
- `npm run typecheck` e `npm run build`: passaram; repetidos após fechamento automático da consulta mensal. `git diff --check`: passou, avisos LF/CRLF apenas.
- Navegador integrado em treino local: hoje, próximo dia 04/10 com 4 horários conferidos, volta a hoje, dezembro/31 com botão próximo desabilitado; após ajuste, janeiro/01 com anterior desabilitado, fechamento da seleção e retorno aos cartões. Nenhuma ficha escrita nesta tarefa. Duas buscas por label Mês falharam na ferramenta; combobox por papel resolveu. HMR reiniciou tela em Relatórios; estado observado antes de retomar.
- Viewport 390×844: conteúdo/clientWidth 375/375 (barra do navegador), sem overflow; cartões, fonte/notas recolhidas e navegação inferior conferidos por screenshot. Override removido ao terminar.
- Bundle Mares-PoiXzBSj.js (54,47 kB; 10,46 kB gzip) contém ano inteiro; CSS/data incluídos explicitamente no manifesto do service worker. Rede offline física e instalação no aparelho não testadas; disponibilidade offline depende do cache da versão atual instalado.

Limites: edição 2026 somente, estação Recife (não Suape/todo litoral). Próxima maré depende do relógio do aparelho. Não mede maré atual nem estima risco para ninhos. 2027 exige incorporar/conferir nova fonte; fora do ano mostra ausência e mantém seleção de 2026. Layout ainda cabe à equipe conferir no aparelho real.

Publicação: `firebase deploy --only hosting --project monitoramento-de-tartarugas --account SUA_CONTA_AUTORIZADA --non-interactive` passou com conta proprietária existente. HTTP 200 da raiz, entrada index-hcNC7nZ3.js referenciada, módulo Mares-PoiXzBSj.js com 31/12/2026 e service worker incluindo módulo conferidos. Regras/fichas/papéis preservados. Não validado login/interface autenticada pública nesta tarefa.
