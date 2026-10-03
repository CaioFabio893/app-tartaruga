# E04 — Acesso e base segura Firebase

Dono: Codex. Continuação autorizada pelo usuário em 02/10/2026; executar após E03.

Escopo: `src/services/{configuracao,firebase,auth}.ts`, `src/data/acesso.ts`, `src/features/acesso/*`, `src/App.tsx` (integração de acesso), `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `tests/security/*`, `tests/services/*`, `package.json`/lock (teste de regras), `.env.example`, docs afetados e registros obrigatórios. Sem deploy, conta real, credencial de serviço ou faturamento.

Objetivo: SDK sob demanda, configuração validada, login email/senha, leitura de projeto por ID informado e membro ativo. Regras negam por padrão e impedem autoatribuição de coordenação; testes reais no emulador local demo. Configurar emuladores apenas loopback.

Limite desta entrega: operações de campo e projeções continuam bloqueadas para escrita até E05/E09 implementar schema/transações/idempotência. Não afirmar cadastro/sincronização entregues. Projeto e primeira coordenação provisionados fora do cliente; papel coordenação não se cria pelo app.

Aceite: usuário sem membro/inativo/outro projeto negado, consulta lê e não escreve, caminho desconhecido negado, autoelevação rejeitada; login sem signup; SDK não inicializa sem configuração completa. Emulador não prova índices de produção. Estado: base concluída; CRUD/projeções oficiais pendentes. Evidências em ../TESTING.md.
Escopo complementar antes de editar: src/app/acesso.ts é a fachada entre features e data/services; src/styles/interface.css apenas para alinhar a seção de login ao visual existente. Integração sem chamada direta de repositório pelas features.
Regras iniciais passaram 7/7 no emulador Firestore Standard local demo (firebase CLI 15.30.1, Java 21). Login UI ainda será validado no emulador Auth; não é evidência de projeto real. Membros campo/consulta podem ser provisionados pela coordenação com auditoria e versão; coordenação nova somente pelo procedimento administrativo externo.
Login/acesso/saída testados no Edge contra Auth+Firestore locais demo: membro campo confirmado, projeto sem vínculo negado, sem erros de página. Auditoria inicial acusou 5 vulnerabilidades transitivas; override @grpc/grpc-js 1.13.6 aplicado (D-015), npm install retornou zero vulnerabilidades. SDK Auth e Firestore separados sob demanda.
