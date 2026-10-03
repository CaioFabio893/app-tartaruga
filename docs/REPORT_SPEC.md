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

Na integração oficial planejada, projeção por projeto/critério com limites inclusivos >= inicio e <= fim e filtros escalares (D-014), índices próprios por combinação. Contrato em src/domain/consultas.ts; emulador não valida índices de produção. Na interface atual o conjunto é o treino local conhecido, sem leitor oficial.

Implementação em src/report/relatorio.ts valida e congela snapshot usado pelas três exportações. Eclosão é considerada antes da abertura e independentemente de contagens. Data canônica/referência de noite divergentes ou múltiplas datas distintas são ambiguidade rastreada, sem escolha silenciosa; registro excluído e relatório parcial. Período não usa Date UTC.

## 2. Política para datas vazias

Registro **sem a data do critério** não entra no relatório. A tela mostra:

- `incluídos: N`
- `excluídos por data ausente: M`, somente se apurado numa consulta adicional com escopo explícito
- `excluídos por filtro: K`, somente se houver conjunto-base conhecido; caso contrário não exibir

Uma consulta por intervalo não retorna os registros sem a data; não consegue contar essas exclusões
sozinha. O `M` só é exibido quando apurado por uma consulta **adicional** de contagem com o mesmo escopo e os
mesmos filtros do relatório: `descreverConsultaAusentes` (`src/domain/consultas.ts`) descreve essa contagem
com `data_criterio = null`. Sem esse escopo explícito, não exibir o número de excluídos.

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
Observações e visitas (acréscimo do projeto, sem alterar HIST_NINHO).

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
valor, para o total não parecer completo quando não é. Se nenhum valor foi observado, total = null; soma que ultrapassa inteiro seguro também fica null com motivo. Não calcular média agregada de percentuais sem regra da coordenação. Conservadorismo v2 para problemaIncubacao desconhecido está registrado em DOMAIN_RULES §5.2/DECISIONS, sem nova fórmula.

## 5. Layout A4 proposto

- Página 1: identificação do projeto, período, critério, resumo, tabela resumida, avisos de incompletude.
- Páginas seguintes: fichas detalhadas, cada ficha inicia página própria, com continuação quando necessário, com quebra de página antes do título.
- Rodapé em todas as páginas: `Página X de Y`, período e data de geração.
- Fontes padrão locais Helvetica/HelveticaBold, sem fonte remota; acentos pt-BR e travessão verificados. Glifo não suportado vira `?` com aviso explícito; JSON conserva texto original.
- Identificação da ficha repetida nas páginas de continuação.
- Observações longas: quebrar o texto, sem cortar e sem transbordar a margem.
- Valores vazios impressos como `—`, **nunca** `0`.
- Tabela resumida não é espremida: se as colunas não caberem, dividir em duas tabelas ou reduzir para as
  colunas essenciais, mantendo a lista completa na página de detalhe.

## 6. Exportação

- **PDF**: cliente, `pdf-lib`, sem servidor.
- **JSON**: mesmo conjunto do PDF, com nomes internos e de exportação.
- **CSV**: mesmos registros do PDF, cabeçalho completo mesmo sem linhas. Aspas escapam delimitadores, mas não obrigam Excel a preservar
  zeros iniciais; orientar importação das colunas como texto. JSON mantém identificadores como strings.
  Tratar células iniciadas por =, +, - ou @ na exportação destinada a planilhas, evitando fórmulas
  vindas de texto de usuário: prefixar apóstrofo em strings iniciadas por esses sinais (incluindo espaços/controles iniciais); não alterar números negativos reais. JSON preserva original.
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

## 8. Entrega e evidência

E02 concluída para treino; todos os relatórios atuais são parciais/demonstrativos. Login não confirma sincronização de fichas. Definitivo exige fonte oficial completa, online e sincronização confirmada (E10 pendente). Amostra output/pdf/relatorio-demonstracao.pdf, testes/revisão visual em TESTING.md. Não incluir FOTOGRAFIA. Cinco casos fictícios; nenhum vínculo com projeto real.
