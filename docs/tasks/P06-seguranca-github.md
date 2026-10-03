# P06 — Segurança, README e GitHub

Dono: Codex, execução sequencial. Autorização: usuário pediu revisão de segurança, `.gitignore`, README detalhado e envio ao GitHub em 03/10/2026.

## Escopo

Revisar código, regras, dependências e histórico Git sem alterar dados reais. Editar `.gitignore`, `README.md`, `firebase.json`, `design-preview/app.js`, `src/report/relatorio.ts`, testes de regressão pertinentes em `tests/security/`, `docs/reviews/P06-seguranca.md`, `docs/SECURITY.md`, `docs/DEPLOY.md` e registros STATUS/BACKLOG/CHANGELOG/handoff desta tarefa. Correções limitadas aos riscos encontrados; preservar visual e domínio. Publicar cabeçalhos/correção CSV no Hosting existente e enviar histórico revisado ao origin, sem force push.

Ampliação explícita autorizada pelo usuário nesta sessão: “Sim, corrigir antes de enviar”, para incluir `src/report/relatorio.ts` no tratamento de listas CSV. Nenhum código desse caminho foi editado antes da autorização.

## Aceite

Sem credenciais privadas ou dados reais enviados; README corresponde à implementação atual. Revisão registra riscos residuais e limites. Auditoria de dependências, testes (incluindo regras no emulador), tipos e build com resultados reais. Push confirmado pelo remoto.

## Entrega e evidências

Revisão em [P06-seguranca](../reviews/P06-seguranca.md). Alterados `.gitignore`, `README.md`, `firebase.json`, `design-preview/app.js`, `src/report/relatorio.ts`, dois testes em `tests/security/` e documentos do escopo. README substitui descrição obsoleta de treino por funcionalidades/arquitetura/configuração/desenvolvimento reais. Nenhuma ficha, senha, regra científica ou papel real alterado.

- `npm audit --json`: zero vulnerabilidades reportadas.
- `$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'; npx vitest run`: final 201 passaram/1 prova de produção opt-in ignorada, 21 arquivos. Emulador/fake-indexeddb; não é nova prova de escrita em produção.
- `npx tsc --noEmit`, `npx vite build` e `git diff --check`: passaram. Avisos CRLF do Git não são falhas.
- Histórico anterior pesquisado por padrões de senha/chaves/tokens: nenhum segredo identificado nos padrões. Env/credenciais/PDFs reais não rastreados; demonstrações fictícias mantidas. `.env.example` não ignorado; env/credenciais/exportações/backups/intermediários ignorados.
- `firebase deploy --only hosting --project monitoramento-de-tartarugas --account SUA_CONTA_AUTORIZADA --non-interactive`: passou na conta autorizada da sessão. HTTP 200 do site e bundle atual; CSP/frame DENY/nosniff/Permissions/Referrer confirmados por resposta HTTP. Cache imutável dos assets preservado. Sem deploy de regras ou escrita de dados reais.

Entrega Git: origin `https://github.com/CaioFabio893/app-tartaruga.git`, branch `master`, sem force push. Verificar `git ls-remote origin refs/heads/master` contra HEAD antes de entregar; hash disponível no histórico Git, sem duplicação circular dentro do próprio commit.

## Limitações e próximo passo

Senha simples compartilhada, cópia local após logout, App Check ausente e cotas continuam riscos residuais, explicitados na revisão/SECURITY. CSP parcial. Fortalecer senha administrativamente, mantendo segredo; conferir GPS/offline/PDF em campo. Revisão não é pentest nem garantia de segurança absoluta.
