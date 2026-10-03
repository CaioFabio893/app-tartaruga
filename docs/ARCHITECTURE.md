# Arquitetura

Stack: Vite + TypeScript `strict` + React 19 + HTML/CSS + Firebase SDK modular.
Plano alvo: **Firestore Standard + Firebase Hosting Spark**, sem Blaze.

> Estado atual: interface React, treino IndexedDB, cache estático no build e Auth/Firestore sob demanda. Emuladores demo configurados. Não há persistência oficial, fila remota ou instalação física validada. STATUS.md distingue entregas locais e oficiais.

## 1. Árvore de pastas

```
src/
  app/          operações da aplicação (casos de uso): orquestra domínio + dados, não conhece DOM
  ui/           componentes de interface reutilizáveis, sem regra de negócio
  features/     telas por área: ninhos, ocorrencias, transferencias, visitas, abertura, relatorios, cadastros
  domain/       regras do manual, tipos, validação, cálculos, consulta, persistência, fila, reserva e fuso.
                PURO: sem Firebase, sem DOM, sem rede
  data/         leitura/escrita no Firestore, repositórios, fila offline, mapeamento de documentos
  services/     autenticação, GPS, permissões, rede, sincronização
  report/       geração de PDF (pdf-lib) e exportação JSON/CSV a partir de dados já validados
  styles/       tokens e estilos globais
tests/          testes de comportamento (domínio, filtros, permissões, sincronização)
```

O que **não** entra em cada pasta:

| Pasta | Proibido |
| --- | --- |
| `domain` | importar `firebase`, `window`, `document`, `localStorage` ou qualquer `feature` |
| `data` | conter regra do manual (cálculo, validação de negócio) |
| `ui` | chamar `firebase` diretamente ou gravar no repositório |
| `report` | buscar dados sozinho; recebe o conjunto já filtrado e validado |
| `features` | conter fórmula; chamar repositório sem passar pela camada `app` |

## 2. Direção das dependências (regra verificável)

```
features  ->  app  ->  domain
   |          |
   +----------+-->  data  ->  firebase
   +------------->  services (auth, gps, rede)
report <- app (dados já validados)
```

Regras verificáveis por leitura de imports:

1. `src/domain/**` não importa nada de `firebase*`, `src/data`, `src/ui`, `src/features` nem usa globais de DOM.
   É o que permite rodar os testes do domínio em Node sem navegador e sem emulador.
2. `src/features/**` não importa `firebase*` nem `src/data`; chama `src/app`.
3. `src/report/**` não importa `src/data`.
4. Nenhuma pasta importa `../../` para fora de `src` (exceto `src/styles` e arquivos de configuração).

Esses limites são convenções revisadas por leitura de imports. A configuração atual do TypeScript não
proíbe imports entre camadas; o build não detecta sozinho uma violação arquitetural.

## 3. Responsabilidade por camada

| Camada | Exemplo concreto |
| --- | --- |
| `domain` | `dataReferenciaNoite(instanto): string` — devolve a data de campo pelo corte de 12:00 (`DOMAIN_RULES` §3.2) |
| `app` | `registrarOcorrencia(input)` — valida, cria ocorrência e, se `CD`, cria ninho e vincula os dois |
| `data` | `listarOcorrenciasPorPeriodo(projetoId, inicio, fim)` — consulta filtrada, mapeia documento para tipo |
| `services` | `capturarGps()` — `geolocation`, permissões, precisão e timeout |
| `ui` | `<Campo>` com rótulo, erro e `aria-describedby`; não valida regra de negócio |
| `features` | `telaFichaNinho` — monta a ficha em 5 etapas a partir da visão do `app` |
| `report` | `gerarPdf(dados, opcoes)` — recebe registros já filtrados; não consulta banco |

## 4. GPS e mapa são coisas separadas

- **GPS** (`services/gps.ts`): `navigator.geolocation`, permissão, precisão em metros, timeout e cancelamento.
  Falha de GPS **não** impede registrar o ninho: as coordenadas ficam `null` e a ficha é salva.
- **Mapa** (`features/mapa`): apenas exibe o que já foi capturado. Integração com Leaflet é opcional e
  carregada sob demanda; o provedor de tiles precisa ter termos que permitam o uso previsto
  (`FIREBASE.md`). Não presume download de mapas offline.
- O app funciona com coordenadas e **lista equivalente** mesmo sem mapa: a lista é o caminho acessível e o
  fallback obrigatório (`design/SCREEN_SPEC.md`).

## 5. Navegação (destinos planejados; shell atual usa estado local)

| Rota | Precisa de |
| --- | --- |
| `/entrar` | nada além de sessão anônima |
| `/ninhos` | lista de ninhos do projeto + estado de acompanhamento |
| `/ninhos/:id` | ficha em 5 etapas: visão do `app` + estado do formulário |
| `/ninhos/novo` | ocorrência nova; cria ninho apenas se `CD` |
| `/mapa` | lista sempre; mapa se carregado |
| `/ocorrencias` | ocorrências **sem** desova e registros não reprodutivos |
| `/relatorios` | filtros + prévia; PDF sob demanda |
| `/cadastros` | projetos, temporadas, responsáveis, praias, espécies e equipe (papéis) |

## 6. Estado do formulário de ficha

Formulários atuais em `features/treino/Formularios.tsx`: estado preservado durante salvamento/falha; navegação protegida enquanto aberto. Correções de abertura guardam valor anterior no histórico. Não existe ainda o fluxo oficial de cinco etapas. Campos de coleta/evidência não são editáveis no treino atual e permanecem null.

## 7. Offline

Implementado: `app/treino.ts` valida operações; `data/treino.ts` persiste atomicamente conjunto normalizado e auditoria no IndexedDB, comparando revisão global. Importação de tipo do estado não cria dependência runtime inversa. Aviso entre abas não mescla automaticamente; conflito rejeita gravação e preserva formulário. `vite.config.ts` emite SW só em produção; `services/pwa.ts` comunica cache/atualização sem recarga forçada.

Planejado: repositório/fila/sincronização oficiais com `operationId`/`baseVersion`, conforme contrato puro `domain/fila.ts` e OFFLINE.md. Esses módulos remotos não existem ainda.

## 8. Decisões abertas (apontadas, não resolvidas aqui)

- Índice de `praias` para o filtro de relatório por praia (`DATA_MODEL` §7).
- Estratégia final de conflito offline entre aparelhos (`OFFLINE.md`).
- Provedor de tiles opcional: atual esquema é SVG local, sem mapa-base; cache contém só assets próprios.
- Procedimento administrativo de criação do primeiro usuário `coordenacao` (`SECURITY.md`).
- As 8 dúvidas de domínio em `DOMAIN_RULES.md` §8, que são da coordenação científica, não de arquitetura.
- Escopos exatos das reservas de número `N_REGISTRO`/`N_NINHO` (`reserva.ts`, pendente da coordenação).
