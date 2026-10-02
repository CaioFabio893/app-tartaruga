# Revisão da entrega visual do Claude

Data: 02/10/2026. Origem: files.zip fornecido pelo usuário.
Escopo: inspeção dos seis arquivos, documentos e código. Não foi realizada verificação visual em navegador nesta revisão.

## Resultado

Base visual aproveitável para a implementação. Não é aplicativo funcional nem especificação completa do domínio. Arquivos originais preservados em design-preview e docs/design.

## Entrega

- HTML/CSS/JavaScript simples, sem dependências externas e sem fotos.
- Paleta, fontes de sistema, navegação responsiva, cinco telas, ficha em cinco etapas e ícones SVG para a navegação.
- Dados fictícios, condicionais de animal observado e transferência, galeria de estados e proposta de resumo A4.
- Três documentos de design e integração.

## Correções para OpenCode

1. Novo ninho apenas abre um alerta; não abre a ficha vazia. Implementar navegação e formulário conforme contrato.
2. Fichas não carregam o registro selecionado: todos os campos ficam vazios e certos textos são fixos. Usar dados vinculados ao ID.
3. Trocar de etapa recria os campos e perde os valores digitados. Manter estado de formulário independente da renderização.
4. Botões data-nao dentro das etapas criadas por m() ficam sem handler depois de trocar de aba. Usar delegação de eventos ou registrar eventos a cada renderização. GPS e histórico são afetados.
5. Filtros do relatório não alteram a prévia. A proposta A4 mostra apenas dois dos três registros e o resumo de valores ausentes é inconsistente com os dados fictícios. Usar uma única seleção de registros para resumo, prévia e PDF.
6. Não existe download PDF, CSS de impressão ou páginas detalhadas. Usar geração no cliente com pdf-lib conforme plano; não tratar window.print como exportação PDF já implementada.
7. Mapa é uma ilustração sem coordenadas reais e sem a lista equivalente prometida. Adicionar lista acessível e integração separada de mapa/GPS.
8. Tipos de ocorrência, espécies e categorias de transferência são placeholders. Substituir pelos códigos do manual. Hist_ninho é texto livre no protótipo: usar seleção oficial mais observações separadas. Tumores deve contemplar indeterminado.
9. Número de cercado não deve ser input number se precisar preservar zeros/códigos; usar o tipo definido no contrato de dados. Confirmar unidades de biometria no protocolo de referência.
10. Completar ícones prometidos para tartaruga, transferência, visita, calendário, equipe e sincronização; hoje existem apenas cinco símbolos de navegação.
11. Completar acessibilidade das abas: relação tab/panel, navegação de teclado e foco ao mudar de tela. Verificar contraste, tamanho de toque, comportamento em celular e ausência de cortes em revisão visual posterior.
12. As mensagens offline/sincronização são exemplos da galeria, não funcionalidades. Não apresentá-las como evidência de persistência.

## Limites

Sem Firebase, autenticação, persistência, PWA instalável, GPS real, sincronização ou cálculos. O Claude informou que não recebeu o manual. Consultar o manual/dicionário do projeto para regras científicas; não usar placeholders visuais como fonte de domínio.

## Próximo passo

Executar Prompt 2 de PROMPTS-DO-PROJETO.md no OpenCode. Ler este documento e preservar a identidade visual, criando primeiro contratos/documentação e base Vite. Depois integrar o protótipo por etapas, seguindo os critérios de aceite.
