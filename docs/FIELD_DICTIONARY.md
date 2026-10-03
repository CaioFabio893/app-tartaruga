# Dicionário de Campos — ficha de campo SITAMAR

Fonte primária: manual "MANUAL PARA PREENCHIMENTO DAS FICHAS DE CAMPO PARA ÁREAS DE REPRODUÇÃO",
7 páginas escaneadas. Página `p.N` = N-ésima página do manual.
Extração inicial por OCR local. Revisão Codex corrigiu os campos destacados em REVISAO-BASE.md e os localizadores da tabela contra as imagens. OCR não é fonte definitiva; conferir citações narrativas antes de usá-las como regra.

> Este dicionário é a ponte entre o manual e o modelo de dados. Não substitui o manual.
> Texto de consulta: `docs/references/MANUAL-TRANSCRITO.md`, fornecido pelo usuário em 02/10/2026.
> Buscar somente o campo necessário; não carregar todas as páginas/imagens em cada tarefa.
> Campos com marca **(projeto)** NÃO constam no manual: são acréscimos do projeto e estão autorizados em
> `docs/PRODUCT.md`. Campos com marca **(fora de escopo)** existem no manual mas foram deliberadamente
> removidos do app (decisão em `docs/DECISIONS.md`).

## Como ler as colunas

- **Nome interno**: identificador em `snake_case` usado no código e no Firestore. Nunca é o mesmo conceito
  que "número de registro" ou "número do ninho no cercado".
- **Unidade/Formato**: `—` quando o manual não informa. **Nunca inventar unidade.**
- **Condição**: quando preencher, conforme o manual. "sempre" = obrigatório no contexto indicado.
- **Saída na exportação**: nome do campo no relatório/CSV. Quando o manual traz duas grafias, ambas são
  aceitas na importação; na exportação usamos a do manual e registramos a divergência em `DOMAIN_RULES.md`.
- Números de marca, número do cercado e número de registro são **texto**, para preservar zeros iniciais.

---

## 1. Identificação e localização do lançamento (p. 1)

| Nome original | Nome interno | Tipo | Unidade/Formato | Valores | Condição | Saída na exportação | Origem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N_REGISTRO (Número de Registro) | `numero_registro` | string (texto) | número único do controle geral | atribuído pelo controle geral | atribuído no preenchimento do controle geral; preferir ordem cronológica; ocorrências com data posterior entram **sem renumerar** | N_REGISTRO | p. 1 |
| DATA_OCORR (Data de Ocorrência) | `data_ocorrencia` + `data_ocorrencia_instantaneo` + `data_ocorrencia_referencia_noite` | string `YYYY-MM-DD` + ISO local com offset | calendário do projeto | data ou ausência justificada | sempre com a **data da noite em questão**; mudança de data só após 12:00h; **em branco** quando a desova for localizada depois (ex.: na eclosão) | DATA_OCORR | p. 1 |
| HORA_OCORR (Hora de Ocorrência) | `hora_ocorrencia` | string `HH:MM` | hora local | — | **somente quando houver flagrante**; desconsiderar horário de verão | HORA_OCORR | p. 1 |
| PRAIA | `praia_codigo` | string | código pré-estabelecido | códigos do SITAMAR | sempre; códigos novos **só** pela Gerência do SITAMAR, via solicitação direta da coordenação regional | PRAIA | p. 1 |
| LOCAL_KM | `local_km` | string | trecho de 1 km | — | quando a praia for dividida em trechos | LOCAL_KM | p. 1 |
| LATITUDE E LONGITUDE | `latitude`, `longitude` | number | graus decimais, **cinco casas** (`XX,XXXXX`) | SIRGAS2000 (padrão); `wGS84` em GPS antigo | importante para representação espacial, sobretudo em alto-mar; também para currais de pesca | LATITUDE, LONGITUDE | p. 1 |
| (datum implícito) | `datum` | enum | — | `SIRGAS2000` \| `WGS84` | o manual declara SIRGAS2000 como datum de coleta e WGS84 como alternativa | DATUM | p. 1 |
| OBS (Observação) | `observacoes` | string | texto livre | — | informações complementares, **objetivas e restritas ao essencial** | OBS / OBSERVAÇÕES | p. 1 |
| PALAVRAS-CHAVE | `palavras_chave` | string[] | sem acento, sem cedilha, **no singular** | lista oficial (ver §6) | para facilitar a busca no arquivo de dados | PALAVRAS_CHAVE | p. 1–2 |
| (projeto) | `fonte_gps`, `precisao_gps_m`, `capturado_em` | enum / number / ISO | metros | `dispositivo` \| `manual` | para distinguir GPS de lançamento de coordenada digitada | FONTE_GPS, PRECISAO_GPS_M, CAPTURADO_EM | projeto |
| (projeto) | `projeto_id`, `temporada_id`, `responsavel_id`, `criado_por`, `criado_em`, `atualizado_em`, `atualizado_por` | id / ISO | — | — | trilha de autoria; "responsável" é quem preencheu a ficha de campo | — | projeto |

## 2. Animal, marcas e biometria (p. 1–2)

Marcas e biometria dependem da observação do animal. Espécie pode ser identificada por filhotes ou na
abertura, mesmo sem flagrante da fêmea. Coleta biológica pode ser do ninho: não ocultar essa informação
somente porque a fêmea não foi observada.

| Nome original | Nome interno | Tipo | Unidade/Formato | Valores | Condição | Saída na exportação | Origem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MARCAS_ENC (Marcas encontradas) | `marcas_encontradas` | string | número + código de letras (texto) | — | no flagrante; **marcas retiradas também entram aqui** | MARCAS_ENC | p. 2 |
| MARCAS_COL (Marcas colocadas) | `marcas_colocadas` | string | até **2** por tartaruga | — | no flagrante; uma em cada nadadeira anterior; se já houver uma, colocar a segunda | MARCAS_COL | p. 2 |
| MARCAS_RET (Marcas retiradas) | `marcas_retiradas` | string | número + código de letras (texto) | — | critério considera **localização e estado de conservação**; o código também vai para MARCAS_ENC; devolver sempre as marcas ao executor de base | MARCAS_RET | p. 2 |
| ESPECIE | `especie_codigo` | enum | — | `CC` \| `EI` \| `LO` \| `CM` \| `DC` \| `NI` | no flagrante, pela observação dos filhotes, **ou na abertura** (cascas/embriões); na impossibilidade → `NI`; suspeita de híbrido → `HIBRIDO` em OBS | ESPECIE | p. 2 |
| COMP_CASCO (Comprimento do casco) | `comprimento_casco` | number | cm (confirmado pelo usuário, D-022; manual não informa unidade) | — | conforme protocolo de marcação e biometria (anexo não anexado) | COMP_CASCO | p. 2 |
| LARG_CASCO (Largura do casco) | `largura_casco` | number | cm (confirmado pelo usuário, D-022; manual não informa unidade) | — | idem | LARG_CASCO | p. 2 |
| TUMORES | `tumores` | enum | — | `S` \| `N` \| `I` | **sempre** preenchido no flagrante | TUMORES | p. 3 |
| COLETA_MATERIAL_BIOLOGICO | `coleta_material_biologico` | string[] | — | `DNA`, `tumor`, `epibiontes`, `etc.` | assinalar quando houve coleta para análise | COLETA_MATERIAL_BIOLOGICO | p. 3 |
| EVIDENCIA_INT_PESCA | `evidencia_interacao_pesca` | boolean | — | — | quando o animal apresentar evidência de interação com pesca (anzois, pedagos de linha, rede etc.) | EVIDENCIA_INT_PESCA | p. 3 |
| TIPO_EVIDENCIA | `tipo_evidencia` | string | — | pré-cadastrado no SITAMAR | citar o tipo; se não cadastrado, solicitar cadastro à coordenação do SITAMAR; buscar maior especificidade | TIPO_EVIDENCIA | p. 3 |

## 3. Ocorrência e manejo (p. 2–3)

| Nome original | Nome interno | Tipo | Unidade/Formato | Valores | Condição | Saída na exportação | Origem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TIPO_OCORR (Tipo de Ocorrência) | `tipo_ocorrencia` | enum | — | `CD` \| `ML` \| `SD` \| `ND` \| `PI` | sempre | TIPO_OCORR | p. 3 |
| SITUACAO | `situacao` | enum | — | `I` \| `T` \| `P` | **sempre quando TIPO_OCORR = CD** | SITUACAO | p. 3 |
| TEMP_TRANSF (Tempo de transferência) | `tempo_transferencia` | enum | — | `A` \| `B` \| `C` \| `D` \| `E` | intervalo entre a postura e a transferência | TEMP_TRANSF | p. 4 |
| OVOS_TRANS | `ovos_transferencia` | number | ovos | — | contagem observada **no momento da transferência**, informada pela equipe, tanto para cercado quanto para praia; não é cálculo derivado | OVOS_TRANS (ver aliases) | p. 4 |
| OVOS_FURAD | `ovos_furados` | number | ovos | — | total de ovos furados durante a localização, retirada e/ou transferência | OVOS_FURAD | p. 4 |
| NAO_VIAVEIS | `nao_viaveis` | number | ovos | — | **somente para `DC` (D. coriacea)**; ovos anômalos presentes em porcentagem significativa da espécie; **não entra em OVOS_TOT** | NAO_VIAVEIS | p. 4 |
| N_NINHO (Número do ninho) | `numero_ninho_cercado` | string (texto) | número do ninho **dentro do cercado** | — | **apenas** quando houve transferência para o cercado; entrada e saída do ninho no cercado | N_NINHO | p. 4 |
| PRAIA_DEST_P (Praia de destino) | `praia_destino_codigo` | string | código pré-estabelecido | mesmos códigos de PRAIA | **apenas** quando SITUACAO = P; pode ser outra praia ou a mesma | PRAIA_DEST_P | p. 4 |
| LOCAL_KM_P | `local_km_destino` | string | trecho | — | **apenas** quando SITUACAO = P | LOCAL_KM_P | p. 4 |
| (projeto) | `local_origem_*, `posicao_atual_*` | — | — | — | localização original é **imutável**; a atual é derivada do histórico de transferências (ver `ARCHITECTURE.md`) | — | projeto |
| (projeto) | `transferencias[]` | coleção | — | — | cada transferência é registro próprio, com destino, data/hora, categoria de tempo, ovos e nº do cercado quando aplicável | — | projeto |

## 4. Eclosão, abertura e histórico (p. 4–6)

| Nome original | Nome interno | Tipo | Unidade/Formato | Valores | Condição | Saída na exportação | Origem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DATA_ECLOS (Data de eclosão) | `data_eclosao` (+ instante e referência de noite) | string | calendário do projeto | — | data da **emergência de pelo menos um filhote**; filhotes emergidos **até as 12:00h** contam como a noite anterior; mesmo padrão de DATA_OCORR | DATA_ECLOS | p. 4 |
| DATA_ABERT (Data de abertura) | `data_abertura` (+ instante e referência de noite) | string | calendário do projeto | — | data da escavação; normalmente no dia posterior à eclosão, pela manhã (até 09:00h) ou à tarde (após 16:00h); mesmo padrão de DATA_OCORR | DATA_ABERT | p. 5 |
| HIST_NINHO (Histórico do Ninho) | `historico_ninho` | enum | — | `PH` \| `PA` \| `PM` \| `PE` \| `SU` \| `NM` \| `OT` | **somente** quando TIPO_OCORR = CD; sempre complementar em OBS | HIST_NINHO | p. 5 |
| VIVOS | `vivos` | number | filhotes | — | filhotes vivos **emergidos ou retidos** no momento da escavação; em ninho in situ conta pelo número de **cascas rompidas**; filhotes que morrerem antes de chegar ao mar **também são vivos** (constar em OBS) | VIVOS | p. 5 |
| NATIMORTOS | `natimortos` | number | filhotes | — | quebraram a casca ou saíram, mas morreram na subida à superfície; separar as cascas destes para não superestimar os vivos | NATIMORTOS | p. 6 |
| OVOS_N_ECL (Ovos não eclodidos) | `ovos_nao_eclodidos` | number | ovos | — | ovos que não eclodiram durante a incubação | OVOS_N_ECL | p. 6 |
| OVOS_TOT | `ovos_totais` | number (**derivado**) | ovos | — | ver `DOMAIN_RULES.md` §5; preenchido com os dados da abertura; **não digitar no computador** | OVOS_TOT | p. 6 |
| PCT_VIVOS | `percentual_vivos` | number (**derivado**) | percentual | — | ver `DOMAIN_RULES.md` §5; só CD + SU + OVOS_TOT > 0; **não digitar no computador** | PCT_VIVOS | p. 6 |
| TEMP_INCUB (Tempo de incubação) | `tempo_incubacao_dias` | number (**derivado**) | dias | — | ver `DOMAIN_RULES.md` §5; só CD + SU e datas preenchidas; **não digitar no computador** | TEMP_INCUB | p. 6 |
| FOTOGRAFIA | — | — | — | — | **(fora de escopo)** o manual prevê carga de imagens no SITAMAR; este projeto não tem foto, câmera, upload nem Storage | omitido | p. 6 |

## 5. Adicionais do projeto (não constam no manual)

| Nome interno | Papel | Observação |
| --- | --- | --- |
| `id` (UUID v4) | identificador técnico do registro | gerado no dispositivo; permite cadastro offline; **não** é número de registro nem N_NINHO |
| `projeto_id` | isolamento de dados | toda consulta é filtrada por projeto |
| `temporada_id` | agrega por temporada de nidificação | filtro de relatório |
| `responsavel_id` | quem preencheu a ficha de campo | o manual fala em "executores de base" e "controle geral", sem código próprio |
| `visitas[]` (coleção separada) | acompanhamento cronológico | o manual **não** tem campo de visitas; é acréscimo do projeto |
| `estado_acompanhamento` | selo visual da lista | **não** é SITUACAO nem HIST_NINHO; apenas estado de tela |
| `area_tipo` | `ESTUDO_INTENSO` \| `PROTECAO` | o manual distingue os dois regimes de registro (p. 1); ver DÚVIDA 06 |
| `bairro`, `referencia` | bairro e local/endereço | acréscimos solicitados pelo projeto |
| `problema_incubacao` (boolean \| null) | condição da **exceção** do OVOS_TOT | **não consta no manual**; ver DÚVIDA 04 |
| `relatorio_parcial`, `sincronizado_em` | marcação de exportação offline parcial | ver `docs/OFFLINE.md` |

## 6. Tabela de códigos (p. 2–4)

### Espécie (p. 2)

| Código | Nome científico | Anotação manuscrita (conferida no PDF; não é código de espécie) | Origem |
| --- | --- | --- | --- |
| CC | *Caretta caretta* | Cabeçuda/mestiça (anotação; suspeita de híbrido deve ir em OBS) | p. 2 |
| EI | *Eretmochelys imbricata* | Pente (anotação manuscrita conferida) | p. 2 |
| LO | *Lepidochelys olivacea* | Oliva | p. 2 |
| CM | *Chelonia mydas* | Tartaruga-verde | p. 2 |
| DC | *Dermochelys coriacea* | Couro (anotação manuscrita conferida) | p. 2 |
| NI | — | **Não identificada** | p. 2 |

### Tipo de ocorrência (p. 3)

| Código | Significado |
| --- | --- |
| CD | **Com Desova** — a tartaruga finalizou o processo de postura |
| ML | Meia Lua — subida da fêmea sem realizar nenhuma etapa do processo de postura (trajetória em "U") |
| SD | Sem Desova — a fêmea executou uma ou mais etapas (confeção da cama, cova) mas não colocou ovos; classificar como SD sempre que a verificação na praia não tiver encontrado desova e se descartou interrupção por perturbação externa (ver `PI`) |
| ND | Não Determinado — ocorrência informada que **não** foi confirmada pela equipe técnica |
| PI | Processo de Desova Interrompido — interrompido por perturbação humana ou animal, em qualquer etapa, desde a saída da fêmea do mar. Concluída normalmente a atividade na praia → `CD`, `SD`, `ML` ou `ND` |

### Situação (p. 3) — técnica de conservação, sempre com TIPO_OCORR = CD

| Código | Significado |
| --- | --- |
| I | Desova in situ — **também** usada quando a desova foi roubada, predada ou perdida **antes** da decisão técnica de conservação |
| T | Desova transferida para o cercado de incubação |
| P | Desova transferida para a praia |

### Tempo de transferência (p. 4)

| Código | Significado |
| --- | --- |
| A | até 6 horas após a postura |
| B | de 6 a 12 horas; sem horário conhecido da postura, ninhos enterrados **até as 09:00h** da manhã |
| C | de 12 a 24 horas; sem horário conhecido da postura, ninhos enterrados **após 09:00h** da manhã |
| D | mais de 24 horas após a postura; normalmente apresentam "pólo branco" (desenvolvimento embrionário mais avançado) |
| E | mais de 15 dias após a postura |

> Há **sobreposição** entre D e E no texto do manual (D = "> 24 h", E = "> 15 dias"). D já cobre
> o intervalo entre 24 h e 15 dias. A dúvida é a precedência após 15 dias; manter seleção explícita.

### Tumores (p. 3) — sempre preenchido no flagrante

| Código | Significado |
| --- | --- |
| S | sim, presença de tumores |
| N | não, ausência de tumores |
| I | indeterminado, a tartaruga não foi examinada |

### Histórico do ninho (p. 5) — somente quando TIPO_OCORR = CD

| Código | Significado |
| --- | --- |
| PH | Predação humana, independentemente do número de ovos predados |
| PA | Predação por animais silvestres ou domésticos, independentemente do número de ovos predados |
| PM | Ninho perdido pela ação da maré, independentemente do número de ovos retirados pelo mar |
| PE | Ninho perdido pela retirada das estacas de marcação |
| SU | Ninho com sucesso: a incubação se desenvolveu até o final, com a coleta dos dados de abertura, independentemente da porcentagem de vivos |
| NM | Acompanhamento não realizado por decisão prévia da equipe; **não usar NM** para localização perdida (PE) nem para ninho localizado somente após o nascimento (p. 5) |
| OT | Outros casos de interferência no desenvolvimento do ninho (eclosão detectada mas ninho predado ou retirado pelo mar antes da abertura; ovos furados por "curiosos" ou veículos etc.) — **sempre explicar em OBS** |

### Palavras-chave (p. 6–7)

Gravadas **sem acento, sem cedilha e no singular** (p. 1–2).

`ALBINO` · `ANOMALO` · `CACHORRO` · `CARANGUEJO` · `CICATRIZ` · `DNA` · `EPIBIONTE` · `FORMIGA` ·
`HIBRIDO` · `LAGARTO` · `MUTILADA` · `PESCA` · `PORCO` · `RAPOSA` · `RATO` · `RAIZ`

Observações da fonte: `ANOMALO` = ovos deformados encontrados nos ninhos, **exceto** para *D. coriacea*
(ver `NAO_VIAVEIS`); `CACHORRO`/`PORCO`/`RATO`/`RAPOSA`/`FORMIGA`/`LAGARTO`/`CARANGUEJO` = atividade
relacionada ao animal; `CICATRIZ` = cicatriz nas nadadeiras indicando marcação anterior; `DNA` = houve
coleta de material (do ninho ou da fêmea) para pesquisa; `EPIBIONTE` = epibiontes atrapalhando a tomada
de medidas do casco; `MUTILADA` = fêmea com ferimentos ou falta de partes de membros/carapaça;
`PESCA` = vestígios que evidenciem interação com atividade pesqueira; `RAIZ` = presença de raízes;
`ALBINO` = animais sem pigmentação (filhotes ou adultos).

## 7. Aliases de exportação

| Forma manual | Forma alternativa registrada pelo projeto | Situação |
| --- | --- | --- |
| `OVOS_TRANS` (p. 3, p. 5) | `OVOS_TRANSF` | **o manual não usa TRANSF**; ver DÚVIDA 03 |
| `OVOS_FURAD` (p. 3, p. 5) | `OVOS_FUR` | **o manual não usa FUR**; ver DÚVIDA 03 |
| `OBS` (p. 1) | `OBSERVAÇÕES` | alias do projeto; o manual usa `OBS` |

Regra: aceitar as duas grafias na importação; exportar a do manual; registrar a decisão em `DECISIONS.md`
quando a coordenação definir o nome oficial de interchange.

## 8. Itens deliberadamente fora do escopo

- `FOTOGRAFIA` e carga de imagens no SITAMAR (p. 5) — sem fotos, câmera, upload ou Storage no app.
- Anexos **não anexados** a este manual, citados e necessários: `PROTOCOLO PARA MARCAÇÃO E BIOMETRIA DE
  TARTARUGAS MARINHAS` (p. 2) e `PRANCHAS AUXILIARES PARA IDENTIFICAÇÃO DAS ESPÉCIES DE TARTARUGAS
  MARINHAS` (p. 2). Unidade cm confirmada pelo usuário em D-022; os anexos ainda são necessários para o protocolo de medição.
- Integração com o SITAMAR: os códigos de praia e de tipo de evidência são mantidos no SITAMAR
  (p. 1, p. 2). Este app não é uma via de cadastro desses códigos.
