# Firebase

Plano alvo: **Firestore Standard + Firebase Hosting Spark**. Sem Blaze, sem Storage, sem Functions, sem Cloud
Run, sem App Hosting.

## Serviços usados

- **Firebase Auth**: e-mail/senha.
- **Firestore**: banco de documentos (coleções aninhadas conforme `DATA_MODEL.md`).
- **Firebase Hosting**: PWA estática (Spark).

## Limitações (Spark) — a ter em mente

- Hosting Spark: uso gratuito, com limites razoáveis para PWA estática.
- Firestore Standard: leitura/escrita gratuita com cotas; evitar baixar todo o banco em relatórios
  (consultas filtradas por período no servidor).
- Não habilitar nada que exija faturamento. Não usar Storage.

## Configuração (.env)

Copiar `.env.example` para `.env.local` e preencher com as chaves do seu projeto Web:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Nunca commitar `.env.local`. Não usar chaves de serviço no cliente.

## Desenvolvimento local

1. Criar projeto Firebase (não ativar Blaze).
2. Habilitar Auth → método e-mail/senha.
3. Criar banco Firestore (modo de produção recomendado; regras testáveis no emulador).
4. Configurar `firestore.rules` e `firestore.indexes.json` (serão criados nas tarefas E04/E11).
5. Rodar `npm run dev`.

## Índices

Ver `DATA_MODEL.md §7` para os índices propostos (período + critério para relatórios). Criar via
`firebase deploy --only firestore:indexes` ou console.

## Observações

- O app **não** presume conexão sempre disponível: ver `OFFLINE.md`.
- Mapa: atribuição de tiles e termos do provedor devem ser registrados quando definido (D-008). O app
  funciona sem mapa.