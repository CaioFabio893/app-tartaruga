# Handoff para o OpenCode

## Arquivos
`docs/design/*.md` e `design-preview/{index.html,styles.css,app.js}`. Abra `index.html` direto no navegador.

## Fazer
1. Copiar os tokens de `styles.css` (`:root`) para o CSS global do Vite.
2. Converter em componentes TS reutilizáveis: `Button`, `Field`, `Select`, `Card`, `Tabs`, `StatusBadge`, `Message`, `DataTable`, `Icon` (sprite), `StepForm`.
3. Manter as rotas: ninhos, mapa, ocorrencias, relatorios, cadastros, ficha/:id.
4. Respeitar condicionais e a regra vazio ≠ zero (usar `null`/`undefined`, não `0`).
5. Manter localização original imutável; guardar transferências como lista.

## Decisões
Fonte de sistema, ícones SVG locais, sem fotos, sem serviços externos. Layout A4 é proposta a validar.

## Ainda necessário (não feito aqui)
Firebase (login, dados, sincronização offline), captura real de GPS, mapa Leaflet/OSM, geração de PDF (ex.: `@media print`), fórmulas de eclosão, listas oficiais de códigos (espécie, I/T/P, categorias de tempo) e o manual de preenchimento, que não foi anexado: os campos seguem seu texto. Rótulos como "Categoria A" são provisórios.
