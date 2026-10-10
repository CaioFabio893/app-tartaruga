# P13 — limpar ninhos para teste

03/10/2026. Dono Codex; sequencial. Usuário autorizou explicitamente apagar todos os ninhos cadastrados para entregar o aplicativo para teste.

Escopo: dados de ninhos do projeto lógico `monitoramento-de-tartarugas` no Firebase de mesmo nome, ocorrências vinculadas, históricos, projeções e organização desses ninhos; recibo administrativo e revisão do projeto. Preservar acessos/configurações/auditorias/reservas/ocorrências sem ninho e demais projetos. Cópias locais JSON/PDF em `backups/P13/` (ignoradas); scripts administrativos temporários em `tmp/pdfs/p13/`; documentação STATUS/BACKLOG/CHANGELOG/DECISIONS e esta tarefa. Sem alterar código/regras/papéis.

Estado: concluída. 2 ninhos removidos administrativamente em um commit atômico; 11 documentos (ninhos, ocorrências vinculadas, históricos/projeções presentes). Zero ninhos, zero projeções, zero organizações confirmados; 1 ocorrência sem ninho preservada conforme escopo.

Evidências: REST Firestore real com conta proprietária já autorizada da CLI, tokens apenas em memória, sem alterar papéis/regras. Snapshot raiz revisão 7; pré-condições updateTime em todos os documentos e raiz/gestão, recibo imutável novo e revisões incrementadas no mesmo commit. Verificação independente confirmou HTTP 404 dos 11 documentos e revisão 8. Recibo `037be722-81ac-4306-82cf-ebbff5377eeb` em `exclusoes`; auditorias/reservas/acessos/configurações preservados, nenhum outro projeto tocado.

Backups ignorados em `backups/P13/`: backup.json (snapshot REST original), backup.pdf (5 páginas, 2 fichas via exportador do aplicativo), conferencia.json, recibo.json (hashes JSON/PDF e commitTime), verificacao.json. `npx vitest run --config tmp/pdfs/p13/vitest.config.ts`: 1 passou, confirmou duas fichas e gerou PDF. PDF extraído com texto nas 5 páginas/N_REGISTRO duas vezes e mosaico renderizado conferido visualmente. Não é teste de regras/emulador. Nenhum código do app modificado nesta tarefa, tipos/build não necessários.

Comandos administrativos: `node tmp/pdfs/p13/admin.mjs prepare`, depois backup/teste/render/conferência, `node tmp/pdfs/p13/admin.mjs delete`, `node tmp/pdfs/p13/admin.mjs verify`. Script temporário teve erro de sintaxe antes de qualquer chamada de rede; corrigido e leitura concluída. Scripts/config/teste/mosaico em tmp/pdfs/p13 ignorados; não contêm credenciais. Não executar prepare novamente sobre a mesma pasta: substituiria o snapshot original.

Limites: cópias/rascunhos de outros aparelhos não foram apagados. Ao reabrir, usar “Conferir dados” online; pendência antiga pode entrar em conflito com revisão nova e deve ser resolvida sem reenviar automaticamente. Reservas de números oficiais permanecem; limpeza não renumera nem promete reiniciar contador. Exclusão administrativa não concede permissão de exclusão à conta campo.
