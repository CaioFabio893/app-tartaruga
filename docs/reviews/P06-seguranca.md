# Revisão P06 — 03/10/2026

Revisão estática de código/regras/configuração, dependências, arquivos rastreados e seis commits anteriores ao envio inicial ao GitHub. Não é pentest, teste de carga nem garantia de ausência de falhas. Nenhuma ficha real alterada.

## Achados

| ID | Risco e evidência | Tratamento |
| --- | --- | --- |
| P06-01 | Conta de campo única com senha simples: se compartilhada/descoberta, permite acesso e gravação do projeto. Auditoria identifica a conta, não cada pessoa. | Residual. Preservada a escolha do usuário; fortalecer senha administrativamente e manter entrega privada. Nenhuma senha registrada no Git. |
| P06-02 | Hosting sem proteção explícita contra enquadramento em outro site e interpretação incorreta de conteúdo. | `firebase.json`: DENY/frame-ancestors, nosniff, base-uri, object-src, política de referência e bloqueio de câmera/microfone; geolocalização própria preservada. A CSP é parcial, não uma lista completa de fontes de scripts. Hosting publicado e cabeçalhos confirmados por HTTP. |
| P06-03 | Protótipo histórico interpolava ID externo da URL em `innerHTML` sem escape. Não faz parte do bundle oficial. | Escape contextual adicionado; teste executa renderização com entrada HTML maliciosa e verifica texto escapado. Exploração em navegador real não demonstrada; endurecimento preventivo. |
| P06-04 | `.gitignore` não cobria todos os `.env.*`, credenciais administrativas e diretórios de exportação. | Ampliado, mantendo `.env.example` rastreável e amostras fictícias. Ignorar não remove arquivo já rastreado; histórico também examinado. |
| P06-05 | IndexedDB retém cópia/pendências após logout. Pessoa com acesso ao navegador pode ler dados locais; revogação remota não apaga cache offline. | Residual documentado. Dispositivo confiável e exportar pendências antes de limpar dados do site. Não apagar rascunhos automaticamente. |
| P06-06 | `celulaCSV` neutralizava strings com prefixos de fórmula, mas não listas. `COLETA_MATERIAL_BIOLOGICO` aceita texto livre convertido em lista; início `=`, `+`, `-` ou `@` chegava ao CSV sem prefixo protetor. | Corrigido após ampliação autorizada pelo usuário: texto produzido de listas recebe a mesma neutralização. Cinco casos cobrem prefixos/espaço de controle, JSON original e latitude numérica negativa preservados. |

O mapa solicita tiles externos, expondo ao provedor IP e área visualizada; não envia ficha completa. App Check não configurado nesta revisão. Autenticação válida compartilhada não impede abuso das cotas Spark. Regras de membro não são proteção contra vazamento da senha autorizada.

## Verificações

- `npm audit --json`: zero vulnerabilidades reportadas, incluindo desenvolvimento.
- Histórico Git: busca por senha fornecida, chaves privadas/service account, tokens GitHub/AWS/OAuth/JWT e chaves Web; nenhum resultado nos padrões pesquisados. Inspeção de arquivos rastreados: sem `.env.local`, credenciais administrativas ou PDFs reais. PDFs versionados são demonstrações fictícias. Busca por padrões não garante detectar todo segredo possível.
- `git check-ignore`: env local/produção, credencial administrativa, chave, intermediário PDF e exportações/backups ignorados; `.env.example` não ignorado.
- `npx vitest run` com `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`: execução final 201 passaram, 1 prova de produção opt-in ignorada, 21 arquivos. Inclui acesso negado, isolamento, papéis, transações, regressão do protótipo e CSV. Emulador não comprova regras/índices reais em produção.
- `npx tsc --noEmit` e `npx vite build`: passaram. Não executar escrita real de produção nesta revisão.
- Hosting publicado com a correção CSV e cabeçalhos: deploy passou; site/bundle HTTP 200 e cabeçalhos confirmados na URL pública. Regras e fichas reais preservadas.

O README antigo descrevia apenas treino; substituído pelo estado em nuvem, construção, funcionalidades, organização, configuração, testes e limites. E-mail pessoal administrativo retirado dos comandos de DEPLOY em favor de `SUA_CONTA_AUTORIZADA`; isso não remove esse dado dos commits anteriores. Endereços pessoais nos históricos não são credenciais. Nenhum histórico Git reescrito.
