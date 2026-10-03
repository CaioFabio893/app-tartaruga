# P10 — Apresentação do repositório para recrutadores

Dono: OpenCode. Data: 03/10/2026. Pedido do usuário: subir/atualizar o projeto no GitHub e deixá-lo
apresentável para recrutadores. Execução sequencial; nenhum código de domínio, regra ou dado real alterado.

## Escopo

- `README.md`: reestruturado com apresentação (visão geral, telas, destaques técnicos, arquitetura Mermaid,
  stack, execução local, testes, segurança e custo) e conteúdo técnico interno preservado por resumo + link.
- `LICENSE` (MIT), `.github/workflows/ci.yml` (CI: tipos, build e testes).
- `docs/images/app-*.png`: capturas do **aplicativo real** em modo de treino (build de produção com
  `VITE_PROJETO_ID` vazio), dados fictícios, desktop 1360px.
- `docs/{STATUS,BACKLOG,CHANGELOG}.md` e esta tarefa.

Fora do escopo: alterar `src/`, `tests/`, `firestore.rules`, dados, regras científicas ou credenciais.

## Decisões

- README somente em português (escolha do usuário).
- Licença MIT (escolha do usuário), titular `Caio Fábio (CaioFabio893)` — ajustável pelo autor.
- Screenshots geradas do protótipo estático (`design-preview/`) via Chrome headless, rotuladas como fictícias.
- Badge de testes é estático (213) enquanto não há execução com emulador no CI.

## Validação real

- `npx vitest run` sem emulador: 191 passaram / 23 ignorados (214 no total), exit 0.
- `npx tsc --noEmit`: OK. `npm run build`: OK `dist/`.
- `npm ci --dry-run`: lockfile consistente.
- Screenshots conferidas visualmente (ninhos, ficha, relatórios, mobile).

## Limitações e próximo passo

- Screenshots são do app real em modo de treino (não do fluxo autenticado); a legenda deixa isso
  explícito. Capturadas em desktop 1360px, página inteira, sem larguras percentuais no README (imagens
  empilhadas em largura natural) para evitar qualquer distorção. As capturas do protótipo foram substituídas.
- CI roda sem emulador: não valida regras do Firestore. Endurecer com emulador é melhoria futura.
- Metadados do GitHub (descrição, site e tópicos) exigem token/gh CLI; documentados ao usuário para
  preenchimento manual.
