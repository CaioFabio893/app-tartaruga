# Arquitetura

Stack: Vite + TypeScript `strict` + HTML/CSS simples + Firebase SDK modular + PWA estática.
Plano alvo: **Firestore Standard + Firebase Hosting Spark**, sem Blaze.

## 1. Árvore de pastas

```
src/
  app/          operações da aplicação (casos de uso): orquestra domínio + dados, não conhece DOM
  ui/           componentes de interface reutilizáveis, sem regra de negócio
  features/     telas por área: ninhos, ocorrencias, transferencias, visitas, abertura, relatorios, cadastros
  domain/       regras do manual, tipos, validação e cálculos. PURO: sem Firebase, sem DOM, sem rede
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

Se uma regra quebrar, o build de tipos falha por `import` proibido — não por convenção.

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

## 5. Rotas

| Rota | Precisa de |
| --- | --- |
| `/entrar` | nada além de sessão anônima |
| `/ninhos` | lista de ninhos do projeto + estado de acompanhamento |
| `/ninhos/:id` | ficha em 5 etapas: visão do `app` + estado do formulário |
| `/ninhos/novo` | ocorrência nova; cria ninho apenas se `CD` |
| `/mapa` | lista sempre; mapa se carregado |
| `/ocorrencias` | ocorrências **sem** desova e registros não reprodutivos |
| `/relatorios` | filtros + prévia; PDF sob demanda |
| `/cadastros` | projetos, temporadas,responsible,egi,praias, espécies, equipe (papéis) |

## 6. Estado do formulário de ficha

O formulário é estado **independente da renderização** (`features/ninhos/estadoFicha.ts`). Trocar de etapa
não recria campos nem perde valores; os campos condicionais somem da tela mas o valor continua no estado
como `null` quando não aplicável. Isso corrige os defeitos 3 e 4 apontados em `design/REVISAO-CLAUDE.md`.

## 7. Offline

`data/fila.ts` guarda escritas pendentes em `IndexedDB` com o `id` do documento. A interface mostra
pendência, nunca "sincronizado" por ter aceitado no cache (`OFFLINE.md`). Migração da fila é responsabilidade
de `data/sincronizacao.ts`, não da tela.

## 8. Decisões abertas (apontadas, não resolvidas aqui)

- Índice de `praias` para o filtro de relatório por praia (`DATA_MODEL` §7).
- Estratégia final de conflito offline entre aparelhos (`OFFLINE.md`).
- Provedor de tiles e conteúdo do cache do PWA (`FIREBASE.md`).
- Procedimento administrativo de criação do primeiro usuário `coordenacao` (`SECURITY.md`).
- As 8 dúvidas de domínio em `DOMAIN_RULES.md` §8, que são da coordenação científica, não de arquitetura.