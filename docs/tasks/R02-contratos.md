# R02 - Ajustes de contratos após a revisão

Dono: OpenCode. Estado: **concluída**. Dependência: R01.
Objetivo: resolver F07-F12 em docs/reviews/REVISAO-BASE.md antes de implementar relatório/Firebase.

Consultar AGENTS.md, STATUS.md, handoffs/ATUAL.md e a revisão. Abrir somente documentos dos achados.
O texto do manual está em docs/references/MANUAL-TRANSCRITO.md: buscar campos, não reler imagens.

## Aceite

- Modelo com dono único de campos, flagrante explícito, tipos coerentes e mapeamento de persistência.
- Consulta por período de ocorrência/eclosão/abertura sem enumerar todo o banco, com campos de filtro
  e índices concretos; não inventar números de excluídos.
- Fluxo offline com baseVersion, operação idempotente e commit online transacional; evitar sobrescrita
  concorrente e fila duplicada do SDK.
- Reserva transacional de números; escopos pendentes identificados como decisões da coordenação.
- Fuso do projeto e conversão localizada documentados; nenhuma promessa de conversão DST inexistente.
- OVOS_FURAD/OVOS_TRANS em múltiplas transferências e abertura válida com fonte inequívoca.
- Normalizar referências narrativas às páginas reais (campos na tabela já revisados); copiar apenas
  texto necessário da fonte e preservar ambiguidades científicas sem decisões silenciosas.
- React documentado e classificado corretamente se mantido; PWA/emuladores como pendentes reais.
- Build/typecheck/testes e documentação da tarefa. Não publicar.

## Estado final

Concluída em 02/10/2026. Sem implementação de Firebase nesta tarefa (contratos como domínio puro).

- **Dono único** (F10): `Ocorrencia` → `N_REGISTRO` + localização original; `Transferencia` →
  `TEMP_TRANSF`/`OVOS_TRANS`/`N_NINHO`; `Abertura` → `OVOS_FURAD` e demais contagens. `verificarCampos`
  acusa campo duplicado.
- **Consulta** (F07): projeção `projetos/{id}/consultas`; critérios `OCORR`/`ECLOS`/`ABERT`;
  `data_criterio >= inicio` + `corteSuperior`; contagem escopada de "data ausente" à parte.
- **Offline** (F08): fila idempotente (`operationId` + `baseVersion` + `payload.versao`); cache ≠
  sincronizado; conflito preserva rascunho.
- **Numeração** (F09): reserva determinística `reserva-v1/...`; escopos de `N_REGISTRO`/`N_NINHO`
  assumidos e marcados pendentes da coordenação.
- **Fuso** (F11): `Projeto.fuso` IANA (`null` permitido); offset observado obrigatório; `Intl` só
  confere, sem reconstrução de DST.
- **React/PWA** (F12): React 19 movido para `dependencies`; sem service worker nem emuladores; PWA
  declarada como pendente, não entregue.

## Evidência

- `npm test`: 133/133 em nove arquivos (inclui `fuso`, `consultas`, `persistencia`, `fila`,
  `reserva`, `agregado`).
- `npm run typecheck`: passou.
- `npm run build`: passou (`tsc --noEmit && vite build`).
- Sem validação de Firebase real/emulador (fora do escopo desta tarefa).

## Ampliação de escopo (registrada)

O caminho declarado originalmente era apenas `src/domain/tipos.ts`. Para atender F07-F12 foram criados
módulos puros e testes novos: `src/domain/{consultas,persistencia,fila,reserva,fuso,agregado}.ts`,
`tests/{consultas,persistencia,fila,reserva,agregado,fuso}.test.ts` e `tests/auxiliares-agregado.ts`.
Também foram normalizados comentários de página em `src/domain/{datas,calculos,tipos,validacao}.ts`.
Registrado em STATUS.md, BACKLOG.md e DECISIONS.md (D-012, D-013).
