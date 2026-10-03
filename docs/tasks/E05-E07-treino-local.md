# E05–E07 — Fluxo de treino local (preparação, não gravação oficial)

Dono: Codex. Autorização: usuário pediu continuar o máximo possível enquanto estiver ausente (02/10/2026).

Escopo antes das edições: `src/app/treino.ts`, `src/data/treino.ts`, `src/features/treino/*`, `src/App.tsx`, `src/styles/interface.css`, `tests/treino/*`, package.json/lock para fake-indexeddb em testes, docs afetados/registros. Sem modificar regras Firestore para liberar dados de campo.

Objetivo: exercitar ocorrência → ninho somente CD → transferência → eclosão/abertura; persistência IndexedDB do conjunto **de treino**, autoria/versões/histórico e rejeição de conflito entre abas. Adaptar os relatórios para ler o treino salvo. Dados normalizados, localização original imutável, nenhum número biológico com padrão zero.

Não integra com conta real nem com fila remota E09; nunca chama dado local de sincronizado. Operações identificadas e auditadas como locais. UI deve avisar para não cadastrar fichas oficiais neste modo. Não apagar dados; armazenagem corrompida/incompatível deve causar erro, não reset automático.

Aceite: criar CD gera ninho, demais tipos não; null/zero preservados, transferência não altera origem; abertura usa cálculos existentes v2; gravações e metadados atômicos; revisão antiga rejeitada, rascunho de formulário preservado na falha; recarregar conserva treino; exportação JSON integral do treino. E05–E07 oficiais permanecem pendentes da transação Firebase.

Estado: treino local concluído; acesso/regras locais validados. Integração oficial pendente. Testes finais em ../TESTING.md. Service worker/GPS ficam em tarefas separadas antes de editar esses caminhos.
Escopo complementar antes de editar: src/domain/agregado.ts apenas para EntradaFicha.visitas opcional; src/report/pdf.ts para exibir acompanhamento como acréscimo do projeto. Visita não altera HIST_NINHO. Evidência inicial: 5 testes locais passaram; Edge validou ML/CD, transferência, eclosão antes da abertura, edição de abertura, recarga IndexedDB, conflito entre abas e rascunho preservado, sem erro de página.
