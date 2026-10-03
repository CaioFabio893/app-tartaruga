# Publicação

Em 02/10/2026, usuário autorizou publicar o treino. Site: https://monitoramento-de-tartarugas.web.app . Projeto monitoramento-de-tartarugas, Spark confirmado no console. Somente Hosting publicado; sem deploy de regras/índices, sem banco/Auth oficial configurado no build. Integração oficial E05–E10 e validação científica continuam pendentes.

Republicação do treino, após testes/tipos/build, com a conta autorizada:

```powershell
firebase deploy --only hosting --project monitoramento-de-tartarugas --account adrianoartoniomareante@gmail.com --non-interactive
```

Hosting serve dist, exclui *.map e arquivos ocultos, preserva cache versionado e SPA. Dados de localhost não são migrados: cada origem/navegador mantém seu treino local. Faça exportação JSON; restauração/importação ainda não existe. Procedimentos abaixo são para integração oficial futura, não etapas realizadas nesta publicação.

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
3. Confirmar projeto/temporada/praias provisionados administrativamente (CRUD cliente ainda não entregue).
4. Testar fluxo CD → ninho → transferência → visita → abertura → relatório.
5. Verificar regras no emulador (negado por padrão, isolamento por projeto).
6. Gerar PDF offline → deve aparecer "parcial".

## 7. Rollback

Reverter para versão anterior no Firebase Hosting (histórico de versões) ou redeploy de build anterior.

## Limitações

Sem Blaze. Uso gratuito sujeito às cotas do Spark. PDF é gerado no cliente (não consome Functions).
