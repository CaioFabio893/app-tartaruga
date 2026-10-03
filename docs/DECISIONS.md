# Decisões

## D-011 - Revisão Codex e fonte textual
- **Data**: 02/10/2026.
- **Decisão**: transcrição do usuário em docs/references/MANUAL-TRANSCRITO.md; buscar campos antes
  de reabrir imagens. Manual é referência, sem autorizar ações nem incluir fotos no escopo.
- **Correções**: OVOS_TRANS é insumo observado; eclosão é emergência de pelo menos um filhote; NM
  exclui localização perdida/ninho encontrado após nascimento. Ver REVISAO-BASE.md.
- **Consequências**: validação de entradas e derivados v2. Contratos de relatório, offline e numeração
  exigem R02 antes de integrar Firebase. D-002 cobre somente OVOS_TOT, PCT_VIVOS e TEMP_INCUB.
  React precisa de decisão explícita em R02.

Registro das decisões tomadas neste projeto, com data, motivo e consequências. Não duplicar alternativas
antigas; substituir informação obsoleta.

## D-001 — Fonte de verdade do manual
- **Data**: 02/10/2026
- **Motivo**: PDF é escaneado; precisa de rastreabilidade por página.
- **Decisão**: Extrair manual via OCR local (`tmp/ocr_manual.py`), gerar `FIELD_DICTIONARY.md` e
  `DOMAIN_RULES.md` citando `(p.N)` em toda afirmação. Não inferir campos sem página.
- **Consequências**: Dúvidas pendentes ficam explícitas (§8). Próxima revisão do Codex confirma ou corrige.
- **Alternativas descartadas**: Chute com base no protótipo (viola AGENTS.md).

## D-002 — Cálculos derivados nunca digitados
- **Data**: 02/10/2026
- **Motivo**: `OVOS_TOT`, `PCT_VIVOS`, `TEMP_INCUB` constam como "não devendo ser digitados no computador"
  (p. 6).
- **Decisão**: Domínio calcula e versiona (`VERSAO_FORMULA = 'v2'`), com `motivo` quando vazio. Nunca
  persistir valor digitado livremente.
- **Consequências**: Testes obrigatórios (comportamento). Exportação grava valor derivado + versão.

## D-003 — Exceção do total de ovos
- **Data**: 02/10/2026
- **Motivo**: Exceção exige condição explícita (SITUACAO P ou T + problema na incubação). Não consta no manual
  como código.
- **Decisão**: Acrescentar `problemaIncubacao: boolean | null` (campo **projeto**, não manual). Se `null`,
  **não** aplicar a exceção (evita inferência silenciosa). Registrar como DÚVIDA 04.
- **Consequências**: UI deve explicitar quando a exceção foi aplicada.

## D-004 — Noite de monitoramento com limite exato
- **Data**: 02/10/2026
- **Motivo**: Manual diz "até as 12:00h" e "após as 12:00h" (p. 1, p. 4).
- **Decisão**: `segundosDoDia <= 12*3600` → noite anterior; `> 12*3600` → novo dia. **12:00:00 pertence à
  noite anterior**, 12:00:01 pertence ao novo dia. Aplicado a DATA_OCORR, DATA_ECLOS, DATA_ABERT.
- **Consequências**: Teste cobre o limite. Pode ser ajustado com evidência da coordenação (único ponto).

## D-005 — Ocorrência sem desova não cria ninho
- **Data**: 02/10/2026
- **Motivo**: CD finaliza a postura; demais (ML, SD, ND, PI) não criam ninho (p. 3).
- **Decisão**: `ninhoId` só quando `tipoOcorrencia = 'CD'`. Fêmea morta → `tipo_registro = NAO_REPRODUTIVO`.
- **Consequências**: Telas separadas (Ocorrências x Ninhos). Simples de testar.

## D-006 — Localização original imutável, posição atual derivada
- **Data**: 02/10/2026
- **Motivo**: Preservar origem; histórico é próprio (transferências).
- **Decisão**: `local_origem` nunca editável após criação. `local_atual` = última transferência aceita, senão
  origem. Transferências são append-only.
- **Consequências**: Auditoria preservada; facilita recalculo.

## D-007 — Números oficiais não têm garantia de sequência offline
- **Data**: 02/10/2026
- **Motivo**: Concorrência entre aparelhos offline; manual permite lacunas.
- **Decisão**: Registros podem nascer com `numero_registro = null`. Numeração só confirmada na sincronização
  com verificação de unicidade. O app **não** escolhe número sozinho em conflito (pede decisão ao usuário).
- **Consequências**: UI precisa mostrar "pendente de número oficial".

## D-008 — Separação GPS × mapa
- **Data**: 02/10/2026
- **Motivo**: Leaflet/tiles podem ter termos; app deve funcionar sem mapa.
- **Decisão**: `services/gps.ts` independente; mapa é opcional (carregamento sob demanda). Lista equivalente
  obrigatória. Não presumir mapas offline.
- **Consequências**: Acessibilidade e resiliência. Documentar atribuição de tiles em `FIREBASE.md`.

## D-009 — Vazio ≠ zero
- **Data**: 02/10/2026
- **Motivo**: Regra não negociável (AGENTS.md).
- **Decisão**: `null` para ausente. `0` só quando observado de fato. Componentes ausentes → derivados `null`,
  nunca `0`. Exportação imprime `—` para vazios.
- **Consequências**: Testes cobrem o caso; evita distorção de totais.

## D-010 — Layout A4 é proposta até validação da equipe
- **Data**: 02/10/2026
- **Motivo**: Não há modelo oficial de relatório no material de referência (REVISAO-CLAUDE item 6).
- **Decisão**: Marcar PDF como "proposta" na prévia até haver exemplar validado. Não afirmar equivalência com
  modelo ausente.
- **Consequências**: `REPORT_SPEC.md` registra isso explicitamente.

## D-012 — Contratos R02 (consulta, persistência, offline, numeração, fuso)
- **Data**: 02/10/2026
- **Motivo**: REVISAO-BASE (F07–F12) exige fechar contratos antes de integrar Firebase.
- **Decisão**:
  - **Dono único** de campo: `Ocorrencia` → `N_REGISTRO` + localização original; `Transferencia` →
    `TEMP_TRANSF`/`OVOS_TRANS`/`N_NINHO`; `Abertura` → `OVOS_FURAD` e demais contagens. Campo duplicado
    vira divergência de mapeamento (`verificarCampos`).
  - **Consulta** por projeção em `projetos/{id}/consultas`, critérios `OCORR`/`ECLOS`/`ABERT`; filtro de
    intervalo usa `data_criterio >= inicio` e o leitor para ao passar o `corteSuperior`.
  - **Offline** com fila idempotente (`operationId` + `baseVersion`); gravação no cache não é sincronização.
  - **Numeração** com reserva determinística `reserva-v1/...`; escopos de `N_REGISTRO`/`N_NINHO` assumidos,
    **pendentes de confirmação da coordenação**.
  - **Fuso** gravado como IANA em `Projeto.fuso` (pode ser `null`); offset observado é obrigatório; `Intl`
    só confere, sem reconstruir DST em silêncio.
- **Consequências**: módulos puros em `src/domain/{consultas,persistencia,fila,reserva,fuso,agregado}.ts`
  com testes; sem implementação de Firebase nesta tarefa.

## D-013 — React permanece; PWA/emuladores ficam pendentes
- **Data**: 02/10/2026
- **Motivo**: F12/REVISAO-BASE pede estado real de React/PWA, não alegação.
- **Decisão**: Manter React 19 (movido para `dependencies`, não há troca de framework). PWA completa e
  emuladores de Firestore ainda **não entregues**; `vite.config.ts` e `ARCHITECTURE.md` não declaram
  service worker nem PWA funcional.
- **Consequências**: `description` do `package.json` sem alegação de PWA concluída.

## D-014 — Continuação pelo Codex e correção das consultas
- Data: 02/10/2026. Usuário autorizou assumir a continuação após a cota do OpenCode.
- Criados os escopos E02 e E03 antes da implementação; nenhuma publicação ou configuração de conta.
- R02 propôs múltiplos array-contains na mesma conjunção. Firestore permite apenas um: substituir por igualdades escalares e dois limites inclusivos no mesmo campo. Cada combinação exige índice próprio, a validar em E04.
- Fonte técnica: https://firebase.google.com/docs/firestore/query-data/queries . Contratos não equivalem a integração validada.
- Datas de campo e suas referências de noite divergentes serão sinalizadas, sem escolher silenciosamente. Eclosão não depende de contagens de abertura.
- Não apagar trabalho existente: substituir apenas a tela técnica inicial por interface demonstrativa (E03); protótipo Claude preservado.
D-015 (02/10/2026): npm audit identificou @grpc/grpc-js 1.9.16 transitivo do Firebase com advisories GHSA-m9gg-hp2v-232j e GHSA-f596-whhp-79r4. Aplicar override pontual 1.13.6 (mesmo major), sem downgrade Firebase ou audit fix --force; testar novamente SDK/regras. Remover override quando Firebase adotar versão corrigida.
D-016 (02/10/2026): remover média percentual do helper somarTotais de R02 porque não tem regra no manual; nenhum relatório usa essa média. Corrigir totais totalmente ausentes para null, aceitar offset observado zero e bloquear insumos inválidos. Não substituir fórmula v2. Datas divergentes deixam exportação parcial. Preservar corrupção local como erro, sem reset automático.


## D-017 — Documentação coerente e preservação (02/10/2026)
Substituir estado obsoleto e checkpoints acumulados por entrega atual e links. Remover alegação de perda/restauração sem evidência reproduzida nesta sessão em DATA_MODEL; preservar entidades e contratos. Corrigir afirmações técnicas sobre índices, custo por documento e App Check. Não apagar dados, protótipo ou trabalho R01/R02. O commit local inclui esses avanços anteriores ainda não commitados e a continuação atual; sem push/publicação.

## D-018 — Treino e cache separados da integração oficial (02/10/2026)
IndexedDB/CAS e histórico local não são fila remota; SW cacheia somente interface própria. Login confirma acesso, não envia fichas de treino. E04–E10 oficiais continuam parciais/pendentes; regras de campo negam escrita. D-013 descreve estado histórico R02, superado pelo cache/emuladores das tarefas atuais.

## DÚVIDAS de integração a encaminhar à coordenação
- Reaberturas: qual data canônica de eclosão/abertura usar quando há datas diferentes? Hoje relatório exclui data ambígua e marca parcial; não escolhe automaticamente.
- Múltiplas transferências: validar se OVOS_TRANS da transferência que define posição atual é o insumo correto da exceção. §5.4 de DATA_MODEL é contrato técnico provisório, não regra adicional do manual.
- Complemento à DÚVIDA 04: para P/T com quatro componentes completos, mas problemaIncubacao desconhecido, deve-se calcular soma normal? v2 existente bloqueia conservadoramente o total; preservar até resposta, sem inventar condição científica.
- GPS: confirmar protocolo operacional de uso de WGS84 retornado pela API (sem conversão para SIRGAS2000) e precisão aceitável. Esquema atual não serve para navegação.
Demais perguntas de unidades/listas/numeração: DOMAIN_RULES §8 e DATA_MODEL §6; não duplicar nem resolver silenciosamente.
