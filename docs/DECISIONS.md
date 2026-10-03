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

## D-019 — P03: persistência compartilhada (02/10/2026)
Usuário autorizou publicação com dados em nuvem. Auth email/senha padrão, usuário curto mapeado para identidade técnica no domínio Hosting; senha provisionada fora dos arquivos. Membro Adriano com papel campo, sem auto-administração. Firestore Standard São Paulo, Spark, proteção contra exclusão ativada; nenhum serviço que exija faturamento. Dados do treino permanecem separados.

Revisão global do projeto e versões dos documentos detectam concorrência: qualquer alteração externa exige conferência; não mesclar silenciosamente. Operação imutável guarda conteúdo e pré-imagem real, com ID para reenvio idempotente. Relatório lê somente origem confirmada, jamais presume cache sincronizado.

Abertura oficial usa o UUID do ninho como ID estável do registro de referência; complementos/correções incrementam versão e preservam pré-imagem na auditoria. Nova reabertura distinta fica bloqueada enquanto a pergunta científica anterior estiver aberta; não escolher data canônica. Treino preserva seus vários registros. Criação composta CD+transferência persiste versão inicial 1 do ninho (metadado técnico).

Reserva técnica por projeto+temporada ou projeto+cercado mantém o escopo provisório de DATA_MODEL §6, sem atribuir números automaticamente. Caminho interno por tipo/escopo/número evita depender de hash não verificável pelas regras; números preservam zeros. Não implica confirmação do escopo científico pela coordenação.

## D-020 — Projeção técnica v2 por ninho (02/10/2026)
Teste real no emulador revelou limite de 1.000 expressões ao validar três cópias completas da projeção na mesma transação. Substituir o contrato planejado DATA_MODEL §4.10/§7 de três documentos por um documento consultas/{ninhoUUID}, com mapas datas/ambiguas para OCORR, ECLOS e ABERT. Projeção técnica versão 2 não altera a fórmula científica v2. Cada data é conferida nas regras contra origem/abertura e gravada na mesma transação. Intervalo e projeto filtrados no servidor, demais filtros aplicados aos metadados retornados antes de ler detalhes; só três índices são necessários. Consulta separada de datas null tem o mesmo projeto/filtros; datas divergentes continuam excluídas e relatório parcial. Não contar fora do período sem varrer o banco. O descritor puro de R02 é referência de validação de entrada, não a consulta SDK ativa da P03. Fonte dos limites: https://firebase.google.com/docs/firestore/security/rules-structure .

Complemento D-020: também centralizar autorização de escrita na criação da operação imutável (campo/coordenacao). Cada origem/projeção/reserva exige operação nova, autor do token, incremento de revisão do projeto, pré-imagem e caminho corretos; a revisão não pode reutilizar operação antiga. Isso evita repetir avaliação de membro em cada documento da mesma transação, mantendo a negativa para não membro/consulta/inativo. Validar ataques no emulador, não relaxar para passar teste.

D-021 (02/10/2026): localização original imutável não significa impedir correção de espécie/animal (FIELD_DICTIONARY §2 permite identificar espécie na abertura). Liberar complemento auditado apenas dos campos de animal/OBS e primeira atribuição manual de N_REGISTRO; preservar localização, datas, tipo, vínculos e número já atribuído. Atualizar ocorrência+ninho+projeção e eventual reserva na mesma transação. Valor anterior fica na operação imutável; não apagar NAO_VIAVEIS ao trocar espécie. Conta real permanece única: adriano, autoria compartilhada.

Complemento técnico D-020: projeção v2 é mínima (datas, ambiguidades, filtros e referência de versão/operação). Detalhes são lidos da origem, sem copiar nº registro/código/localização para os três critérios. Autorização/revisão/autor ficam conferidos uma vez na criação da operação nova e na alteração do projeto; cada documento exige inexistência prévia dessa operação, caminho/pré-imagem e vínculo com ultima_operacao. Evita repetição que excederia 1.000 expressões em ficha completa com duas reservas, sem permitir reuso de operação antiga.

## D-022 — unidade e apresentação P04

Usuário confirmou COMP_CASCO/LARG_CASCO em centímetros em 02/10/2026. É confirmação do projeto, não unidade encontrada no manual p.2. Não converter valores existentes silenciosamente. PDF usará rótulos legíveis e todos os campos, distinguindo não informado/não aplicável/indeterminado/zero; JSON conserva dados técnicos. Modo todos não aplica filtro de data e inclui ninhos sem datas/divergentes, com avisos e status parcial quando houver divergência. Mapa Leaflet já instalado, base OpenStreetMap online com atribuição, sem prefetch/cache offline em massa/serviços pagos. Política: https://operations.osmfoundation.org/policies/tiles/ ; API: https://leafletjs.com/reference ; GPS: https://www.w3.org/TR/geolocation/ . Precisão do hardware não é garantida nem modificada por casas decimais.

## D-023 — organização anual e Excel P08 (03/10/2026)
Pedido do usuário: cada ninho em uma coluna do Excel, números na primeira linha; mapa apenas do ano selecionado. Ano/numeração são metadados operacionais informados, separados de N_REGISTRO/N_NINHO/UUID. Sem migração inferida: fichas antigas ficam em “Sem ano definido”. Reserva/contador/auditoria atômicos por ano; zeros mínimos preservados, reserva antiga nunca reutilizada após mudança/exclusão. Número automático exige conexão; treino não promete reserva global.

## D-024 — previsão e armazenamento P08
DÚVIDA para coordenação: qual protocolo/fonte determina a previsão de eclosão por ninho? Até resposta, só data informada pela equipe com justificativa; não inferir prazo por espécie. Aviso operacional configurável 0–60 dias, inicialmente 7 na tela, não é prazo científico. Dia civil do aparelho identifica o aviso, sem substituir datas da noite. Eclosão/abertura observada encerra o aviso.
Uso exato do Firestore não está no SDK cliente: coordenação informa MiB medidos no console e data; alerta técnico em 80% de 1 GiB. Sem promessa de monitoramento automático; capacidade local não representa quota da nuvem. Novos metadados/auditoria reduzem a capacidade em relação à amostra P05.

## D-025 — retenção com exclusão definitiva P08
Usuário autorizou apagar por ano/período após download obrigatório do PDF para liberar espaço. Essa solicitação recente substitui a intenção anterior de exclusão apenas lógica em DATA_MODEL §8/SECURITY: implementar remoção definitiva das fichas selecionadas, restrita à coordenação, com PDF + JSON e confirmação explícita. Correções comuns continuam versionadas, sem destruição. Nesta execução nenhum registro real será excluído.
Recibo imutável contém escopo, motivo, hashes SHA-256, autor e revisão. Regras exigem recibo novo na mesma transação; versões/revisões bloqueiam backup desatualizado, campo/consulta não excluem. O navegador não prova que os downloads foram guardados: confirmação humana é indispensável; hashes auditam os arquivos, não provam sua preservação. Coordenação é papel confiável e pode usar SDK próprio: interface não é segurança. Auditorias/reservas/contadores ficam preservados, portanto espaço não é totalmente liberado. Sem restauração automática.
DÚVIDA para responsável: quem deve ter autorização administrativa para retenção? Conta única Adriano segue campo; não promover silenciosamente, não criar conta adicional. Provisionamento depende de autorização administrativa futura.
