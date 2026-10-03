# P10 — Apresentação do repositório para recrutadores

Dono: OpenCode. Data: 03/10/2026. Pedido do usuário: subir/atualizar o projeto no GitHub e deixá-lo
apresentável para recrutadores. Execução sequencial; nenhum código de domínio, regra ou dado real alterado.

## Escopo

- `README.md`: reestruturado com apresentação (visão geral, telas, destaques técnicos, arquitetura Mermaid,
  stack, execução local, testes, segurança e custo) e conteúdo técnico interno preservado por resumo + link.
- `LICENSE` (MIT), `.github/workflows/ci.yml` (CI: tipos, build e testes).
- `docs/images/preview-*.png`: capturas do protótipo `design-preview/` com dados fictícios.
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

- Screenshots são do protótipo, não do app autenticado; legenda deixa isso explícito. Capturas refeitas em
  viewport desktop 1280px (2× para nitidez) e mobile 390px, página inteira onde havia corte. A navegação
  mobile do protótipo tem overflow (`nav a` sem `min-width:0`); a captura corrige isso só na renderização,
  sem alterar `design-preview/`.
- CI roda sem emulador: não valida regras do Firestore. Endurecer com emulador é melhoria futura.
- Metadados do GitHub (descrição, site e tópicos) exigem token/gh CLI; documentados ao usuário para
  preenchimento manual.
