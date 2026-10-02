# Decisões

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
  (p. 5).
- **Decisão**: Domínio calcula e versiona (`VERSAO_FORMULA = 'v1'`), com `motivo` quando vazio. Nunca
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
- **Motivo**: Manual diz "até as 12:00h" e "após as 12:00h" (p. 1, p. 3).
- **Decisão**: `segundosDoDia <= 12*3600` → noite anterior; `> 12*3600` → novo dia. **12:00:00 pertence à
  noite anterior**, 12:00:01 pertence ao novo dia. Aplicado a DATA_OCORR, DATA_ECLOS, DATA_ABERT.
- **Consequências**: Teste cobre o limite. Pode ser ajustado com evidência da coordenação (único ponto).

## D-005 — Ocorrência sem desova não cria ninho
- **Data**: 02/10/2026
- **Motivo**: CD finaliza a postura; demais (ML, SD, ND, PI) não criam ninho (p. 2).
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