# P08 — Excel em colunas, organização anual e gestão

Dono: Codex, sequencial. Usuário autorizou todas as melhorias combinadas em 03/10/2026, com Excel contendo um ninho por coluna, números na primeira linha e informações abaixo. PDF P07 permanece completo.

## Escopo

`src/App.tsx`, `src/features/{mapa,treino,gestao}/*`, `src/report/{xlsx,relatorio,apresentacao,pdf}.ts`, `src/{app,data,domain,services}/gestao*.ts`, `src/styles/interface.css`, `firestore.rules`, `firestore.indexes.json`, `package.json`, `package-lock.json`, `.gitignore`; testes pertinentes em `tests/{report,gestao,security,nuvem}/`, amostra fictícia `output/xlsx/`, intermediários ignorados `tmp/xlsx/`. Docs afetados: DATA_MODEL/SECURITY/OFFLINE/REPORT_SPEC/DECISIONS/TESTING/DEPLOY/README e registros obrigatórios STATUS/BACKLOG/CHANGELOG/handoff/esta tarefa. Ler existentes antes de editar.

## Entrega pretendida

Excel `.xlsx` seguro e integral; ano explicitamente escolhido pela equipe, número anual separado de números científicos e UUID, reserva transacional por ano. Mapa/lista filtrados por ano (atual ao abrir); rótulo do número anual. Previsão informada pela equipe e alerta configurável, sem prazo/fórmula científica presumida. Gestão de armazenamento com origem/limite da medição explícitos. Exclusão somente coordenação, online/sincronizada, com PDF e JSON de backup e confirmação do escopo; não excluir fichas reais nesta execução. Metadados próprios auditados, sem alterar localização/datas/contagens científicas. Preservar visual e limites Spark.

## Dúvidas e limites

Sem regra confirmada de previsão automática: não calcular prazo por espécie. Ano de organização explicitamente informado evita inferir ano quando postura desconhecida e preserva vínculo quando abertura ocorre em outro ano. Uso exato da quota Firestore não está disponível no SDK cliente: não apresentar estimativa do navegador como uso da nuvem. Conta atual é campo; não promover a coordenação no cliente para liberar exclusão. Dúvidas/procedimento rastreados em DECISIONS.

## Validação

Testes de conteúdo XLSX/zeros/null/formulas/históricos, ano/número/concorrência/permissões, alerta e exclusão; emulador demo, tipos/build/auditoria de dependências. Conferência independente do XLSX e interface. Publicar somente após checks, enviar origin/master e registrar resultados reais. Próximos pontos de revisão ao usuário no final.

## Resultado técnico (03/10/2026)
Implementados XLSX em colunas, metadados anuais/reserva transacional/auditoria, seleção de ano no mapa/lista, previsão informada e aviso no app aberto, medição manual da quota e retenção definitiva protegida para coordenação. Nenhuma ficha real alterada/excluída; conta real preservada como campo. Visual Claude preservado.

Arquivos: App; mapa; novo formulário/painel em features/gestao; app/data/domain gestao*, data/gestao-exclusao; report/xlsx/relatorio/pdf; CSS, regras, dependência/lock/ignore; testes gestao/security/report; amostra XLSX fictícia e docs afetados. CSV/domínio científico não foram refatorados.

Validação final: `npx vitest run --maxWorkers=2` com FIRESTORE_EMULATOR_HOST loopback: 212 passaram/1 opt-in real ignorado (26 arquivos). `npx tsc --noEmit`, `npx vite build`, `npm audit` e `git diff --check` passaram; audit zero. Ver TESTING para reprodução da amostra e leitor independente: 364 rótulos/valores integrais, 5 colunas numeradas, zero real e ausência explicada, sem fórmulas; Artifact Tool import/inspect passou, render PNG indisponível (exit 1), não afirmar revisão visual no Excel. Exportador dividido em chunk local ≈7,69 kB gzip, sem biblioteca de autoria pesada no app.

Deploy `firebase deploy --only firestore:rules,hosting --project monitoramento-de-tartarugas --account SUA_CONTA_AUTORIZADA --non-interactive` passou; regras compiladas/publicadas e Hosting finalizado. HTTP página/bundle 200, `/assets/index-CiUrIPWV.js` corresponde ao build final. Não configura Blaze/serviços adicionais. GitHub/checagem final da interface registrados abaixo após confirmação.

Limitações/revisão: fichas antigas precisam de ano/número explícito em Sem ano definido. Previsão não é cálculo por espécie nem notificação em segundo plano. Uso da nuvem depende de medição manual da coordenação. Adriano campo não exclui nem informa quota; provisionamento administrativo é pergunta D-025. Download não comprova preservação: exigir arquivos conferidos e confirmação humana; retenção irreversível sem restauração automática, auditoria/reservas continuam consumindo espaço. Alteração após backup bloqueia exclusão; interrupção entre ninhos pode resultar em remoção parcial, com recibos por ninho e nova preparação obrigatória. Nenhuma prova de exclusão/escrita P08 em produção.

Interface: build final local com Firebase real autenticou e exibiu prévia confirmada de 1 ninho; Excel baixado em Downloads (6.686 bytes, modificação da sessão). Mapa em 2026 mostrou 0 e aviso de 1 sem ano; escolha Sem ano definido apresentou a ficha e o mapa-base, sem atribuir ano/número automaticamente. Não validar numeração real por escrita: concorrência e reservas foram provadas somente no emulador.

Painel com conta campo mostrou uso desconhecido e exclusão restrita à coordenação, sem erro novo no fluxo final. Falha inicial da prévia local: build foi substituído durante login e o chunk antigo não estava mais no dist; reload após build final resolveu. Não repetir a tentativa antiga nem confundir essa falha local com erro da publicação.
