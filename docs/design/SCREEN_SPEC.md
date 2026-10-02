# Especificação de telas

## Navegação
Celular: barra inferior com 5 itens (ícone + rótulo). Computador (≥ 900 px): barra lateral fixa de 220 px, conteúdo em duas colunas quando útil.

## Telas
- **Ninhos:** lista de cartões (código, ficha, praia/km, espécie, selo de acompanhamento) e "Novo ninho". Toque abre a ficha.
- **Mapa:** marcadores numerados (protótipo ilustrativo; Leaflet/OSM a integrar) e lista equivalente.
- **Ocorrências:** registro de subida sem desova. **Não cria ninho.**
- **Relatórios:** filtros (datas, critério: ocorrência/eclosão/abertura, praia, espécie, temporada), prévia, resumo, "Baixar PDF".
- **Cadastros:** projetos, temporadas, responsáveis, praias, espécies; no protótipo também a galeria de estados.

## Ficha do ninho (5 etapas, abas navegáveis em qualquer ordem)
1. Identificação e localização + "Capturar localização".
2. Ocorrência e tartaruga. **Condicional:** marcas, medidas, tumores, coleta e pesca só aparecem se "Tartaruga observada = Sim". Não observada não exige nada disso.
3. Manejo. Local original → sem campos extras. Cercado → campos de destino + nº do cercado. Outra área → destino sem nº do cercado. Localização original sempre preservada; atual e histórico visíveis.
4. Acompanhamento: "Adicionar visita", histórico cronológico, eventos (predação, maré, perda da marcação).
5. Eclosão e abertura. **Vazio ≠ zero.** I/T/P e histórico oficial são campos separados do selo de acompanhamento. Cálculos derivados: área reservada, sem fórmulas inventadas.

## Relatório A4 (proposta a validar pela equipe)
Pág. 1: identificação do projeto, período, critério, resumo, tabela resumida (poucas colunas). Págs. seguintes: fichas detalhadas e observações. Rodapé "Página X de Y". Dados incompletos aparecem como "—" e com aviso, nunca como 0.

## Estados
Carregamento, lista vazia, erro, GPS negado/indisponível, sem internet, pendente de sincronização, sincronizado, conflito, relatório incompleto: todos em `Cadastros` do protótipo.
