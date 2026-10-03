# E02 — Relatório demonstrativo

Dono: Codex. Autorização: usuário pediu assumir a continuação após esgotar a cota do OpenCode, em 02/10/2026.

Objetivo: executar REPORT_SPEC com conjunto fictício, filtro único para prévia/PDF/JSON/CSV, período inclusivo, A4 paginado e valores ausentes preservados. Sem Firebase real ou publicação.

Escopo: `src/report/*`, `tests/report/*`, amostra `output/pdf/*`, correção necessária de `src/domain/consultas.ts` e `tests/consultas.test.ts`, docs afetados e registros obrigatórios. A integração visual é E03, sequencial, com tarefa própria. Antes de qualquer edição fora destes caminhos, registrar novo escopo.

Aceite: três critérios, filtros combinados, datas ausentes contadas no conjunto conhecido, null distinto de zero, sem escolha silenciosa de abertura, metadados de parcial/sincronização, exportações do mesmo snapshot, observações sem corte e testes/build reais. Layout continua proposta (D-010), fórmulas v2 preservadas (D-002).

Estado: concluída para treino. Ver evidência final em ../TESTING.md; integração real é E10.
Entrega E02 concluída: PDF A4 renderizado (11 páginas, revisão da página inicial e mosaico de todas), downloads PDF/JSON/CSV reais no Edge local; 146 testes iniciais passaram, regressões adicionais e validação final serão registradas em TESTING.md. Layout proposto, exemplo fictício; fonte padrão substitui glifos não suportados por ? com aviso, JSON conserva original.
