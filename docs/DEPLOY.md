# Publicação

P03 autorizada pelo usuário: integração real em monitoramento-de-tartarugas, Firestore Standard/Hosting Spark. Usuário único adriano; senha provisionada no Auth fora dos arquivos, não documentar nem incorporar no cliente. Auth email/senha, membro campo e projeto criados administrativamente. Fuso científico permanece null até confirmação; datas de campo são digitadas como noite, sem conversão automática. Auditoria técnica usa ISO UTC e confirmação timestamp do servidor.

Não usar treino-louise. Todos comandos reais precisam projeto e conta explícitos:

```powershell
firebase deploy --only firestore:rules,firestore:indexes --project monitoramento-de-tartarugas --account adrianoartoniomareante@gmail.com --non-interactive
firebase deploy --only hosting --project monitoramento-de-tartarugas --account adrianoartoniomareante@gmail.com --non-interactive
```

Hosting serve dist, SPA/cache e exclui *.map/arquivos ocultos. Config pública em .env.local ignorado; VITE_PROJETO_ID=monitoramento-de-tartarugas e VITE_LOGIN_DOMINIO=monitoramento-de-tartarugas.web.app habilitam a entrada única. Nunca commitar senha, token ou credencial administrativa. Fechar abas antigas e reabrir após atualização do worker, quando não houver formulário em edição.

Dados sintéticos de prova real ficam em projetos/validacao-p03-interna (mesmo Firebase, projeto lógico separado), com rótulo explícito; projeto principal permanece sem essas fichas. Depois desativar projeto/vínculo técnico administrativamente, preservando auditoria. Não há migração automática de treino/localhost; exporte cópia JSON. Importação/restauração e administração de cadastros não estão na interface.

## 1. Configurar variáveis de ambiente

```powershell
copy .env.example .env.local
# preencher VITE_FIREBASE_* com as chaves do app Web do Firebase Console
```

## 2. Build

```powershell
npm ci
npx tsc --noEmit
npx vitest run
npx vite build
```

Build deve gerar `dist/` sem erros.

## 3. Firebase CLI (opcional)

```powershell
npm i -g firebase-tools
firebase login
firebase use --add  # selecionar projeto
firebase init hosting  # apontar para dist/ (single-page app)
```

## 4. Regras e índices

Regras/índices base já existem; após completar/validar a integração oficial e obter autorização:

```powershell
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only hosting
```

## 5. Primeiro usuário com papel coordenacao

**Procedimento administrativo (fora do app cliente):**

1. Criar usuário no Firebase Auth (console > Authentication > Users).
2. Adicionar membro em `projetos/{projetoId}/membros/{uid}` com:
   - `uid`, `nome`, `email`
   - `papel: 'coordenacao'`
   - `ativo: true`
   - `projeto_id`, `criado_em`, `criado_por` (quem realizou a ação administrativa)
   - `atualizado_em`, `atualizado_por`, `versao: 1`

O app cliente **não** cria esse registro com papel `coordenacao`. Isso evita autoelevação.

## 6. Validação pós-deploy

1. Acessar URL do Hosting.
2. Login com primeiro usuário.
3. Confirmar projeto/membro; temporadas/praias/evidências dependem de informações da coordenação, não de códigos inventados.
4. Testar fluxo CD → ninho → transferência → visita → abertura → relatório.
5. Verificar regras no emulador (negado por padrão, isolamento por projeto).
6. Gerar PDF offline → deve aparecer "parcial".

## 7. Rollback

Reverter para versão anterior no Firebase Hosting (histórico de versões) ou redeploy de build anterior.

## Limitações

Sem Blaze. Uso gratuito sujeito às cotas do Spark. PDF é gerado no cliente (não consome Functions).

## P03 publicada — 02/10/2026

`firebase deploy --only firestore:rules,hosting --project monitoramento-de-tartarugas --account adrianoartoniomareante@gmail.com --non-interactive` passou. URL https://monitoramento-de-tartarugas.web.app conferida: login único adriano, dados confirmados no servidor, prévia ECLOS vazia e exportações disponíveis; sem erros capturados. Senha não registrada em arquivos. Área técnica validacao-p03-interna e membro ativo=false via API (HTTP 200); documentos e auditoria preservados. Prova real/índices e limites em TESTING/STATUS.

## P04 — publicada em 03/10/2026

Publicado somente Hosting após validação: comando de P03 com --only hosting passou. Regras e dados existentes preservados; consulta/download e mapa conferidos na URL pública. Mapa-base depende de conexão OpenStreetMap, sem cobrança Google/Blaze; GPS requer HTTPS e permissão do aparelho. Se houver atualização de cache pendente, salvar formulários, fechar abas e reabrir.
