# Monitoramento de ninhos

Aplicativo em desenvolvimento com visual do Claude. A versão atual permite **treinar** cadastro de ocorrências/ninhos, transferências, visitas, eclosão/abertura, GPS e relatórios por período. PDF, JSON e CSV são gerados no aparelho. Dados persistem localmente; **não cadastrar fichas oficiais**.

Login e confirmação de acesso ao projeto têm base implementada, mas não conectam o treino ao banco oficial. Sincronização entre aparelhos e relatórios definitivos ainda precisam de integração. Ver [estado e próximo passo](docs/STATUS.md).

## Executar localmente

Node.js compatível com Vite e npm; usar o lockfile.

```powershell
npm ci
npm run dev
```

Sem configuração Firebase, o treino funciona. Para verificar cache offline, gerar produção e abrir o endereço do preview:

```powershell
npx vitest run
npx tsc --noEmit
npx vite build
npm run preview
```

O cache só é registrado no build de produção. Offline funciona depois da instalação do cache; gravação local não é sincronização. Faça cópia JSON do treino para preservar os dados.

## Continuar

Ler AGENTS.md, docs/STATUS.md e docs/handoffs/ATUAL.md. Escopos em docs/tasks; evidências em [TESTING.md](docs/TESTING.md). [FIREBASE.md](docs/FIREBASE.md) explica emulador demo e configuração opcional, sem credencial de serviço no cliente.

Plano alvo Spark, sujeito às cotas gratuitas. Sem fotos/câmera/upload, Storage, Blaze, serviços pagos ou IA no app. Nenhuma publicação realizada.
