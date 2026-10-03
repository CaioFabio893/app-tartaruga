# Firebase

Plano alvo: **Firestore Standard + Firebase Hosting Spark**. Sem Blaze, sem Storage, sem Functions, sem Cloud
Run, sem App Hosting.

## Serviços alvo

- **Firebase Auth**: e-mail/senha.
- **Firestore**: banco de documentos (coleções aninhadas conforme `DATA_MODEL.md`).
- **Firebase Hosting**: PWA estática (Spark).

## Limitações (Spark) — a ter em mente

- Hosting Spark: uso gratuito sujeito às cotas; não prometer capacidade ilimitada.
- Firestore Standard: leitura/escrita gratuita com cotas; evitar baixar todo o banco em relatórios
  (consultas filtradas por período no servidor).
- Não habilitar nada que exija faturamento. Não usar Storage.

## Configuração (.env)

Copiar `.env.example` para `.env.local` e preencher com as chaves do seu projeto Web:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Nunca commitar `.env.local`. Não usar chaves de serviço no cliente.

## Estado implementado e emulador

Login email/senha sem auto-cadastro; confirmação de membro/projeto usa leitura de servidor, não cache. Regras/índices/firebase.json existem. Campo/projeções negam escrita até integração oficial. Treino é separado do login e não é enviado ao Firebase.

Para testar sem conta real, Java e Firebase CLI instalados:

```powershell
firebase emulators:start --only auth,firestore --project demo-tartarugas
```

Em `.env.local`, `VITE_FIREBASE_USAR_EMULADORES=true` força projeto demo-tartarugas e serviços loopback (Auth 9099/Firestore 8080), ignorando ID real. Fixture de membro/projeto precisa ser provisionada apenas no emulador. Sem essa opção, configuração web completa é necessária; nenhum projeto real foi configurado/validado nesta entrega.

## Índices

Índice base em firestore.indexes.json; filtros combinados precisam de índices próprios, conforme DATA_MODEL §7. Emulador valida regras, não índices de produção. Não executar deploy nesta etapa.

## Observações

- O app **não** presume conexão sempre disponível: ver `OFFLINE.md`.
- Mapa: atribuição de tiles e termos do provedor devem ser registrados quando definido (D-008). O app
  funciona sem mapa.
