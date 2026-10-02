# Especificação do Relatório

O PDF é gerado **no cliente** com `pdf-lib`. O layout é **proposta** até a equipe validar um exemplar
(`design/REVISAO-CLAUDE.md`, item 6). Não há modelo oficial de relatório no material de referência.

## 1. Filtros

| Filtro | Campo | Regra |
| --- | --- | --- |
| Período inicial | `data_inicio` | **inclusiva** |
| Período final | `data_fim` | **inclusiva** |
| Critério | `data_ocorrencia` \| `data_eclosao` \| `data_abertura` | obrigatório; nunca "todas" misturadas |
| Praia | `praia_id` | opcional |
| Espécie | `especie_codigo` | opcional |
| Temporada | `temporada_id` | opcional |
| Situação | `situacao` | opcional |
| Natureza | `REPRODUTIVO` \| `NAO_REPRODUTIVO` | opcional |

As datas do filtro são comparadas com as **datas de referência de campo**, nunca com `Date` UTC
(`DOMAIN_RULES` §3).

## 2. Política para datas vazias

Registro **sem a data do critério** não entra no relatório. A tela mostra:

- `incluídos: N`
- `excluídos por data ausente: M`
- `excluídos por filtro: K`

Um registro sem data **não** é tratado como zero, nem como fora de qualquer período, nem entra
silenciosamente. Se `M > 0`, a prévia traz o aviso "relatório incompleto: N registros sem a data do critério".

## 3. Colunas

### 3.1 Resumo (poucas colunas, legíveis em A4)

`Nº registro` · `Data (critério)` · `Praia / km` · `Espécie` · `Situação` · `Histórico` · `Vivos` ·
`Natimortos` · `Não ecl.` · `Furados` · `Total ovos` · `% vivos`

### 3.2 Ficha detalhada (uma por ninho, páginas seguintes)

Identificação (`N_REGISTRO`, `N_NINHO` quando `situacao = 'T'`, projeto, temporada, responsável) ·
Localização original (praia, km, bairro, referência, latitude/longitude com 5 casas, datum, precisão) ·
Localização atual e histórico de transferências · Animal (marcas encontradas/colocadas/retiradas, espécie,
biometria, tumores, coleta, interação com pesca) · Manejo (`TEMP_TRANSF`, ovos da transferência) ·
Eclosão e abertura (datas, vivos, natimortos, não eclodidos, furados, não viáveis, derivados) ·
Observações.

Nomes de exportação conforme `FIELD_DICTIONARY` §7, aceitando os aliases na importação.

## 4. Totais e vazios

| Item | Aparece quando | Vazio com explicação quando |
| --- | --- | --- |
| `VIVOS`, `NATIMORTOS`, `OVOS_N_ECL`, `OVOS_FURAD` | dado coletado na abertura | componente não observado |
| `OVOS_TOT` | `CD` e os 4 componentes observados, **ou** exceção `P`/`T` com problema na incubação | qualquer componente ausente → `null`, nunca `0` |
| `PCT_VIVOS` | `CD` + `HIST_NINHO = SU` + `OVOS_TOT > 0` | fora dessas três condições, mostra o motivo |
| `TEMP_INCUB` | `CD` + `SU` + `DATA_OCORR` e `DATA_ECLOS` presentes | `DATA_OCORR` em branco → vazio, não `0` |
| `NAO_VIAVEIS` | `especie = DC` | outras espécies: campo não exibido |
| `N_NINHO` | `situacao = 'T'` | demais: não exibido |

Totais do período somam apenas valores presentes; a linha de totais indica quantos registros ficaram sem
valor, para o total não parecer completo quando não é.

## 5. Layout A4 proposto

- Página 1: identificação do projeto, período, critério, resumo, tabela resumida, avisos de incompletude.
- Páginas seguintes: fichas detalhadas, uma ou duas por página, com quebra de página antes do título.
- Rodapé em todas as páginas: `Página X de Y`, período e data de geração.
- Acentuação correta em fonte padrão do `pdf-lib` (PDF puro não embute fonte; testar acentos antes de
  publicar — pendência em `TESTING.md`).
- Observações longas: quebrar o texto, sem cortar e sem transbordar a margem.
- Valores vazios impressos como `—`, **nunca** `0`.
- Tabela resumida não é espremida: se as colunas não caberem, dividir em duas tabelas ou reduzir para as
  colunas essenciais, mantendo a lista completa na página de detalhe.

## 6. Exportação

- **PDF**: cliente, `pdf-lib`, sem servidor.
- **JSON**: mesmo conjunto do PDF, com nomes internos e de exportação.
- **CSV**: mesmos registros do PDF; números com zeros iniciais entre aspas, para não perder o `007`.
- Marcar **parcial** quando exportado offline ou com pendência de sincronização (`OFFLINE.md`).
- PDF não é backup: a cópia de dados é o JSON/CSV.

## 7. Requisitos de teste

1. Registros do filtro = registros do PDF, exatamente, na mesma ordem.
2. Período com um único dia no limite (início = fim).
3. Intervalo grande (mais de 500 registros): paginação e número de páginas correto.
4. Nenhum registro no período: página de aviso, sem página em branco.
5. Registro sem a data do critério: excluído e contabilizado.
6. Valores vazios impressos como `—`, nunca `0`.
7. Acentos e `—` renderizando corretamente no PDF.
8. Observação longa quebrando página sem corte.
9. Offline: PDF gerado marcado como parcial.
10. Filtro por praia, espécie e temporada combinada com o período.