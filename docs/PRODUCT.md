# Produto

## Usuários

| Papel | Quem é | O que faz |
| --- | --- | --- |
| `consulta` | pesquisador, gestor que só lê | vê listas, ficha e relatórios; não grava |
| `campo` | equipe de campo | registra ocorrência, visita, transferência, GPS, eclosão/abertura |
| `coordenacao` | coordenação do projeto | tudo de `campo` + cadastros, equipe/papéis, exportação e exclusão lógica |

Os papéis vêm do registro de membro no servidor. O cliente **não** se autoatribui papel
(`SECURITY.md`). Ninguém tem acesso a um projeto em que não está cadastrado.

## Escopo incluído

- Login por e-mail/senha; acesso por projeto.
- Cadastro de projetos, temporadas, responsáveis (membros), praias.
- Registro de ocorrência **com e sem desova**; só `CD` cria ninho.
- Ficha do ninho em 5 etapas: identificação/localização, ocorrência e tartaruga, manejo, acompanhamento
  (visitas), eclosão e abertura.
- Captura de GPS com precisão; digitação alternativa; lista equivalente ao mapa.
- Transferências com histórico; localização original imutável.
- Visitas com eventos.
- Eclosão e abertura com os campos do manual e cálculos derivados.
- Relatórios por período e critério, com PDF gerado no cliente e exportação JSON/CSV.
- PWA instalável, funciona sem internet com fila de escrita e indicação de pendência.

## Escopo excluído (decidido, não falta de tempo)

Sem fotos, sem câmera, sem upload, sem campo `FOTOGRAFIA`, sem Firebase Storage, sem Cloud Functions, sem
Cloud Run, sem App Hosting, **sem Blaze** e sem nada que exija faturamento. Sem IA dentro do aplicativo. Sem
biblioteca paga. Sem fonte remota obrigatória. Sem banco de imagens de mapas offline.

Motivo: plano **Spark** e uso por projeto social em praia, com equipe pequena e sem custo recorrente.

## Fluxo principal

1. Entrar com e-mail e senha; o app descobre em quais projetos o usuário é membro.
2. Escolher projeto e temporada.
3. Registrar a ocorrência na praia (`CD`, `ML`, `SD`, `ND`, `PI`) e capturar o GPS.
4. Se for `CD`, a ficha do ninho abre e pede manejo, tempor `I`/`T`/`P` e destino.
5. Ao longo do acompanhamento, registrar visitas.
6. Registrar eclosão e abertura; os cálculos aparecem preenchidos, com explicação quando vazios.
7. Gerar o relatório do período e baixar o PDF ou exportar JSON/CSV.

## Estados de tela obrigatórios

Carregando · lista vazia · erro · GPS negado · GPS indisponível · sem internet · alteração pendente de
sincronização · sincronizado confirmado · conflito entre aparelhos · relatório com dados incompletos.

Estado nunca é comunicado **só por cor**: sempre ícone + texto (`design/DESIGN_SYSTEM.md`).

## Proposta de layout, ainda não validada

O relatório A4 do protótipo é **proposta** a ser validada pela equipe com um exemplar; não há modelo oficial
de relatório no material de referência (`design/REVISAO-CLAUDE.md`, item 6). Enquanto não validado, a
interface deve marcar o layout como proposta.

## Regra de produto que vem do manual

Ocorrência sem desova **não cria ninho**: a tela de ocorrências é separada e não gera ficha
(`DOMAIN_RULES` §2.1). Fêmea morta na praia vai para o registro não reprodutivo (p. 2).