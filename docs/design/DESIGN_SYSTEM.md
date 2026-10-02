# Design System — Monitoramento de Ninhos

**Direção: "Maré e Areia".** Azul-petróleo (mar profundo) sobre areia clara, com um laranja-queimado de ação. Contraste alto para sol forte; estados sempre com ícone + texto.

## Cores (tokens em `design-preview/styles.css`)
| Token | HEX | Função |
|---|---|---|
| --mar-900 | #0B3C49 | Navegação, títulos, aba ativa |
| --mar-700 | #0E5A6B | Bordas de ação secundária, info |
| --mar-100 | #DCEFF2 | Fundo do mapa |
| --areia-50 / 100 | #FBF7EF / #F4EBDD | Fundo / cabeçalho de tabela |
| --areia-300 | #D9C7A6 | Bordas de cartão |
| --tinta / --tinta-2 | #12313A / #4A5F66 | Texto / texto de apoio |
| --acao | #B33F0B | Botão principal (branco sobre ele ≈ 5,6:1) |
| --ok / --aviso / --erro | #1F6B3A / #8A5A00 / #A32020 | Estados (sempre com símbolo) |

Contrastes devem ser conferidos com ferramenta própria antes da publicação.

## Tipografia
Fonte de sistema (`system-ui`). Base 16 px; título de tela 24 px; seção 19 px; apoio 14 px. Rótulos em negrito acima do campo.

## Espaço, bordas, componentes
Escala 4/8/16/24 px. Raio 12 px (cartões, botões), 8 px (campos), pílula (abas e selos). Alvo de toque ≥ 44 px. Campos com borda de 2 px. Foco: contorno preto 3 px + halo branco.
Componentes: botão (`.btn`, `.prim`), campo, cartão, aba, selo de situação (`.selo`), mensagem (`.msg`), tabela rolável, folha A4.

## Ícones
SVG local, traço de 2 px, 24 px, `currentColor`: ninhos, mapa, ocorrências, relatórios, cadastros (sprite em `index.html`).

## Acessibilidade
Estado nunca só por cor (símbolo + texto). Foco visível. `prefers-reduced-motion` respeitado. Abas com `role="tab"` e `aria-selected`. Mapa precisa de alternativa em lista.
