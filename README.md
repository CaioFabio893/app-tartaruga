# Monitoramento de Ninhos de Tartarugas

Aplicativo web de um projeto social para acompanhar ocorrências reprodutivas, ninhos, transferências, visitas e eclosão/abertura. Os dados do projeto publicado ficam no **Cloud Firestore**, com acesso pelo **Firebase Authentication**. PDF, JSON e CSV são gerados no navegador.

**Aplicativo:** https://monitoramento-de-tartarugas.web.app

**Estado:** 03/10/2026. Integração em nuvem e melhorias de mapa/relatório entregues. Aprovação científica do layout e testes em aparelhos de campo continuam pendentes; consulte [STATUS](docs/STATUS.md).

O endereço é público, mas os dados exigem login e vínculo ativo. A coordenação fornece o acesso em particular; este repositório não contém senha nem credencial administrativa.

## Como o projeto foi construído

O projeto nasceu da necessidade de registrar ninhos por coordenadas e gerar relatórios baseados na ficha de campo. O manual foi transcrito para consultas pontuais e convertido em um [dicionário de campos](docs/FIELD_DICTIONARY.md) e [regras de domínio](docs/DOMAIN_RULES.md), com referência às páginas da fonte. Instruções do manual são referência científica, não autorização para ações no ambiente.

A construção foi feita em etapas com ferramentas de IA:

1. **Claude:** identidade visual, cores, componentes, ícones SVG e protótipo, preservados em `docs/design/` e `design-preview/`.
2. **OpenCode:** base inicial, contratos, organização e documentação das primeiras tarefas.
3. **Codex:** revisão de domínio e segurança, implementação das etapas seguintes, relatórios, persistência, sincronização, Firebase e publicação. Assumiu também a implementação após autorização do responsável.

As IAs foram usadas no desenvolvimento. **Não existe IA dentro do aplicativo.** Gemini não é dependência nem responsável pelas definições atuais. Veja [TEAM](docs/TEAM.md), [DECISIONS](docs/DECISIONS.md) e [CHANGELOG](docs/CHANGELOG.md) para divisão de trabalho, decisões e entregas.

## Funcionalidades

| Área | O que está entregue |
| --- | --- |
| Acesso | Login Firebase Auth e confirmação de membro no projeto. Publicação atual com um único acesso compartilhado de campo; sem auto-cadastro administrativo. |
| Ocorrências | Identificação, datas, localização original, espécie, observações e dados do animal quando aplicáveis. Somente `TIPO_OCORR = CD` cria ninho. |
| Ninhos | Lista, ficha detalhada, estado de acompanhamento e histórico vinculado. Código interno, número de registro e número no cercado são separados. |
| Transferências | Registro próprio de destino, data, ovos, cercado/praia e coordenadas, com captura GPS do destino. Origem preservada. |
| Visitas | Data, condição, eventos e observações de acompanhamento; acréscimo do projeto identificado. |
| Eclosão/abertura | Datas, contagens observadas, complementos e correções auditadas. Nova reabertura distinta bloqueada até definição do protocolo. |
| GPS | Captura na origem e no destino, busca da melhor leitura durante a captura e margem de erro informada pelo aparelho. Entrada manual disponível. |
| Mapa | Leaflet/OpenStreetMap online, posição atual derivada, acesso à ficha pelos marcadores e círculo da margem de erro quando disponível. |
| Relatórios | Todos os ninhos ou intervalo inclusivo por ocorrência, eclosão ou abertura; filtros adicionais e prévia. |
| Exportações | PDF A4 com resumo e fichas detalhadas; JSON estruturado; CSV tabular. Usam o mesmo snapshot selecionado. |
| Offline | Cache da interface e cópia local do projeto já carregado, pendência durável, estados de sincronização e conflito explícito. |

Não existem fotos, câmera, upload ou `FOTOGRAFIA`. Comprimento e largura do casco são apresentados em **cm**, conforme confirmação registrada em D-022; medidas antigas não são convertidas silenciosamente.

## Organização dos dados

Uma **ocorrência** contém a observação, a localização original e os dados da tartaruga. Quando há desova (`CD`), um **ninho** referencia a ocorrência. Transferências, visitas e abertura pertencem ao ninho. O app não inventa uma identidade individual de animal que o manual não definiu.

```text
projetos/{projetoId}
├── membros/{uid}                         vínculo e papel
├── ocorrencias/{ocorrenciaId}            observação, animal e origem
├── ninhos/{ninhoId}                      vínculo com ocorrência CD
│   ├── transferencias/{transferenciaId}  destinos e histórico
│   ├── visitas/{visitaId}                acompanhamento
│   └── aberturas/{ninhoId}               eclosão/abertura e versões
├── consultas/{ninhoId}                   projeção técnica de relatório
├── operacoes/{operacaoId}                auditoria e pré-imagens
└── reservas/{escopo}/numeros/{numero}    proteção de numeração
```

A posição atual é derivada do histórico de transferências. O relatório mostra **onde o ninho foi encontrado** e **para onde foi transferido**, quando houver transferência, além do histórico. Consulte [DATA_MODEL](docs/DATA_MODEL.md).

Vazio, zero observado, indeterminado e não aplicável têm significados diferentes. Ausências usam `null`/`undefined`, nunca zero padrão. Cálculos preservam os insumos e usam a versão implementada **v2**, conforme as decisões de domínio. Números oficiais são texto para preservar zeros iniciais. Alterações científicas devem seguir as fontes de domínio, sem inferir códigos, fórmulas ou condições.

## Relatórios e localização em campo

Na tela de relatórios, o modo de todos os ninhos inclui também registros sem determinada data. Para um intervalo, escolher critério, início e fim; ausências e divergências são avisadas, sem escolher uma data silenciosamente. O PDF apresenta rótulos legíveis e motivos de campos vazios; o destino não é impresso como objeto JSON.

Relatório confirmado exige conexão, consulta ao servidor e ausência de pendências. Exportação offline é marcada **parcial**. Especificação: [REPORT_SPEC](docs/REPORT_SPEC.md).

GPS exige HTTPS e permissão e depende do aparelho e das condições locais. Mais casas decimais não garantem maior precisão: confira a margem de erro para reencontrar ovos. O mapa consulta um serviço externo OpenStreetMap e exige internet; não há download de mapas em massa. A lista de coordenadas continua disponível quando a base falha.

## Tecnologias

| Tecnologia | Finalidade |
| --- | --- |
| TypeScript | Tipos, contratos, validações e regras dos dados. |
| React + HTML/CSS | Interface responsiva baseada no visual Claude. |
| Vite | Desenvolvimento e build estático com módulos sob demanda. |
| Firebase SDK modular | Authentication e Cloud Firestore Standard. |
| Firebase Hosting Spark | Publicação estática por HTTPS. |
| IndexedDB | Cópia local e pendências persistentes. |
| Service worker | Cache dos arquivos da interface, separado dos dados. |
| pdf-lib | Geração de PDF no cliente, sem servidor. |
| Leaflet/OpenStreetMap | Mapa online. |
| Vitest + Firebase Emulator | Testes de comportamento, integração e permissões. |

## Pastas principais

```text
src/app/                 operações e estado local/nuvem
src/data/                acesso, DTOs Firestore e IndexedDB
src/domain/              tipos, validações, cálculos e datas
src/features/            acesso, formulários e mapa
src/report/              seleção, apresentação e PDF/JSON/CSV
src/services/            Firebase, Auth, configuração, GPS e PWA
src/styles/              estilos da interface
public/                  manifesto e ícones locais
tests/                   domínio, relatório, segurança e nuvem
docs/                    tarefas, decisões, regras e evidências
design-preview/          protótipo histórico, sem persistência
output/pdf/              amostras explicitamente fictícias
firestore.rules          autorização e validação no servidor
firestore.indexes.json   índices versionados
firebase.json            Hosting, regras, índices e emuladores
```

## Executar localmente

Requisitos: Git, npm e Node.js compatível com Vite (`20.19+` na série 20 ou `22.12+`; validação atual com Node 24). Testes de regras/integração exigem Java compatível com Firebase Emulator e Firebase CLI. Versões efetivas das dependências estão no lockfile.

```powershell
git clone https://github.com/CaioFabio893/app-tartaruga.git
cd app-tartaruga
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Sem `VITE_PROJETO_ID`, a interface mantém o treino separado. **Treino não grava no projeto oficial** nem é migrado automaticamente.

Para conectar seu próprio Firebase, preencher `.env.local` com a configuração Web obtida no console:

| Variável | Uso |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Chave pública do app Web. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domínio do Authentication. |
| `VITE_FIREBASE_PROJECT_ID` | ID do projeto Firebase. |
| `VITE_FIREBASE_APP_ID` | ID do aplicativo Web. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Campo opcional da configuração Web; não habilita notificações no app. |
| `VITE_PROJETO_ID` | Projeto lógico Firestore a abrir. |
| `VITE_LOGIN_DOMINIO` | Converte nome curto em e-mail técnico do Auth. |
| `VITE_FIREBASE_USAR_EMULADORES` | `true` apenas em desenvolvimento: força projeto demo e endpoints loopback. |

Variáveis `VITE_*` usadas no código podem entrar no bundle público. Nunca colocar senha, token administrativo ou chave de serviço nelas. Configuração Web não autoriza acesso aos dados; Authentication e regras fazem essa autorização.

Habilitar email/senha e provisionar projeto/membro administrativamente conforme [DEPLOY](docs/DEPLOY.md). Preencher o `.env.local` não cria esses documentos. Não executar `firebase init` sobre a configuração existente sem revisar as alterações.

## Testes e build

Em um terminal, iniciar emuladores demo; não usar produção para testes comuns:

```powershell
firebase emulators:start --only auth,firestore --project demo-tartarugas
```

Em outro terminal PowerShell:

```powershell
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'
npx vitest run
npx tsc --noEmit
npx vite build
npm audit
npm run preview
```

Sem emulador, os testes que dependem dele são ignorados: isso não valida regras. A prova de escrita em produção é opt-in, fora da suíte comum, e não deve ser ativada por engano. Cenários, evidências e limitações em [TESTING](docs/TESTING.md).

O build gera `dist/`. Service worker funciona na produção/preview, não no servidor de desenvolvimento. Após atualização, salvar trabalho, fechar abas antigas e reabrir para permitir troca do cache.

## Segurança e sincronização

- Acesso negado por padrão; membro/papel e projeto verificados no Firestore. O cliente não se promove a coordenação. Escritas exigem transação, revisão, versão, operação nova e pré-imagem.
- Cache local não significa sincronizado. Revisão antiga gera conflito, sem sobrescrever automaticamente o servidor. Adotar remoto arquiva o rascunho exportável, sem mescla automática.
- A conta compartilhada limita a identificação de cada pessoa. A senha simples atual é risco residual; deve ser fortalecida administrativamente e fornecida em particular. Ela não consta no repositório.
- Sair encerra Auth, mas mantém IndexedDB para recuperar pendências. Quem tem acesso ao aparelho/navegador pode acessar esses dados locais. Exportar pendências antes de limpar os dados do site.
- Coordenadas, PDFs reais e backups são sensíveis. Não publicar fichas reais nem credenciais no Git. Usar `exports/` e `backups/`, ignorados; `output/pdf/` contém demonstrações fictícias.

Detalhes: [SECURITY](docs/SECURITY.md), [OFFLINE](docs/OFFLINE.md) e [revisão P06](docs/reviews/P06-seguranca.md). Revisão de código e testes não garantem ausência de vulnerabilidades.

## Publicação e plano gratuito

Alvo: **Firestore Standard + Firebase Hosting Spark**, sem faturamento. Sem Blaze, Storage, Cloud Functions, Cloud Run, App Hosting, biblioteca paga ou fonte remota obrigatória. O projeto Firebase também aparece no Google Cloud; isso não exige ativar cobrança.

Publicar somente o build validado e indicar explicitamente projeto e conta autorizados, conforme [DEPLOY](docs/DEPLOY.md). Enviar ao GitHub não publica automaticamente uma nova versão do aplicativo.

Spark tem cotas de armazenamento, operações e tráfego; recursos podem ser interrompidos ao excedê-las. A [estimativa P05](docs/tasks/P05-capacidade-spark.md) sugere planejamento de 2.000–3.000 conjuntos semelhantes à amostra, incluindo índices estimados, **sem garantia**. Histórico e frequência de uso podem limitar antes. A implementação também limita leitura a 5.000 documentos por coleção consultada, com erro explícito.

Limites atuais: [Firestore](https://firebase.google.com/docs/firestore/quotas), [Hosting](https://firebase.google.com/docs/hosting/usage-quotas-pricing) e [Firebase](https://firebase.google.com/pricing). Não há backup/restauração automáticos nem importação JSON na interface: preservar exportações manualmente.

## Continuar o desenvolvimento

Ler `AGENTS.md`, [STATUS](docs/STATUS.md), [handoff](docs/handoffs/ATUAL.md), tarefa ativa e [INDEX](docs/INDEX.md). Execução sequencial com dono e escopo no [BACKLOG](docs/BACKLOG.md). Registrar arquivos, decisões, resultados reais, limitações e próxima ação, sem duplicar regras.

Pendências: conferir o PDF com a coordenação, testar GPS/offline/instalação em aparelhos físicos e resolver perguntas científicas rastreáveis. Não preencher dúvidas com códigos ou fórmulas inventados.
