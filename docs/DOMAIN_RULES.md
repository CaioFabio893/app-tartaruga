# Regras de Domínio — ninhos de tartarugas

Fonte: manual "MANUAL PARA PREENCHIMENTO DAS FICHAS DE CAMPO PARA ÁREAS DE REPRODUÇÃO" (7 páginas).
`(p.N)` cita a página do manual. `FIELD_DICTIONARY.md` traz os campos; aqui ficam as **regras**.
Cada regra é implementável e testável. Onde o manual é ambíguo, a regra **para** e vira dúvida numerada (§8).

## 1. Natureza dos dados

1.1 Os campos cuja descrição diz "não devendo ser digitado no computador" são **derivados** no app:
`OVOS_TOT`, `PCT_VIVOS`, `TEMP_INCUB` (p. 5) e `OVOS_TRANS` (p. 5). O usuário **não** os digita; o app os
calcula e mantém o valor de origem quando existir. Nenhum cálculo é digitado livremente.

1.2 **Vazio ≠ zero ≠ indeterminado ≠ não aplicável.** Representação obrigatória:
- ausente/não observado → `null`;
- zero observado de fato → `0`;
- indeterminado pelo próprio manual → `I` (tumores) ou `NI` (espécie);
- não aplicável → ausência do campo mais o motivo (`campo_nao_aplicavel`).
Nunca usar `0` como padrão de campo não observado.

1.3 `SITUACAO` (I/T/P) é **técnica de conservação**. `HIST_NINHO` é **desfecho do acompanhamento** do ninho.
O estado de acompanhamento da interface é um terceiro campo, sem relação direta com os dois.
`estado_acompanhamento` nunca é gravado em `situacao` nem em `historico_ninho`.

## 2. Ocorrência e ninho

2.1 `TIPO_OCORR = CD` significa que a tartaruga **finalizou a postura** (p. 2). Somente `CD` cria ninho.
`ML`, `SD`, `ND` e `PI` são ocorrências **sem desova** e **não criam ninho**.

2.2 `SD` só é válido depois de verificada a praia e descartada a possibilidade de o processo ter sido
interrompido por perturbação externa (p. 2). Havendo interrupção por perturbação humana ou animal, em
qualquer etapa desde a saída da fêmea do mar, o tipo é `PI` (p. 2). Se a atividade na praia foi concluída
normalmente, o tipo assume `CD`, `SD`, `ML` ou `ND` (p. 2). Esta verificação é **obrigatória** e precisa ser
registrada (`verificacao_praia_realizada`) — não basta permitir que o usuário escolha `SD`.

2.3 `ND` é para ocorrência **informada e não confirmada** pela equipe técnica (p. 2). Não use `ND` para
"não sei classificar".

2.4 Fêmea morta na praia, com ou sem interrupção do processo de desova, **não** entra na ficha de campo
reprodutiva: vai para o caderno de registros não reprodutivos (p. 2). O app guarda esse registro como
ocorrência com `tipo_registro = NAO_REPRODUTIVO`, sem criar ninho.

2.5 `SITUACAO` **deve sempre** ser preenchida quando `TIPO_OCORR = CD` (p. 2).

2.6 Regime de registro (p. 1): em **áreas de estudo intenso** qualquer ocorrência de tartaruga é registrada;
em **áreas de proteção** é suficiente o registro das ocorrências de desova. O regime do projeto precisa ser
confirmado (DÚVIDA 06). Até a confirmação, o app não bloqueia registro por regime.

## 3. Datas — a regra mais sensível do projeto

3.1 O calendário do projeto **não** é o calendário civil. `DATA_OCORR` recebe sempre **a data da noite em
questão**, "desconsiderando-se a mudança de data real a partir da 0:00h", e "a mudança de data somente será
efetuada após as 12:00h" (p. 1).

3.2 Algoritmo derivado de um instante local (data civil `d` + hora local `t`):

```
data_referencia_noite = t <= 12:00 ? d - 1 dia : d
```

O mesmo padrão vale para `DATA_ECLOS` (p. 3) e `DATA_ABERT` (p. 4): os três campos usam o mesmo código de data.
Em `DATA_ECLOS` o manual é explícito: "filhotes emergidos até as 12:00h consideram-se com a data de eclosão
na noite anterior" (p. 3).

3.3 **Limite exato de 12:00.** O manual diz "até as 12:00h" (p. 3) e "após as 12:00h" (p. 1). Adotamos
`t <= 12:00` → noite anterior, `t > 12:00` → dia corrente, ou seja **12:00:00 pertence à noite anterior**.
Isto está registrado como decisão em `DECISIONS.md`; se a coordenaçãoGMT confirmar o contrário, muda-se um
único ponto do código e os testes.

3.4 São armazenados **separadamente**: o instante real (ISO local com offset), o fuso/deslocamento e a data
de referência de campo. `HORA_OCORR` desconsidera o horário de verão (p. 1), logo o offset gravado é o real
da ocorrência, e a redução para "hora de campo" nunca usa relógio de verão.

3.5 `HORA_OCORR` só é preenchida **quando houver flagrante** (p. 1). Sem flagrante, o campo permanece
`null`. Não inventar horário a partir de meia-noite.

3.6 `DATA_OCORR` **permanece em branco** quando a desova foi localizada posteriormente — o manual dá como
exemplo a ocasião da eclosão (p. 1). Nesse caso o registro de abertura/eclosão existe com as próprias datas,
e `data_ocorrencia = null` porque não houve data de campo da ocorrência.

3.7 `DATA_ABERT` é normalmente no dia **posterior** à eclosão, pela manhã (até 09:00h) ou à tarde (após
16:00h) (p. 4). Regras: `data_abertura` não pode ser anterior a `data_eclosao`; se `data_eclosao` for `null`,
`data_abertura` continua válida (data de campo dos dois lados usa a mesma noite de referência).

3.8 `DATA_ECLOS` é a data da **emergência do menor filhote**, não a da maioria (p. 3). Campo de campo com
primeiro/último filhote é acréscimo do projeto (`hora_primeiro_filhote`, `hora_ultimo_filhote`), não do manual.

## 4. Localização, transferência e imutabilidade

4.1 A localização original é **imutável**: praia, km, bairro, referência, latitude, longitude, datum e fonte
do GPS nunca são sobrescritos por uma transferência.

4.2 A posição atual é **derivada** do histórico: última transferência aceita, quando existir; caso contrário,
a localização original.

4.3 Cada transferência é registro próprio (`Transferencia`), com destino, GPS próprio, data/hora de campo,
`TEMP_TRANSF`, `OVOS_TRANS` quando aplicável e `N_NINHO` quando o destino é o cercado.

4.4 `N_NINHO` (p. 3) é o número do ninho **dentro do cercado**, usado para entrada e saída do ninho no
cercado. Não é o identificador do registro no app e não é o `N_REGISTRO`. Os três são campos distintos.
`N_NINHO` é preenchido **apenas** quando houve transferência para o cercado.

4.5 `SITUACAO = I` também cobre desova roubada, predada ou perdida **antes** da decisão técnica (p. 3).
Logo, `I` não significa obrigatoriamente "o ninho segue na praia".

4.6 `PRAIA_DEST_P` e `LOCAL_KM_P` só existem quando `SITUACAO = P` (p. 3). O destino pode ser a mesma praia
de origem.

4.7 Se `SITUACAO = T`, o cercado é obrigatório e `N_NINHO` é obrigatório. Se `SITUACAO = P`, destino e km
de destino são obrigatórios e `N_NINHO` é proibido. Se `SITUACAO = I`, nenhum campo de destino de cercado.

4.8 `TEMP_TRANSF` mede o intervalo entre a **postura** e a **transferência** (p. 3), não o tempo em campo.
Quando o horário da postura não é conhecido, a classificação usa o horário de escavação: ninho enterrado até
as 09:00h → `B`; após 09:00h → `C` (p. 3). Esta regra alternativa entra como valor **sugerido**, nunca como
valor automático: o usuário confirma.

4.9 Códigos de praia e de tipo de evidência de pesca são mantidos pela Gerência do SITAMAR (p. 1, p. 2).
O app **consome** a lista; não cria códigos. Se um código necessário não existir, o registro fica como
pendente de cadastro, com aviso explícito, e não como valor inventado.

## 5. Cálculos derivados

5.1 **Total de ovos** (`OVOS_TOT`) — regra normal (p. 5):
```
ovos_totais = vivos + natimortos + ovos_nao_eclodidos + ovos_furados
```
Requisitos: `TIPO_OCORR = CD` e **os quatro componentes observados**. Basta um componente `null` e o total
fica `null` (indeterminado), **não** `0`. `NAO_VIAVEIS` **não** entra na soma (p. 3).

5.2 **Exceção do total** (p. 5): "apenas em casos excepcionais, quando o ninho tiver sido transferido
(SITUAÇÃO = P **ou** T) e tenha havido algum problema com ele durante a incubação (predação ou perda,
independente do fator causador), o valor do campo OVOS_TRANS será adotado como sendo o valor para OVOS_TOT".
Então:
```
se situacao ∈ {P, T} e problema_incubacao == true:
    ovos_totais = ovos_transferencia
```
`problema_incubacao` **não é campo do manual** — ver DÚVIDA 04. Se ele for `null`, a exceção **não** é
aplicada e o total fica `null` quando os componentes faltarem. `ovos_transferencia` pode ser `null` mesmo com
o problema registrado: aí o total é `null`, nunca 0.

5.3 **Percentual de vivos** (`PCT_VIVOS`) (p. 5):
```
percentual_vivos = vivos / ovos_totais * 100
```
Só se aplica quando as três condições forem verdadeiras: `TIPO_OCORR = CD`, `HIST_NINHO = SU` e
`OVOS_TOT > 0`. Histórico diferente, total zero ou total ausente → o campo fica vazio e a interface mostra o
motivo. O percentual é arredondado para 2 casas, e guarda-se também o valor bruto.

5.4 **Tempo de incubação** (`TEMP_INCUB`) (p. 5): número de dias entre a postura e a data de emergência do
menor filhote:
```
tempo_incubacao_dias = data_eclosao - data_ocorrencia   (em dias)
```
Só quando `TIPO_OCORR = CD`, `HIST_NINHO = SU` e ambas as datas preenchidas. Se `DATA_OCORR` estiver em
branco por desova localizada depois (§3.6), o tempo é `null`, não `0`.

5.5 Todos os cálculos usam **as datas de referência de campo** (§3), nunca `Date` UTC convertido nem
diferença de fuso. `tempo_incubacao_dias` é diferença aritmética de dias do calendário do projeto.

5.6 Nenhum valor derivado é gravado como digitado pelo usuário. O app grava o valor derivado, a versão da
fórmula (identificador) e os insumos, para recálculo auditável.

5.7 `SU` significa incubação conduzida até o fim com coleta dos dados de abertura, **independentemente** da
porcentagem de vivos (p. 4). Não confundir "alta porcentagem" com "sucesso".

## 6. Campos condicionais

6.1 Só há exigência de animal observado quando houve **flagrante** (HORA_OCORR, §3.5). Sem flagrante, os
blocos de marcas, medidas, coleta de material biológico e evidência de pesca não são exigidos: todos esses
campos ficam `null`, nunca `0` e nunca "não". (p. 1–2)

6.2 `TUMORES` é sempre preenchido **no flagrante** (p. 2); `I` significa que a tartaruga não foi examinada.
Fora do flagrante o campo é `null`, e isso é diferente de `I`.

6.3 `HIST_NINHO` só existe com `TIPO_OCORR = CD` (p. 4) e sempre acompanhado de complemento em OBS (p. 4).
`OT` exige obrigatoriamente explicação em OBS (p. 4).

6.4 `NAO_VIAVEIS` só aparece para `especie = DC` (p. 3).

6.5 `EVIDENCIA_INT_PESCA` verdadeira exige `TIPO_EVIDENCIA` (p. 2). `HIBRIDO` em palavras-chave exige
menção em OBS (p. 2).

6.6 `palavras_chave` é validada contra a lista fechada do manual (p. 5–6), sempre sem acento, sem cedilha e
no singular (p. 1–2). `HIBRIDO`, `PESCA`, `DNA` são as palavras-chave que ancoram OBS, EVIDENCIA e COLETA.

## 7. Relatório e exportação

7.1 Período é sempre **inclusivo** nas duas pontas, sobre as datas de referência de campo, com critério
explícito: por `DATA_OCORR`, por `DATA_ECLOS` ou por `DATA_ABERT` (ver `REPORT_SPEC.md`).

7.2 Registro com o campo do critério vazio **não entra** no relatório, e a contagem de excluídos é mostrada.
Registros sem desova não aparecem em relatório de ninhos; entram em relatório de ocorrências.

7.3 Exportação usa os nomes do manual e aceita os aliases do projeto (§7 do dicionário). Números com zeros
iniciais saem como texto, sem aspas implícitas quebrando o CSV.

7.4 PDF não é backup. Toda exportação registra se foi **parcial** (offline) ou **completa**
(sincronização confirmada) — ver `docs/OFFLINE.md`.

## 8. Dúvidas pendentes (bloqueiam regra, não implementação)

| # | Dúvida | Base | Efeito se não respondida |
| --- | --- | --- | --- |
| 01 | Os anexos citados (protocolo de marcação e biometria; pranchas de identificação das espécies) existem em versão impressa/digital? | p. 2 | biometria fica sem unidade oficial; o app pede unidade no campo de texto com aviso |
| 02 | `TEMP_TRANSF` `D` ("> 24 h") e `E` ("> 15 dias") se sobrepõem e falta o intervalo de 24 h a 15 dias. Qual é o corte? | p. 3 | o app não valida `E`; registra `E` só com confirmação e mostra os dois textos do manual |
| 03 | Qual nome o controle geral da campanha usa no intercâmbio: `OVOS_TRANS` ou `OVOS_TRANSF`, `OVOS_FURAD` ou `OVOS_FUR`? | manual usa TRANS/FURAD; projeto registrou os pares | exportação emite o nome do manual e uma coluna de alias opcional |
| 04 | Como registrar "houve problema com o ninho durante a incubação" para acionar a exceção do `OVOS_TOT`? O manual não define código. | p. 5 | o app usa `problema_incubacao` booleano explícito (acréscimo do projeto) e, se `null`, não aplica a exceção |
| 05 | Ovos não viáveis de `DC` contam em algum dos quatro componentes de `OVOS_TOT` ou ficam totalmente fora? O manual só diz que o total não deve incluí-los. | p. 3 | `NAO_VIAVEIS` fica registrado e separado, sem entrar na soma |
| 06 | O projeto é área de estudo intenso ou área de proteção? | p. 1 | o app registra tudo e não aplica o filtro por regime |
| 07 | Qual a lista de códigos de praia e de tipo de evidência que o projeto pode usar? Os códigos são do SITAMAR. | p. 1, p. 2 | praia fica como texto livre **marcado como pendente de cadastro**, com aviso, nunca invenção de código |
| 08 | Na eclosão, quando `DATA_OCORR` está em branco (desova localizada depois), o ninho é criado a partir da eclosão ou registrado retroativamente? | p. 1 | o app exige escolher: criar o ninho agora com `data_ocorrencia = null`, ou sinalizar que o registro deve vir da ficha de campo |

## 9. Regras implementadas que exigem teste de comportamento

`data_referencia_noite` (3.2, 3.3) · criação de ninho só com `CD` (2.1) · verificação de praia para `SD` (2.2) ·
imutabilidade da origem e posição atual derivada (4.1, 4.2) · exceção do `OVOS_TOT` (5.2) · vazio × zero (1.2,
5.1) · pré-condições de `PCT_VIVOS` (5.3) · `TEMP_INCUB` (5.4) · condicionais do flagrante (6.1) ·
`HIST_NINHO` só com `CD` (6.3) · exclusão de datas vazias no relatório (7.2).