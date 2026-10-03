# Segurança

Acesso **negado por padrão**. A segurança está na validação por membro e por projeto, não em esconder
botões (`AGENTS.md`).

## Estado implementado

`firestore.rules` nega por padrão. Membro ativo exige uid/projeto_id/papel conhecidos; leituras isoladas. Coordenação pode criar/atualizar somente **outros** membros campo/consulta com schema/auditoria/versão; não cria coordenação, não promove a si mesma e não apaga membros. Projetos não podem ser listados/criados pelo cliente.

P03 libera escrita de campo somente por transação com operação nova e imutável, autorizada por membro campo/coordenacao. Cada origem/projeção/reserva exige vínculo com a operação atual do projeto, pré-imagem e caminho corretos. A operação confere autor do token, incremento da revisão e timestamp do servidor. Não reutilizar operação antiga, criar ninho sem CD, alterar origem, renumerar registro nem escrever projeção falsa. Contrato/evidências em [P03](tasks/P03-integracao-nuvem.md) e [D-019–D-021](DECISIONS.md).

Conta publicada única: adriano, papel campo. Testes de papéis adicionais pertencem somente ao emulador; nenhuma conta extra criada. A autoria é compartilhada entre aparelhos que usam essa conta. Dados sintéticos de prova real ficam em projeto lógico técnico separado, nunca nas fichas do projeto principal.

## Papéis alvo

| Papel | Leitura | Escrita | Administração |
| --- | --- | --- | --- |
| `consulta` | sim | não | não |
| `campo` | sim | ocorrências, ninhos, transferências, visitas, aberturas (seu projeto) | não |
| `coordenacao` | sim | tudo no projeto | gerencia membros, projetos, temporadas, praias; exclusão lógica |

Um usuário só acessa um projeto se existir `projetos/{projetoId}/membros/{uid}` com `ativo = true`.

## Regras do Firestore (princípios)

- Negar por padrão.
- Toda regra filtra por `projeto_id` (isolamento entre projetos).
- Só membros ativos leem/escrevem seu projeto.
- Papel administrativo (`coordenacao`) é necessário para criar/alterar membros e para exclusão lógica.
- Cliente **não** autoatribui papel. O primeiro membro com papel `coordenacao` precisa ser criado por
  procedimento administrativo confiável (fora do app cliente), documentado em `DEPLOY.md`.
- IDs de documento **não** são segredos.
- Validação de domínio é feita no app (`domain/*`), mas as regras devem impedir gravação cruzada entre
  projetos e operações não autorizadas.
- Projeções de consulta em `projetos/{projetoId}/consultas/{ninhoId}` seguem a **mesma** checagem de membro
  ativo do projeto: o usuário não lê projeção de outro projeto, mesmo sabendo o `projetoId`. A projeção não
  amplia o que o papel `consulta` já pode ver; só torna a leitura do relatório indexada.

## Cadastro inicial da coordenação

Não existe auto-cadastro administrativo. Definir no `DEPLOY.md` (passos manuais no console ou script
administrativo seguro) quem recebe `coordenacao` no primeiro projeto. Nunca permitir que o formulário web crie
esse papel.

## Testes de segurança

Usar emulador do Firebase para testar: acesso negado sem membro, membro de outro projeto não vê dados,
tentativa de autoelevação de papel é rejeitada, botão escondido não substitui regra, e projeção de consulta
não vaza entre projetos. Registrar resultados em `TESTING.md`.