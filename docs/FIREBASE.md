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

## Configuração real P03

Projeto Firebase/Google Cloud único monitoramento-de-tartarugas, Spark. Firestore Standard default em southamerica-east1, proteção contra exclusão ativada, sem PITR. Hosting e Auth email/senha padrão habilitados; anonymous=false. App Web cadastrado e config pública em .env.local ignorado (nenhuma chave de serviço no cliente). Usuário único adriano, membro campo provisionado fora do app. Não usar a conta/projeto treino-louise.

Regras/índices publicados; campos exigem transação/auditoria, deny-default. Índices datas.OCORR/ECLOS/ABERT conferidos READY em produção. Contratos e testes: [DATA_MODEL.md](DATA_MODEL.md), [SECURITY.md](SECURITY.md), [TESTING.md](TESTING.md). Treino não é migrado automaticamente.

Para testes, emuladores Auth 9099/Firestore 8080 somente loopback com projeto demo-tartarugas; VITE_FIREBASE_USAR_EMULADORES=true força o demo. Nunca rodar testes de escrita comum contra produção. Prova real opt-in usa projeto lógico validacao-p03-interna isolado e a mesma conta; nenhuma conta extra criada. Arquivar/desativar seus vínculos depois da prova, sem apagar documentos.

## Índices e cotas

Três índices P03 por projeto+data+ID; índice R02 anterior preservado para não apagar trabalho sem necessidade. Relatório filtra período no servidor; filtros adicionais sobre metadados. Leitura inicial da interface ainda percorre projeto/históricos (limite explícito 5.000 documentos por coleção). Spark é limitado por cotas; não prometer uso ilimitado gratuito. Sem Storage/Functions/Run/App Hosting/Blaze, IA ou upload.

## Observações

- O app **não** presume conexão sempre disponível: ver `OFFLINE.md`.
- Mapa: atribuição de tiles e termos do provedor devem ser registrados quando definido (D-008). O app
  funciona sem mapa.

P04: base OpenStreetMap online gratuita com atribuição visível, política https://operations.osmfoundation.org/policies/tiles/ . Leaflet local instalado, sem prefetch/cache em massa ou endpoint Google pago. Indisponibilidade/offline mantém lista de coordenadas; não há promessa de mapa offline ou cobertura contínua.

## Estimativa de armazenamento P05

Faixa aproximada de planejamento: 2.000–3.000 ninhos acumulados com histórico comparável à amostra, não garantia. Fonte/metodologia e limites em [P05](tasks/P05-capacidade-spark.md); uso diário/carga inicial pode limitar antes do espaço. Nenhuma alteração de índice ou plano realizada.
