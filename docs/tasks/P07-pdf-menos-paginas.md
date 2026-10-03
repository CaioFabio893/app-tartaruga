# P07 — PDF completo em menos páginas

Dono: Codex, sequencial. Usuário confirmou um único relatório completo, sem perda de informações, e autorizou iniciar.

Escopo: `src/report/pdf.ts`, testes de layout/conteúdo em `tests/report/`, amostra fictícia nova `output/pdf/relatorio-p07-demonstracao.pdf`, intermediários ignorados `tmp/pdfs/p07/`; `docs/REPORT_SPEC.md`, esta tarefa, STATUS/BACKLOG/CHANGELOG/handoff. Apenas layout: preservar seleção, campos, motivos, históricos, fórmulas e JSON/CSV. Não implementar nesta tarefa organização anual, numeração, previsão, exclusão ou Excel.

Aceite: comparar mesma amostra antes/depois; menos páginas com texto completo, legível e sem sobreposição. Renderizar e conferir visualmente. Rodar vitest, tipos e build; registrar resultados reais. Continuidade de publicação/push autorizados na sessão, somente após validação; nenhuma ficha real alterada.

## Implementação e evidências

`src/report/pdf.ts`: campos curtos em pares, margens laterais de 32 pt, menor espaçamento, resumo com menos quebras e textos longos com largura inteira. Nova ficha aproveita espaço disponível; continuação mantém identificação. Valores em 9 pt e rótulos especiais em 8,5 pt, preservando tamanhos anteriores. Não há dois formatos: o PDF continua completo. Fontes/avisos/seleção/históricos e snapshot JSON/CSV preservados.

Mesma fixture de cinco ninhos, com observação repetida 100 vezes e marcador final: **19 → 11 páginas A4**, redução de oito páginas (≈42%). Amostra nova fictícia em `output/pdf/relatorio-p07-demonstracao.pdf`; anteriores preservadas. `tests/report/p07.test.ts` confere redução e snapshot intacto e gera manifesto para extração independente. `tests/report/p07-verificar.py` conferiu **728 rótulos/valores presentes, zero ausentes e zero caracteres fora das margens** com pdfplumber. Poppler renderizou 11 páginas; mosaico e páginas ampliadas conferidos, sem cortes/sobreposições observados. Avisos de fontes de substituição do Poppler não impediram renderização.

Para reproduzir amostra: `$env:P07_GRAVAR='1'; npx vitest run tests/report/p07.test.ts`, seguido de `python tests/report/p07-verificar.py` em ambiente com pdfplumber. Usado Python empacotado do Codex; não adicionar dependência Python ao app. Intermediários/manifesto em tmp/pdfs/p07 ignorados.

Validação real:
- Tentativa inicial `npx vitest run` falhou: emulador 8080 desligado (ECONNREFUSED), além de timeout IndexedDB e falha subsequente no mesmo arquivo. Nenhuma regra relaxada nem timeout de teste alterado.
- Após `firebase emulators:start --only auth,firestore --project demo-tartarugas` indicar pronto, `npx vitest run --maxWorkers=2`: **202 passaram/1 prova de produção opt-in ignorada**, 22 arquivos. Menor concorrência separada do build; emulador/fake-indexeddb, sem escrita real.
- `npx tsc --noEmit`, `npx vite build`, verificação Python e `git diff --check`: passaram.

`firebase deploy --only hosting --project monitoramento-de-tartarugas --account SUA_CONTA_AUTORIZADA --non-interactive`: passou com a conta autorizada da sessão. HTTP 200 e referência ao bundle atual confirmados. Regras/fichas reais preservadas. Entrega Git em origin/master; confirmar SHA remoto antes da resposta final.

## Limitações e próximo passo

A redução depende do conteúdo e tamanho do histórico; não promete o mesmo percentual para todo relatório. Unicode não suportado pela fonte continua com aviso/JSON preservado, como antes. Aprovação do layout pela equipe permanece pendente. Organização anual/Excel/alertas/exclusão são tarefas futuras, fora desta entrega.
