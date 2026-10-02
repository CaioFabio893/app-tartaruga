# AGENTS.md — Monitoramento de Ninhos de Tartarugas

Regras comuns a **qualquer** agente ou ferramenta que editar este repositório (OpenCode, Codex, outros).
Se uma regra aqui conflitar com um documento de `docs/`, vale o mais específico e recente; se ainda assim
houver conflito real, registre em `docs/DECISIONS.md` e resolva explicitamente. Este arquivo aponta o caminho;
não substitui os documentos.

## Ordem mínima de leitura (leia só isto para começar)

1. `AGENTS.md` (este arquivo)
2. `docs/STATUS.md` — estado real, tarefa ativa, bloqueios
3. `docs/handoffs/ATUAL.md` — se veio de outra ferramenta
4. `docs/tasks/<ID-DA-TAREFA>.md` — se já existe
5. O **índice** `docs/INDEX.md`, e só então o(s) documento(s) do escopo

Não leia `docs/` inteiro, nem todo o histórico, nem o PDF do manual a cada tarefa. O manual já foi
convertido em `docs/FIELD_DICTIONARY.md` e `docs/DOMAIN_RULES.md`; volte ao PDF **apenas** para conferir
uma dúvida específica (veja a tabela de origem em FIELD_DICTIONARY).

## Limites de edição

- Cada tarefa tem **um dono de edição**. Verifique `docs/BACKLOG.md` antes de começar.
- Só edite caminhos do escopo da tarefa. Se precisar sair do escopo: registre em `docs/STATUS.md` e pare.
- **Nunca** dois agentes alterando os mesmos arquivos na mesma cópia de trabalho. Nesta fase:
  execução **sequencial**, uma tarefa ativa por vez.
- Não apague trabalho existente sem registrar o motivo em `docs/DECISIONS.md`.
- Substitua informação obsoleta em vez de acumular histórico dentro do mesmo arquivo.

## Regras de domínio (não negociáveis)

- **Fonte de verdade científica** = `docs/DOMAIN_RULES.md` + `docs/FIELD_DICTIONARY.md`, com página de origem.
  Rótulos provisórios do design, placeholders e nomes de campos do protótipo **não** são fonte de domínio.
- **Não invente** códigos, fórmulas, unidades, condições ou listas de espécies. Dúvida = `DÚVIDA` rastreável
  com a pergunta para a coordenação, não uma escolha silenciosa.
- **Vazio ≠ zero ≠ indeterminado ≠ não aplicável.** Use `null`/`undefined`. Nunca use `0` como valor padrão de
  campo não observado.
- **Cálculos são derivados e versionados**, nunca digitados livremente. Preserve sempre o valor de origem.
- Uma **ocorrência sem desova não cria ninho**.
- **Localização original é imutável.** Transferência é registro próprio; a posição atual é derivada do histórico.
- **ID técnico ≠ número de registro ≠ número do cercado.** O código interno do ninho **não** é o `N_NINHO` do
  manual (que se refere ao cercado). Números oficiais preservam zeros iniciais → texto, não número.
- Identificadores gerados localmente (UUID) para permitir cadastro offline; **não prometa** sequência global
  de números oficiais offline sem resolver concorrência (ver `docs/DATA_MODEL.md`).

## Limites de produto (o que não existe neste projeto)

Sem fotos, sem câmera, sem upload, sem `FOTOGRAFIA`, sem Firebase Storage, sem Cloud Functions, sem Cloud
Run, sem App Hosting, **sem Blaze** e sem nada que exija faturamento. Sem IA dentro do aplicativo (as IAs são
usadas só no desenvolvimento). Sem biblioteca paga e sem fonte remota obrigatória.
Plano alvo: **Firestore Standard + Firebase Hosting Spark**.
PDF gerado **no cliente** (`pdf-lib`). Exportar JSON/CSV para cópia manual dos dados.
Se uma tarefa exigir violar isso: pare e registre em `docs/DECISIONS.md`.

## Segurança (não relaxe regra para fazer teste passar)

- Acesso **negado por padrão**; só membros autorizados do projeto leem/escrevem.
- Perfis: consulta, campo, coordenação. Cliente **não** autoatribui papel administrativo.
- Esconder botão **não** substitui regra do Firestore. Regras são testáveis no emulador.
- IDs de documento do Firestore **não** são segredos: a segurança está na validação por membro e por projeto.

## Offline

- Cache da interface e persistência de dados são coisas **distintas**.
- Gravação aceita no cache local **não** significa "sincronizado". Só diga sincronizado após confirmar no servidor.
- Relatório definitivo exige online + sincronização confirmada; exportação offline é marcada como **parcial**.
- Conflito entre aparelhos: política explícita em `docs/OFFLINE.md` (last-write-wins **não** é padrão automático).

## Validação

- Mudou código → rode build e checagem de tipos. Registre o resultado **real** (passou/falhou, comando).
- Domínio, filtros, permissões e sincronização exigem **teste de comportamento**. Não escreva teste que só
  repete a implementação nem teste que só verifica CSS.
- Não afirme validação de Firebase real se você usou mock ou emulador. Diga qual foi.
- Falhou? Diagnostique e corrija. **Não repita a mesma tentativa sem evidência nova.** Após duas tentativas
  iguais sem progresso: diagnóstico curto e, se for preciso, encaminhamento ao Codex em `docs/handoffs/ATUAL.md`.

## Documentação (escreva o mínimo útil)

- Registre o que permite **reproduzir ou continuar**: objetivo, arquivos alterados, decisões, testes,
  limitações, próximo passo. **Não** registre pensamentos, comandos triviais nem logs longos.
- Não duplique a mesma regra em vários documentos; use link.
- Ao terminar uma tarefa: `docs/tasks/<ID>.md`, e atualize **somente** os docs afetados + `docs/STATUS.md`
  + `docs/BACKLOG.md` + `docs/CHANGELOG.md`.
- Se outra ferramenta precisa agir: transferência curta em `docs/handoffs/ATUAL.md`
  (origem/destino, objetivo, arquivos, evidências, riscos, próxima ação).

## Papéis

`docs/TEAM.md` define a divisão (Gemini visual · OpenCode implementação e documentação · Codex revisão de
domínio/dados/segurança/offline/relatório). Não Widening escopo: "ajuste rápido" não vira refatoração.