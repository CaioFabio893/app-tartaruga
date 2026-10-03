# P04 — mapa, GPS e relatório legível

Dono: Codex, sequencial. Pedido do usuário: mapa geográfico, casco em cm, GPS próprio na transferência, busca de leitura mais precisa e relatório de todos os ninhos com todos os campos compreensíveis.

Escopo antes de editar: src/features/{mapa,treino}/*, src/services/gps.ts, src/report/*, src/App.tsx, src/styles/interface.css, src/domain/consultas.ts (somente opção técnica todos os ninhos), src/data/nuvem.ts (consulta dessa opção), src/types/* (Leaflet), tests/{services,report,nuvem}/*; docs afetados/STATUS/BACKLOG/CHANGELOG/handoff/DECISIONS, tmp/pdfs e output/pdf para provas fictícias. Sem mudar regras/perfis/fontes científicas/fórmulas ou dados reais. Hosting autorizado pela continuação da entrega.

Aceite: mapa-base com atribuição, fallback explícito, GPS cancelável com melhor leitura sem promessa de precisão, metadados de destino preservados, modo todos inclusive sem datas, período inclusivo mantido, campos completos com rótulos/unidades/motivos claros, nenhuma serialização técnica no PDF, páginas A4 renderizadas e verificadas; testes/tipos/build reais registrados.

Estado: concluída e publicada em 03/10/2026.

Arquivos alterados: App, features/mapa/MapaCoordenadas, features/treino/Formularios, services/gps, report/{apresentacao,pdf,relatorio}, domain/consultas (opção todos), data/nuvem (consulta completa e contagem de filtros), types/leaflet, styles/interface; tests/services/gps, tests/report/p04, tests/nuvem/nuvem; docs afetados; amostra fictícia output/pdf/relatorio-p04-demonstracao.pdf.

Resultados: npx vitest run com FIRESTORE_EMULATOR_HOST=127.0.0.1:8080: 195 passaram/1 opt-in produção ignorado, 19 arquivos. npx tsc --noEmit e npx vite build passaram. firebase deploy --only hosting com conta/projeto de DEPLOY passou. Consulta de todos entre clientes/filtros/datas ausentes verificada no emulador; leitura pública confirmou 1 ninho atualmente cadastrado. Nenhum registro real alterado.

PDF fictício: 19 páginas A4 (cinco ninhos, observação de teste extensa); renderizadas com Poppler e inspecionadas. Texto extraído com pypdf, sem objetos/null. Poppler advertiu fontes de substituição não utilizadas, mas imagens geradas foram conferidas. PDF público baixado: cinco páginas, autoria Adriano, sem UID bruto ou destino JSON/null; transferência renderizada e conferida. Navegador público confirmou mapa com ruas/praia, atribuição, escala, botão GPS de destino e prévia confirmada; nenhum erro de console capturado. Formulário cancelado sem salvar.

Decisões: D-022. Sete casas na consulta/PDF não aumentam precisão física; insumos preservados. GPS observa até 30 s, conserva melhor margem de erro, limpa watcher no término/cancelamento; meta técnica de busca 5 m não é garantia/protocolo científico. Destino digitado depois limpa metadados do GPS. Lista usa praia/trecho da posição atual sem misturar origem.

Limites/próximo passo: testar GPS em aparelho ao ar livre e conferir fichas com equipe. Margem de erro real pode permanecer alta (ex.: 96 m); não prometer localização exata dos ovos. Base OpenStreetMap online sujeita à disponibilidade/política, sem cache em massa. Unidade cm confirmada pelo usuário, sem converter registros antigos. Ciência/versão v2, regras e dados existentes preservados.
