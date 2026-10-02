# Modelo de Dados

Contrato de dados do app. As regras científicas estão em `DOMAIN_RULES.md`; os campos e nomes de exportação
em `FIELD_DICTIONARY.md`. Este documento define **onde cada dado mora** e **como ele é escrito**.

## 1. Convenções

| Item | Decisão |
| --- | --- |
| Datas de campo | `string` no formato `YYYY-MM-DD` (calendário do projeto, não civil) |
| Instantes | `string` ISO 8601 **com offset** (`2026-10-02T21:40:00-03:00`) |
| Hora de campo | `string` `HH:MM`, sem horário de verão (`DOMAIN_RULES` §3.4) |
| Ausente | `null`. Zero real é `0`. Indeterminado do manual é `'I'`/`'NI'`. Não aplicável é ausência + motivo |
| Identificador | `id: string` = UUID v4 gerado no dispositivo |
| Texto com zeros | `numero_registro`, `numero_ninho_cercado`, `marcas_*`: `string`, nunca `number` |
| Coordenadas | `number` com 5 casas; `datum: 'SIRGAS2000' \| 'WGS84'` |
| Dinheiro/quantidade | não se aplica |
| Campos derivados | `number \| null`, sempre com `*_derivado_de` e `*_formula_versao` |

Nomes de arquivo em pt-BR seguem o padrão observado no repositório (`ARCHITECTURE.md`). Nomes de campo e de
coleção em `snake_case` em inglês, por convenção estável para o Firestore. Colunas de exportação usam os
nomes do manual (`FIELD_DICTIONARY` §7).

## 2. Repositórios Firestore

```
projetos/{projetoId}                                  doc
projetos/{projetoId}/membros/{uid}                    doc
projetos/{projetoId}/temporadas/{temporadaId}         doc
projetos/{projetoId}/praias/{praiaId}                 doc
projetos/{projetoId}/ocorrencias/{ocorrenciaId}       doc
projetos/{projetoId}/ninhos/{ninhoId}                 doc
projetos/{projetoId}/ninhos/{ninhoId}/transferencias/{transferenciaId}  subcoleção
projetos/{projetoId}/ninhos/{ninhoId}/visitas/{visitaId}                subcoleção
projetos/{projetoId}/ninhos/{ninhoId}/aberturas/{aberturaId}           subcoleção
projetos/{projetoId}/contadores/{ano}                 doc   (ver §6)
```

Todo documento tem `projeto_id`. **Toda** consulta e **toda** regra filtra por ele: é o que isola os dados
entre projetos (`SECURITY.md`).

## 3. Por que "ficha do ninho" não é uma coleção

A ficha da tela é uma **visão** que reúne `Ocorrencia` + `Ninho` + `Transferencia[]` + `Visita[]` +
`Abertura[]` por meio dos relacionamentos abaixo. Não existe documento "ficha" com campos duplicados.

Consequências: um dado tem **um** dono; alterar a eclosão não reescreve a ocorrência; e um relatório pode
consultar só o que precisa. O que é derivado (`ovos_totais`, `percentual_vivos`, `tempo_incubacao_dias`) é
calculado na leitura a partir das fontes, e opcionalmente materializado com a versão da fórmula.

## 4. Entidades

### 4.1 Projeto
`id`, `nome`, `sigla`, `ativo`, `criado_em`. Dono da lista de praia, temporada e da equipe.
Sem vínculo com instituições reais: nome e sigla são livres.

### 4.2 Membro
`projetos/{projetoId}/membros/{uid}`: `uid`, `nome`, `email`, `papel`
(`consulta` | `campo` | `coordenacao`), `ativo`, `criado_em`, `criado_por`, `atualizado_em`.
O papel vem do registro, **nunca** do cliente: se o documento não existe, o usuário não tem acesso ao projeto.

### 4.3 Temporada
`id`, `nome` (ex.: `2026/2027`), `inicio`, `fim`, `ativo`. `inicio`/`fim` são datas do calendário do projeto.

### 4.4 Praia
`id`, `codigo` (código do SITAMAR, texto), `nome`, `praia_ativa`, `segmentada_em_km` (bool),
`origem_codigo` (`sitamar` | `pendente`). Praias cujo código ainda não foi cadastrado no SITAMAR entram com
`origem_codigo: 'pendente'` e aviso no formulário. O app **não cria** código de praia (`DOMAIN_RULES` §4.9).

### 4.5 Ocorrencia
Um lançamento de campo. Existe **sempre** que houve atividade, mesmo sem desova.

| Campo | Tipo | Origem |
| --- | --- | --- |
| `id` | string | (projeto) |
| `projeto_id`, `temporada_id`, `responsavel_id` | string | (projeto) |
| `numero_registro` | `string \| null` | N_REGISTRO (p. 1) |
| `tipo_ocorrencia` | `'CD' \| 'ML' \| 'SD' \| 'ND' \| 'PI'` | TIPO_OCORR (p. 2) |
| `tipo_registro` | `'REPRODUTIVO' \| 'NAO_REPRODUTIVO'` | (projeto) — fêmea morta na praia vai para o caderno de registros não reprodutivos (p. 2) |
| `verificacao_praia_realizada` | `boolean \| null` | (projeto) — obrigatória para `SD` (`DOMAIN_RULES` §2.2) |
| `data_ocorrencia` | `string \| null` | DATA_OCORR (p. 1) |
| `instante_ocorrencia` | `string \| null` | ISO com offset (p. 1) |
| `hora_ocorrencia` | `string \| null` | HORA_OCORR — só com flagrante (p. 1) |
| `noite_referencia` | `string \| null` | data de referência de campo (`DOMAIN_RULES` §3.2) |
| `flagrante` | `boolean \| null` | (projeto) — derivado da existência de `hora_ocorrencia` |
| `local_origem` | `Localizacao` | aninhado, imutável (§4.6) |
| `marcas_encontradas`, `marcas_colocadas`, `marcas_retiradas` | `string \| null` | (p. 2) |
| `especie_codigo` | `'CC' \| 'EI' \| 'LO' \| 'CM' \| 'DC' \| 'NI' \| null` | ESPECIE (p. 2) |
| `comprimento_casco`, `largura_casco` | `number \| null` | (p. 2) — unidade indefinida, DÚVIDA 01 |
| `tumores` | `'S' \| 'N' \| 'I' \| null` | TUMORES (p. 2) |
| `coleta_material_biologico` | `string[] \| null` | (p. 2) |
| `evidencia_interacao_pesca` | `boolean \| null` | (p. 2) |
| `tipo_evidencia` | `string \| null` | (p. 2) |
| `palavras_chave` | `string[]` | (p. 5–6) |
| `observacoes` | `string \| null` | OBS (p. 1) |
| `ninho_id` | `string \| null` | vínculo: preenchido **só** quando `tipo_ocorrencia = 'CD'` |
| `criado_por`, `criado_em`, `atualizado_por`, `atualizado_em`, `versao` | — | trilha |

Chave de ligação: quando `tipo_ocorrencia = 'CD'`, a operação de aplicação cria o `Ninho` e grava
`ninho_id` na ocorrência. **A ocorrência continua existindo** — ela é o registro do lançamento; o ninho é o
resultado do manejo. `ML`, `SD`, `ND`, `PI` e registros não reprodutivos têm `ninho_id = null` sempre.

### 4.6 Ninho
Existe apenas para `CD`.

| Campo | Tipo | Origem |
| --- | --- | --- |
| `id` | string | (projeto) — **não** é N_NINHO nem N_REGISTRO |
| `projeto_id`, `temporada_id`, `ocorrencia_id` | string | vínculo |
| `codigo_interno` | `string` | (projeto) — código curto de exibição, gerado localmente |
| `numero_registro` | `string \| null` | N_REGISTRO herdado da ocorrência (p. 1) |
| `local_origem` | `Localizacao` | **imutável** (p. 1) |
| `local_atual` | `Localizacao` | **derivada** do histórico (§5) |
| `situacao` | `'I' \| 'T' \| 'P' \| null` | SITUACAO — sempre com CD (p. 2–3) |
| `tempo_transferencia` | `'A' \| 'B' \| 'C' \| 'D' \| 'E' \| null` | TEMP_TRANSF (p. 3) |
| `historico_ninho` | `'PH'\|'PA'\|'PM'\|'PE'\|'SU'\|'NM'\|'OT'\|null` | HIST_NINHO — só com CD (p. 4) |
| `numero_ninho_cercado` | `string \| null` | N_NINHO — só quando `situacao = 'T'` (p. 3) |
| `problema_incubacao` | `boolean \| null` | (projeto) — DÚVIDA 04 |
| `abertura_ids` | `string[]` | vínculos |
| `estado_acompanhamento` | `'AGUARDANDO' \| 'ATIVO' \| 'ABERTO' \| 'ENCERRADO'` | (projeto) — estado de **tela**, nunca SITUACAO nem HIST_NINHO (`DOMAIN_RULES` §1.3) |
| `criado_por`, `criado_em`, `atualizado_por`, `atualizado_em`, `versao` | — | trilha |

`Localizacao` = `{ praia_id, praia_codigo, local_km, bairro, referencia, latitude, longitude, datum,
fonte_gps, precisao_gps_m, capturado_em }`. `praia_id`/`praia_codigo` e coordenadas são `string`/`number | null`
conforme §1. `local_origem` não é editável depois de criado: a correção exige um novo registro de
transferência ou um ajuste administrative auditado, nunca sobrescrita silenciosa.

### 4.7 Transferencia
Subcoleção do ninho. Registro próprio, imutável depois de confirmado.

`id`, `projeto_id`, `ninho_id`, `destino` (`'CERCADO' | 'PRAIA'`), `local_destino` (`Localizacao`),
`data_transferencia` + `instante_transferencia` + `noite_referencia`, `tempo_transferencia`
(`A`…`E`, campo de campo), `ovos_transferencia` (`number | null`), `numero_ninho_cercado` (`string | null`,
só `destino = 'CERCADO'`), `responsavel_id`, `observacoes`, `criado_em`, `criado_por`.

Regras: `situacao = 'T'` ⇒ destino `CERCADO` e `numero_ninho_cercado` obrigatório; `situacao = 'P'` ⇒ destino
`PRAIA` com `praia_destino_codigo` e `local_km_destino` obrigatórios e `numero_ninho_cercado` proibido
(`DOMAIN_RULES` §4.7).

### 4.8 Visita
Subcoleção do ninho. Acompanhamento cronológico. **Não existe no manual** — acréscimo do projeto.

`id`, `projeto_id`, `ninho_id`, `data_visita` + `noite_referencia`, `responsavel_id`, `condicao`
(texto com lista fechada do **projeto**, marcada como tal), `eventos[]`
(`predacao` | `mare` | `perda_marcacao` | `outro`), `observacoes`, `criado_em`, `criado_por`.
`condicao` não é `HIST_NINHO`: são grandezas diferentes (`DOMAIN_RULES` §1.3).

### 4.9 Abertura
Subcoleção do ninho: o ato de eclosão/abertura, com os dados biológicos coletados na escavação.

| Campo | Tipo | Origem |
| --- | --- | --- |
| `data_eclosao`, `instante_eclosao`, `noite_referencia_eclosao` | `string \| null` | DATA_ECLOS (p. 3) |
| `data_abertura`, `instante_abertura`, `noite_referencia_abertura` | `string \| null` | DATA_ABERT (p. 4) |
| `hora_primeiro_filhote`, `hora_ultimo_filhote` | `string \| null` | (projeto) |
| `vivos` | `number \| null` | VIVOS (p. 4) |
| `natimortos` | `number \| null` | NATIMORTOS (p. 5) |
| `ovos_nao_eclodidos` | `number \| null` | OVOS_N_ECL (p. 5) |
| `ovos_furados` | `number \| null` | OVOS_FURAD (p. 5) |
| `nao_viaveis` | `number \| null` | NAO_VIAVEIS — só `DC`, fora de `ovos_totais` (p. 3) |
| `ovos_totais` | `number \| null` | **derivado** (p. 5, §5.1–5.2) |
| `percentual_vivos` | `number \| null` | **derivado** (p. 5, §5.3) |
| `tempo_incubacao_dias` | `number \| null` | **derivado** (p. 5, §5.4) |
| `responsavel_id`, `observacoes` | — | p. 4 |

Materialização opcional dos derivados, sempre com `derivados_formula_versao: 'v1'`.

## 5. Posição atual: derivada, nunca digitada

```
local_atual = última Transferencia aceita ? local_destino : ninho.local_origem
```
`local_atual` é recalculado na leitura a partir das transferências ordenadas por
`data_transferencia`. Nunca vem de digitação do usuário. Apagar transferência exige confirmação explícita e
`DECISIONS.md` registra o caso.

## 6. Números oficiais e concorrência offline

`N_REGISTRO` (p. 1) e `N_NINHO` (p. 3) são os únicos números oficiais. O app **não** promete sequência
global offline.

Estratégia implementável:
1. o dispositivo gera `id` (UUID v4) e pode gravar um registro **sem** número oficial, com
   `numero_registro = null` e pendência visível;
2. ao sincronizar, o servidor verifica unicidade do número dentro do projeto; em conflito, o registro fica
   com `conflito_numero` e o usuário **escolhe** o número livre — o app não escolhe sozinho;
3. a numeração manual pode ter lacunas (o manual manda inserir sem renumerar, p. 1), logo **não** é
   obrigatório ser contígua nem começar em 1.

Não garantido offline: que o número esteja livre no momento da digitação. É por isso que o registro
nasce sem número. Ver `OFFLINE.md`.

## 7. Índices Firestore propostos

| Índice | Consulta que justifica |
| --- | --- |
| `ocorrencias`: `projeto_id ASC`, `data_ocorrencia ASC`, `__name__ ASC` | relatório por período/critério ocorrência |
| `ocorrencias`: `projeto_id ASC`, `data_ocorrencia DESC` | lista de lançamentos recentes |
| `ocorrencias`: `projeto_id ASC`, `ninho_id ASC` | descobrir CD sem ninho vinculado |
| `ninhos`: `projeto_id ASC`, `situacao ASC`, `atualizado_em DESC` | painel de acompanhamento |
| `ninhos`: `projeto_id ASC`, `temporada_id ASC`, `atualizado_em DESC` | filtro por temporada |
| subcoleção `aberturas`: `data_eclosao ASC` | relatório por eclosão dentro do ninho |
| subcoleção `aberturas`: `data_abertura ASC` | relatório por abertura |
| `ninhos` aninhado: `praia_origem ASC`, `local_origem ASC` | filtro por praia/km |

Consultas de relatório são sempre filtradas por período no servidor. **Não** baixar o banco para montar
relatório (`REPORT_SPEC.md`).

## 8. Exclusão e retenção

- Registros de campo não são apagados; correções criam novo valor e mantêm o anterior em `historico`.
- Valores derivados podem ser recalculados a qualquer momento e são apagados com segurança, exceto quando
  materializados com `derivados_formula_versao`.
- Visitas e transferências só recebem acréscimo, nunca edição destrutiva.
- "Apagar ninho" é exclusão lógica (`excluido_em`, `excluido_por`), restrita a `coordenacao`, e o documento
  continua no banco para auditoria.