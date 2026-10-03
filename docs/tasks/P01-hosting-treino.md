# P01 — Publicação do treino no Hosting

Dono: Codex. Usuário pediu colocar o app online em 02/10/2026; autoriza publicação estática gratuita. Não autoriza tornar treino dado oficial nem alterar outro site sem escolha do destino.

Escopo: firebase.json (Hosting), .firebaserc se houver destino confirmado; docs/DEPLOY.md, docs/FIREBASE.md, docs/handoffs/ATUAL.md, docs/DECISIONS.md e registros STATUS/BACKLOG/CHANGELOG. Sem alteração de domínio/UI ou liberação de escritas Firestore.

Objetivo: publicar dist no Firebase Hosting Spark, excluindo source maps e arquivos locais; SPA, cache adequado ao SW. Destino confirmado pela aba do usuário: monitoramento-de-tartarugas, plano Spark. Conta correspondente ainda precisa concluir autorização CLI; não usar treino-louise.

Aceite: testes/tipos/build, destino confirmado sem faturamento, deploy somente Hosting, URL HTTPS. Dados locais por navegador/origem e relatórios de treino/parciais. Estado: publicado; confirmação de download no navegador integrado pendente (limite abaixo).

Resultado: login adicional confirmado via login:list/projects:list apesar de encerramento anormal da CLI após mensagem de sucesso; autenticação válida sem copiar tokens. Deploy --only hosting no projeto monitoramento-de-tartarugas concluído (13 arquivos). URL https://monitoramento-de-tartarugas.web.app aberta: prévia 5 ninhos, cache instalado e sem erros capturados de página. HTTP raiz/sw/rota SPA verificados; nenhum banco/regras/índices publicado. Testes/tipos/build da preparação passaram (165/7 ignorados).

Limite de verificação: API de download do navegador integrado expirou; tentativa seguinte com espera limitada/ação concorrente também expirou, sem erros de página. Não afirmar PDF baixado online ou offline online testado; downloads/cache offline já passaram no Edge local em TESTING.md. Conferir download pelo navegador habitual. Rodapé legado ainda diz nenhuma publicação (texto da demo), correção visual fora deste escopo; não muda modo de treino.

Login interativo iniciado com --interactive (CLI detecta agente e presume modo não interativo sem essa opção). Aba OAuth aberta na mesma sessão do projeto; usuário deve concluir consentimento. Não copiar tokens nem códigos para chat/docs. Nenhum deploy realizado.

Usuário informou que deseja outra conta Google e pediu ajuda para configurar. Login adicional precisa da escolha/autorização do usuário no Google. CLI automatizada recusou login:add como não interativo; terminal interativo aberto para concluir sem acessar senha/token. Hosting preparado; npx vitest run: 165 passaram/7 ignorados sem emulador; npx tsc --noEmit e npx vite build passaram. Nenhum deploy efetuado.
