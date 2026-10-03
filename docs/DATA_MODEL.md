# Modelo de Dados

Contrato de dados do app. As regras científicas estão em `DOMAIN_RULES.md`; os campos e nomes de exportação
em `FIELD_DICTIONARY.md`. Este documento define **onde cada dado mora**, **quem é o dono de cada campo** e
**como ele é escrito**.

> P03 integra Auth/Firestore e mantém treino separado. D-019–D-021 atualizam contratos técnicos de reserva/projeção/auditoria abaixo; fonte científica permanece DOMAIN_RULES/FIELD_DICTIONARY. Ver STATUS.md.

## 1. Convenções

| Item | Decisão |
| --- | --- |
| Datas de campo | `string` no formato `YYYY-MM-DD` (calendário do projeto, não civil) |
| Instantes | `string` ISO 8601 **com offset** (`2026-10-02T21:40:00-03:00`), sempre no fuso do projeto |
| Hora de campo | `string` `HH:MM`, sem horário de verão (`DOMAIN_RULES` §3.4) |
| Ausente | `null`. Zero real é `0`. Indeterminado do manual é `'I'`/`'NI'`. Não aplicável é ausência + motivo |
| Identificador | `id: string` = UUID v4 gerado no dispositivo. **Nunca** é `N_REGISTRO` nem `N_NINHO` |
| Texto com zeros | `numero_registro`, `numero_ninho_cercado`, `marcas_*`: `string`, nunca `number` |
| Coordenadas | `number` com 5 casas; `datum: 'SIRGAS2000' \| 'WGS84'` |
| Campos derivados | `number \| null`, sempre com `derivado_de`, `motivo` e `derivados_formula_versao` (`'v2'`) |
| Concorrência | todo documento tem `versao: number`; o servidor incrementa na gravação confirmada |
| Projeção | cópia derivada com `projecao_de` + `projecao_versao`, escrita **na mesma transação** da origem |

Nomes de arquivo em pt-BR seguem o padrão observado no repositório (`ARCHITECTURE.md`). Nomes de campo e de
coleção em `snake_case` em inglês, por convenção estável para o Firestore. Colunas de exportação usam os
nomes do manual (`FIELD_DICTIONARY` §7). O mapeamento entre o tipo TypeScript (`camelCase`) e o documento
(`snake_case`) é explícito no contrato `src/domain/persistencia.ts` e nos DTOs ativos `src/data/nuvem.ts` — nenhuma conversão implícita por spread.

## 2. Repositórios Firestore

```
projetos/{projetoId}                                             doc
projetos/{projetoId}/membros/{uid}                               doc
projetos/{projetoId}/temporadas/{temporadaId}                    doc
projetos/{projetoId}/praias/{praiaId}                            doc
projetos/{projetoId}/cercados/{cercadoId}                        doc   (ver §4.7)
projetos/{projetoId}/ocorrencias/{ocorrenciaId}                  doc
projetos/{projetoId}/ninhos/{ninhoId}                            doc
projetos/{projetoId}/ninhos/{ninhoId}/transferencias/{id}        subcoleção
projetos/{projetoId}/ninhos/{ninhoId}/visitas/{id}               subcoleção
projetos/{projetoId}/ninhos/{ninhoId}/aberturas/{id}              subcoleção
projetos/{projetoId}/consultas/{ninhoId}                         doc   (projeção de relatório, §7)
projetos/{projetoId}/reservas/{tipoEscopo}/numeros/{numero}          doc   (§6)
```

Todo documento tem `projeto_id`. **Toda** consulta e **toda** regra filtra por ele: é o que isola os dados
entre projetos (`SECURITY.md`). Subcoleções repetem `projeto_id` no próprio documento para permitir filtro
por índice composto e validação de regra sem consultar o documento pai.

## 3. Um dono por campo

A ficha do ninho na tela é uma **visão** que reúne `Ocorrencia` + `Ninho` + `Transferencia[]` + `Visita[]` +
`Abertura[]` por relacionamento (`ocorrencia_id`, `ninho_id`). **Não existe documento "ficha" com campos
duplicados.**

| Dado | Dono único | Os demais leem |
| --- | --- | --- |
| `N_REGISTRO`, praia/km/coordenadas do lançamento, animal, marcas, biometria, tumores, palavras-chave, OBS do lançamento | `Ocorrencia` | via `ninho.ocorrencia_id` |
| `SITUACAO`, `HIST_NINHO`, `problema_incubacao`, `estado_acompanhamento`, `codigo_interno` | `Ninho` | via `ninho_id` |
| Localização original do ninho | `Ocorrencia` (é a mesma playa/km da ocorrência CD) | via `ocorrencia_id` |
| `TEMP_TRANSF`, `N_NINHO`, `OVOS_TRANS`, destino e GPS da transferência | `Transferencia` | derivado: transferência que define a posição atual |
| `OVOS_FURAD`, `VIVOS`, `NATIMORTOS`, `OVOS_N_ECL`, `NAO_VIAVEIS`, horas de filhote, `DATA_ECLOS`, `DATA_ABERT` | `Abertura` (uma só: a abertura de referência, §5.3) | derivado |
| `ovos_totais`, `percentual_vivos`, `tempo_incubacao_dias` | **derivado em leitura** (`src/domain/calculos.ts`), materializado opcionalmente com versão | — |

Consequências obrigatórias:

1. `Ninho` **não** guarda `numero_registro`, `local_origem`, `tempo_transferencia` nem `numero_ninho_cercado`.
   Guardar seria cópia sem dono; a interface e o relatório obtêm esses valores por junção.
2. `Transferencia` **não** guarda `ovos_furados`. `OVOS_FURAD` é observado durante a localização, retirada
   e/ou transferência, mas é registrado **uma única vez**, na abertura — caso contrário `OVOS_TOT` somaria a
   mesma contagem duas vezes (revisão F10). A observação feita na transferência é registrada em `OBS`.
3. `posicao_atual` é **derivada** (§5), nunca digitada nem armazenada fora de projeção versionada.
4. Qualquer cópia em outro documento é **projeção** com `projecao_de` + `projecao_versao`, escrita na mesma
   transação da origem, e nunca editável pela interface.

## 4. Entidades

### 4.1 Projeto
`id`, `nome`, `sigla`, `ativo`, `criado_em`, `fuso` (nome IANA, `string | null` — ver `F11`/`src/domain/fuso.ts`),
`versao`. Sem vínculo com instituições reais: nome e sigla são livres. `fuso = null` significa "fuso não
confirmado": o app **não** converte e sinaliza, em vez de assumir um deslocamento.

### 4.2 Membro
`projetos/{projetoId}/membros/{uid}`: `uid`, `nome`, `email`, `papel`
(`consulta` | `campo` | `coordenacao`), `ativo`, `criado_em`, `criado_por`, `atualizado_em`, `atualizado_por`, `projeto_id`, `versao`.
O papel vem do registro, **nunca** do cliente: se o documento não existe, o usuário não tem acesso ao projeto.

### 4.3 Temporada
`id`, `nome` (ex.: `2026/2027`), `inicio`, `fim`, `ativo`, `versao`. `inicio`/`fim` são datas do calendário do
projeto.

### 4.4 Praia
`id`, `codigo` (código do SITAMAR, texto), `nome`, `praia_ativa`, `segmentada_em_km` (bool),
`origem_codigo` (`sitamar` | `pendente`), `versao`. Praias cujo código ainda não foi cadastrado no SITAMAR
entram com `origem_codigo: 'pendente'` e aviso no formulário. O app **não cria** código de praia
(`DOMAIN_RULES` §4.9). `praia_codigo` continua sendo **texto** no lançamento, para preservar zeros.

### 4.5 Ocorrencia
Um lançamento de campo. Existe **sempre** que houve atividade, mesmo sem desova.

| Campo | Tipo | Origem |
| --- | --- | --- |
| `id` | string | (projeto) — UUID v4 local, não é número de registro |
| `projeto_id`, `temporada_id`, `responsavel_id` | string | (projeto) |
| `numero_registro` | `string \| null` | N_REGISTRO (p. 1) — dono único do número |
| `tipo_ocorrencia` | `'CD' \| 'ML' \| 'SD' \| 'ND' \| 'PI'` | TIPO_OCORR (p. 3) |
| `tipo_registro` | `'REPRODUTIVO' \| 'NAO_REPRODUTIVO'` | (projeto) — fêmea morta na praia vai para o caderno de registros não reprodutivos (p. 3) |
| `verificacao_praia_realizada` | `boolean \| null` | (projeto) — obrigatória para `SD` (`DOMAIN_RULES` §2.2) |
| `data_ocorrencia` | `string \| null` | DATA_OCORR (p. 1) |
| `instante_ocorrencia` | `string \| null` | ISO com offset, fuso do projeto (p. 1) |
| `hora_ocorrencia` | `string \| null` | HORA_OCORR — só com flagrante (p. 1) |
| `noite_referencia` | `string \| null` | data de referência de campo (`DOMAIN_RULES` §3.2) |
| `flagrante` | `boolean \| null` | (projeto) — **resposta explícita**, ver §4.5.1 |
| `local_origem` | `Localizacao` | aninhado, imutável |
| `marcas_encontradas`, `marcas_colocadas`, `marcas_retiradas` | `string \| null` | (p. 2) |
| `especie_codigo` | `'CC' \| 'EI' \| 'LO' \| 'CM' \| 'DC' \| 'NI' \| null` | ESPECIE (p. 2) |
| `comprimento_casco`, `largura_casco` | `number \| null` | (p. 2) — unidade indefinida, DÚVIDA 01 |
| `tumores` | `'S' \| 'N' \| 'I' \| null` | TUMORES (p. 3) |
| `coleta_material_biologico` | `string[] \| null` | (p. 3) |
| `evidencia_interacao_pesca` | `boolean \| null` | (p. 3) |
| `tipo_evidencia` | `string \| null` | (p. 3) |
| `palavras_chave` | `string[]` | (p. 6–7) |
| `observacoes` | `string \| null` | OBS (p. 1) |
| `ninho_id` | `string \| null` | vínculo: preenchido **só** quando `tipo_ocorrencia = 'CD'` |
| `criado_por`, `criado_em`, `atualizado_por`, `atualizado_em`, `versao` | — | trilha |

Chave de ligação: quando `tipo_ocorrencia = 'CD'`, a operação de aplicação cria o `Ninho` e grava
`ninho_id` na ocorrência. **A ocorrência continua existindo** — ela é o registro do lançamento; o ninho é o
resultado do manejo. `ML`, `SD`, `ND`, `PI` e registros não reprodutivos têm `ninho_id = null` sempre.

#### 4.5.1 Flagrante e hora

O campo `flagrante` é **explícito** (`boolean | null`). Não é derivado de `hora_ocorrencia`, pois esta pode
estar desconhecida em registros incompletos. `flagrante = true` exige `hora_ocorrencia` (ou ao menos o
instante com offset) quando disponível; `flagrante = false` mantém `hora_ocorrencia = null` e não exige os
blocos de animal/marcas. `flagrante = null` é resposta não registrada: o app **não** assume ausência nem
presença. Isso evita inferência silenciosa (contrariando Vazio ≠ zero).

### 4.6 Ninho
Existe apenas para `CD`. Não guarda cópia de nenhum campo da ocorrência.

| Campo | Tipo | Origem |
| --- | --- | --- |
| `id` | string | (projeto) — **não** é N_NINHO nem N_REGISTRO |
| `projeto_id`, `temporada_id`, `ocorrencia_id` | string | vínculo |
| `codigo_interno` | `string` | (projeto) — código curto de exibição, gerado localmente |
| `situacao` | `'I' \| 'T' \| 'P' \| null` | SITUACAO — sempre com CD (p. 3) |
| `historico_ninho` | `'PH'\|'PA'\|'PM'\|'PE'\|'SU'\|'NM'\|'OT'\|null` | HIST_NINHO — só com CD (p. 5) |
| `problema_incubacao` | `boolean \| null` | (projeto) — DÚVIDA 04 |
| `estado_acompanhamento` | `'AGUARDANDO' \| 'ATIVO' \| 'ABERTO' \| 'ENCERRADO'` | (projeto) — estado de **tela**, nunca SITUACAO nem HIST_NINHO (`DOMAIN_RULES` §1.3) |
| `criado_por`, `criado_em`, `atualizado_por`, `atualizado_em`, `versao` | — | trilha |

Leitura da localização original e do número de registro: `ninho.ocorrencia_id` → `Ocorrencia`
(`local_origem`, `numero_registro`). A imutabilidade da origem (`DOMAIN_RULES` §4.1) vale para a ocorrência:
`local_origem` não é editável depois de criado; correção exige nova transferência ou ajuste administrativo
auditado, nunca sobrescrita silenciosa.

### 4.7 Transferencia
Subcoleção do ninho. Registro próprio, append-only. **Dona** de `TEMP_TRANSF`, `N_NINHO` e `OVOS_TRANS`.

`id`, `projeto_id`, `ninho_id`, `destino` (`'CERCADO' | 'PRAIA'`), `cercado_id` (`string | null`, quando
`destino = 'CERCADO'`; `null` enquanto o cercado não estiver cadastrado — escopo da reserva de `N_NINHO`, §6),
`local_destino` (`Localizacao`), `data_transferencia` + `instante_transferencia` + `noite_referencia`,
`tempo_transferencia` (`A`…`E`, campo de campo, p. 4), `ovos_transferencia` (`number | null`, contagem
observada, p. 4), `numero_ninho_cercado` (`string | null`, só `destino = 'CERCADO'`, p. 4), `sequencia`
(`number | null`, ordem confirmada na sincronização; desempate de ordenação, §5), `responsavel_id`,
`observacoes`, `criado_em`, `criado_por`, `atualizado_por`, `atualizado_em`, `versao`.

Regras: `situacao = 'T'` ⇒ destino `CERCADO` e `numero_ninho_cercado` obrigatório; `situacao = 'P'` ⇒ destino
`PRAIA` com `praia_destino_codigo` e `local_km_destino` obrigatórios e `numero_ninho_cercado` proibido
(`DOMAIN_RULES` §4.7). A transferência **não** tem `ovos_furados` (§3.2).

### 4.8 Visita
Subcoleção do ninho. Acompanhamento cronológico. **Não existe no manual** — acréscimo do projeto.

`id`, `projeto_id`, `ninho_id`, `data_visita` + `noite_referencia`, `responsavel_id`, `condicao`
(texto com lista fechada do **projeto**, marcada como tal), `eventos[]`
(`predacao` | `mare` | `perda_marcacao` | `outro`), `observacoes`, `criado_em`, `criado_por`,
`atualizado_em`, `versao`. `condicao` não é `HIST_NINHO`: são grandezas diferentes (`DOMAIN_RULES` §1.3).

### 4.9 Abertura
Subcoleção do ninho: o ato de eclosão/abertura, com os dados biológicos coletados na escavação.

| Campo | Tipo | Origem |
| --- | --- | --- |
| `data_eclosao`, `instante_eclosao`, `noite_referencia_eclosao` | `string \| null` | DATA_ECLOS (p. 4) — emergência de **pelo menos um** filhote |
| `data_abertura`, `instante_abertura`, `noite_referencia_abertura` | `string \| null` | DATA_ABERT (p. 5) |
| `hora_primeiro_filhote`, `hora_ultimo_filhote` | `string \| null` | (projeto) |
| `vivos` | `number \| null` | VIVOS (p. 5) |
| `natimortos` | `number \| null` | NATIMORTOS (p. 6) |
| `ovos_nao_eclodidos` | `number \| null` | OVOS_N_ECL (p. 6) |
| `ovos_furados` | `number \| null` | OVOS_FURAD (p. 4) — dono único, ver §3.2 |
| `nao_viaveis` | `number \| null` | NAO_VIAVEIS (p. 4) — só `DC`, fora de `ovos_totais` |
| `ovos_totais` | `number \| null` | **derivado** (`DOMAIN_RULES` §5.1–5.2) |
| `percentual_vivos` | `number \| null` | **derivado** (§5.3) |
| `tempo_incubacao_dias` | `number \| null` | **derivado** (§5.4) |
| `responsavel_id`, `observacoes` | — | p. 4 |
| `projeto_id`, `criado_por`, `criado_em`, `atualizado_por`, `atualizado_em`, `versao` | — | vínculo e trilha |

Materialização opcional dos derivados, sempre com `derivados_formula_versao: 'v2'` (ver `DECISIONS.md` D-002).

### 4.10 Projeção mínima v2 por ninho

`projetos/{p}/consultas/{ninhoUUID}`: id, projeto_id, datas (OCORR/ECLOS/ABERT), ambiguas (mesmas chaves), projeto_versao_ref (versão do ninho), projecao_versao=2, operacao_id e os filtros praia_codigo/especie_codigo/temporada_id/situacao/historico_ninho/tipo_registro. Data ausente/divergente permanece null, jamais data escolhida silenciosamente.

Escrita atômica e regras conferem mapas/filtros contra ocorrência+ninho+abertura. Detalhes/número/localização são lidos da origem, sem cópias adicionais. Este contrato substitui as três linhas propostas por R02, devido ao limite de expressões do Firestore; justificativa D-020. Não confundir projeção técnica v2 com fórmula científica v2.

Metadados adicionais no backend: ninho.transferencia_inicial_id imutável (UUID ou null), operacao_id nos documentos; operações imutáveis com tipo/referência, conteúdo, caminhos, pré-imagens, revisão e confirmado_em = timestamp do servidor. Mapeadores de domínio preservam os campos científicos explicitamente. Marcador técnico de transferência é conservado pelo repositório ao atualizar ninho.

## 5. Derivados de leitura

### 5.1 Posição atual

```
posicao_atual = última Transferencia aceita ? local_destino : ocorrencia.local_origem
```

Ordenação determinística das transferências: `instante_transferencia` (quando existir) → `data_transferencia`
→ `sequencia` (confirmada na sincronização) → `criado_em` → `id`. Ordenar só por data do dia faz duas
transferências do mesmo dia inverterem a posição atual; por isso o instante e a sequência existem.

### 5.2 Tempo e número do cercado (visão do ninho)

- `tempo_transferencia` do ninho = `TEMP_TRANSF` da transferência que define a posição atual (§5.1); `null`
  quando o ninho nunca foi transferido.
- `numero_ninho_cercado` do ninho = `N_NINHO` da última transferência com `destino = 'CERCADO'`; `null`
  caso contrário. Nunca vem de digitação fora de uma transferência.

### 5.3 Abertura de referência

Um ninho pode ter mais de uma abertura (escavação parcial e reabertura). A regra é **explícita**, nunca
"a última que apareceu":

1. candidatas são as aberturas com `data_abertura` **ou** `instante_abertura` preenchido (abertura de fato
   realizada);
2. se houver **exatamente uma**, ela é a abertura de referência;
3. se houver **mais de uma** com dados biológicos (`vivos`, `natimortos`, `ovos_nao_eclodidos`,
   `ovos_furados`), o app **não escolhe sozinho**: a ficha e o relatório registram
   `abertura_ambigua = true` com a lista de candidatas e o usuário indica qual vale;
4. se houver mais de uma, mas apenas uma com dados biológicos, ela é a referência, e as demais são
   complementares (o relatório mostra as demais no histórico da ficha).

### 5.4 `OVOS_TRANS` em múltiplas transferências

Contrato técnico provisório, pendente de confirmação científica (DECISIONS): a exceção de `OVOS_TOT` (`DOMAIN_RULES` §5.2) usa a contagem observada **da transferência que define a
posição atual** (§5.1). Se essa transferência não tiver `ovos_transferencia`, o total fica vazio com motivo —
nunca `0` e nunca a contagem de outra transferência. Transferências anteriores continuam visíveis na ficha,
com o próprio valor.

## 6. Números oficiais, reserva e concorrência offline

`N_REGISTRO` (p. 1) e `N_NINHO` (p. 4) são os únicos números oficiais. O app **não** promete sequência
global offline nem garante oficialidade de unicidade antes da sincronização.

P03 usa reserva determinística `projetos/{p}/reservas/{tipo}:{escopo}/numeros/{numero}`. Tipo N_REGISTRO com escopo temporada ou '-' quando ausente; tipo N_NINHO com escopo cercado. Texto conserva zeros, não aceita separadores de caminho. Regras ligam a reserva ao documento de origem, número/escopo e operação. Reserva é imutável e atômica com origem/projeção/auditoria.

Escopo continua **provisório**, pendente da coordenação; não é garantia oficial de controle geral. Nenhum número é gerado automaticamente. Offline pode registrar o número recebido, mas ele é apenas pendente, ainda não reservado. Conflito não escolhe substituto. Primeiro N_REGISTRO pode ser atribuído em complemento auditado; número atribuído não é renumerado. Contrato puro R02 de reserva-v1 fica como referência histórica; o caminho SDK ativo está em src/data/nuvem.ts, D-019/D-021.

## 7. Consultas de relatório e índices

P03 consulta `projetos/{p}/consultas` com igualdade projeto_id e intervalo inclusivo no campo `datas.OCORR`, `datas.ECLOS` ou `datas.ABERT`, ordenado por data+ID e paginado (200). Filtros opcionais são aplicados aos metadados da consulta antes dos detalhes. Três índices ativos em firestore.indexes.json. O descritor puro R02 é utilizado para validar entrada, não traduzido literalmente em consulta SDK; D-020 explica a substituição técnica.

Consulta separada `datas.<criterio> == null` apura ausentes/ambiguidades com o mesmo projeto/filtros. Não contar ninhos fora do período sem base enumerada. Detalhes só dos selecionados; versão/operação da projeção e revisão global antes/depois conferem consistência. Mais de 5.000 documentos na leitura interrompe com aviso, não promete conjunto completo. A abertura oficial usa UUID do ninho como ID estável; complemento/correção preserva anterior na operação. Reabertura distinta bloqueada enquanto a pergunta científica está aberta.

A carga inicial da interface ainda lê o projeto inteiro, paginado, e os históricos; relatório usa consulta por período. Leituras são por documento, não por página; uso está sujeito às cotas Spark. Não prometer custo zero ilimitado. Índices de produção precisam estar READY; emulador não valida essa condição.

## 8. Exclusão e retenção

- Registros de campo não são apagados; correções criam nova versão e mantêm a pré-imagem em `operacoes`.
- Valores derivados podem ser recalculados a qualquer momento e são apagados com segurança, exceto quando
  materializados com `derivados_formula_versao`.
- Visitas e transferências só recebem acréscimo, nunca edição destrutiva.
- "Apagar ninho" é exclusão lógica (`excluido_em`, `excluido_por`), restrita a `coordenacao`, e o documento
  continua no banco para auditoria. A projeção correspondente recebe `excluido_em` e sai das consultas por
  período.
