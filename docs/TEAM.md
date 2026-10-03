# Equipe e papéis

Divisão para evitar conflito de arquivos (execução sequencial, um dono por arquivo).

Em 02/10/2026, o usuário autorizou o Codex a assumir também a implementação após esgotar a cota do
OpenCode. A execução permanece sequencial, com escopos em `docs/tasks` e estado em `STATUS.md`.

| Papel | Ferramenta | Responsabilidade |
| --- | --- | --- |
| Visual (design) | Claude | Identidade visual, componentes, SVG, protótipo (já entregue em `docs/design/*` e `design-preview/*`) |
| Implementação e documentação (atual) | Codex | Estrutura, código, testes, documentação, PWA, Firebase, PDF |
| Revisão (domínio/dados/segurança/offline/relatório) | Codex | Revisão crítica antes/depois, cálculos, regras Firestore, sincronização, integridade dos dados |

## Procedimento de transferência

Quando outra ferramenta precisa agir:

1. Atualizar `docs/handoffs/ATUAL.md` com: origem/destino, objetivo, arquivos afetados, evidências (build/testes),
   riscos, próxima ação.
2. A ferramenta destino lê `AGENTS.md`, `docs/STATUS.md` e `docs/handoffs/ATUAL.md`, depois só os documentos
   pertinentes.
3. Após agir, a ferramenta atualiza o handoff e o `STATUS.md`.

## Regra de edição

Nunca dois agentes editando os mesmos arquivos na mesma cópia de trabalho. Um dono por tarefa, caminhos
exclusivos. "Ajuste rápido" não vira refatoração.
