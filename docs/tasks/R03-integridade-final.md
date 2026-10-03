# R03 — Integridade dos avanços locais

Dono: Codex. Continuação autorizada; executar após E09 cache.

Escopo registrado antes de editar: `src/domain/{fuso,calculos,agregado}.ts`, `src/app/treino.ts`, `src/data/treino.ts`, `src/report/{relatorio,pdf}.ts`, `src/App.tsx` (avisos), testes afetados em `tests/{fuso,agregado,report,treino}` e docs afetados/registros.

Objetivo: aceitar deslocamento UTC zero observado sem usar zero para ausente; validar insumos numéricos antes de somar/exportar; recusar datas inválidas em qualquer campo; não inventar média de percentuais no relatório; totais sem observação permanecem null; dados locais inválidos não são apagados/resetados; CSV vazio mantém cabeçalho completo; avisos de datas divergentes visíveis na prévia.

Preservar v2 e métodos científicos existentes. Dúvidas de coordenação são registradas, não decididas pelo código. Toda edição subsequente fora destes caminhos exige novo escopo.
Acabamento adicional: texto de configuração em src/services/configuracao.ts ajustado para linguagem de coordenação (sem mudança de acesso). PDF repete identificação da ficha nas páginas de continuação; dados completos continuam no corpo/JSON. Falha inicial de 1 teste foi expectativa de mensagem antiga após validação antecipada de estrutura; teste ajustado para confirmar rejeição e armazenamento inalterado.

Estado: concluída. Evidências finais em ../TESTING.md: 165 testes passaram/7 ignorados sem emulador; 7/7 regras no emulador separado; tipos/build passaram. PDF final renderizado, observação longa sem corte, smoke Edge sem erro. Docs atuais/handoff/backlog corrigidos (D-017/D-018); nenhum deploy. Próximo passo: tarefa oficial de transações/fila/projeções, não ampliar local silenciosamente.
