# E08 — GPS e mapa de coordenadas no treino

Dono: Codex. Continuação autorizada pelo usuário. Executar após fluxo local E05–E07.

Escopo: `src/services/gps.ts`, `src/features/treino/Formularios.tsx`, `src/features/mapa/*`, `src/App.tsx`, `src/styles/interface.css`, `tests/services/gps.test.ts`, docs afetados. Sem usar localização real do usuário em testes; usar simulação do navegador.

Objetivo: captura somente por botão, precisão/instante/datum WGS84 preservados, entrada manual alternativa, permissão negada/timeout tratados sem impedir formulário. Não sobrescrever localização de ninho existente. Mapa esquemático de coordenadas com lista equivalente, SVG local sem tiles ou serviço externo; explicar ausência de mapa-base e conversão entre datums.

Aceite: latitude/longitude zero são valores, precisão zero preservada, coordenadas inválidas recusadas, erro/timeout libera interface, captura preenche somente rascunho da ocorrência. Mapa não serve para navegação e não presume mapas offline oficiais. Estado: concluída local; validação física pendente. Evidências em ../TESTING.md.
Entrega local concluída: GPS com cancelamento/timeout, coordenadas inválidas/negação tratados, WGS84 conforme especificação W3C; 4 testes passaram. Edge com geolocalização simulada (0,0, precisão 2 m) preservou zeros; ninho salvo apareceu no esquema e abriu pelo teclado. Nenhuma localização real do usuário foi capturada nos testes.
