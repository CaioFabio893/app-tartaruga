# Segurança

Acesso **negado por padrão**. A segurança está na validação por membro e por projeto, não em esconder
botões (`AGENTS.md`).

## Papéis

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

## Cadastro inicial da coordenação

Não existe auto-cadastro administrativo. Definir no `DEPLOY.md` (passos manuais no console ou script
administrativo seguro) quem recebe `coordenacao` no primeiro projeto. Nunca permitir que o formulário web crie
esse papel.

## Testes de segurança

Usar emulador do Firebase para testar: acesso negado sem membro, membro de outro projeto não vê dados,
tentativa de autoelevação de papel é rejeitada, botão escondido não substitui regra. Registrar resultados em
`TESTING.md`.