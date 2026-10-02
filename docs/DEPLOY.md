# Deploy

Pré-requisitos: projeto Firebase criado, Auth (e-mail/senha) habilitado, Firestore criado (modo produção),
Hosting configurado. **Não ativar Blaze**.

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

Após criar `firestore.rules` e `firestore.indexes.json` (tarefas E04/E11):

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
   - `criado_em`, `criado_por` (quem realizou a ação administrativa)

O app cliente **não** cria esse registro com papel `coordenacao`. Isso evita autoelevação.

## 6. Validação pós-deploy

1. Acessar URL do Hosting.
2. Login com primeiro usuário.
3. Criar projeto/temporada/praias.
4. Testar fluxo CD → ninho → transferência → visita → abertura → relatório.
5. Verificar regras no emulador (negado por padrão, isolamento por projeto).
6. Gerar PDF offline → deve aparecer "parcial".

## 7. Rollback

Reverter para versão anterior no Firebase Hosting (histórico de versões) ou redeploy de build anterior.

## Limitações

Sem Blaze. Uso gratuito sujeito às cotas do Spark. PDF é gerado no cliente (não consome Functions).