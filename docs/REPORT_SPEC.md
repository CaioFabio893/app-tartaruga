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

P03: projeção mínima por ninho, três datas indexadas e limites inclusivos no servidor; filtros opcionais nos metadados antes de ler detalhes. Consulta separada de null no mesmo projeto/filtros. Versão/operação e revisão global conferidas; pendências impedem confirmado. Contrato ativo em DATA_MODEL §4.10/§7 e src/data/nuvem.ts, substituindo o desenho R02 de três linhas (D-020). Treino continua separado. Emulador não valida índices reais; estes precisam READY.

Implementação em src/report/relatorio.ts valida e congela snapshot usado pelas três exportações. Eclosão é considerada antes da abertura e independentemente de contagens. Data canônica/referência de noite divergentes ou múltiplas datas distintas são ambiguidade rastreada, sem escolha silenciosa; registro excluído e relatório parcial. Período não usa Date UTC.

## 2. Política para datas vazias

Modo **Todos os ninhos** (padrão P04) não aplica datas e inclui ninhos sem datas. Datas divergentes permanecem visíveis sem escolher uma data e tornam a exportação parcial. Modo **Todos os ninhos do período** preserva as regras seguintes.

Registro **sem a data do critério** não entra no relatório por período. A tela mostra:

- `incluídos: N`
- `excluídos por data ausente: M`, somente se apurado numa consulta adicional com escopo explícito
- `excluídos por filtro: K`, somente se houver conjunto-base conhecido; caso contrário não exibir

Uma consulta por intervalo não retorna os registros sem a data; não consegue contar essas exclusões
sozinha. O `M` só é exibido quando apurado por uma consulta **adicional** de contagem com o mesmo escopo e os
mesmos filtros do relatório: `descreverConsultaAusentes` (`src/domain/consultas.ts`) descreve essa contagem
com `datas.<criterio> = null`. Sem esse escopo explícito, não exibir o número de excluídos.

## 3. Colunas

### 3.1 Resumo (poucas colunas, legíveis em A4)

`Nº registro` · `Data (critério)` · `Praia / km` · `Espécie` · `Situação` · `Histórico` · `Vivos` ·
`Natimortos` · `Não ecl.` · `Furados` · `Total ovos` · `% vivos`

### 3.2 Ficha detalhada (uma por ninho, páginas seguintes)

Identificação (`N_REGISTRO`, `N_NINHO` quando `situacao = 'T'`, projeto, temporada, responsável) ·
Localização original (praia, km, bairro, referência, latitude/longitude com 7 casas no PDF/consulta; exportação tabular do manual preservada, datum, precisão) ·
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
- Fichas detalhadas: campos curtos em pares e textos longos com largura inteira; nova ficha pode aproveitar a página quando houver espaço para seu início. Continuação mantém identificação, sem cortar campos/históricos.
- Rodapé em todas as páginas: `Página X de Y`, período e data de geração.
- Fontes padrão locais Helvetica/HelveticaBold, sem fonte remota; acentos pt-BR e travessão verificados. Glifo não suportado vira `?` com aviso explícito; JSON conserva texto original.
- Identificação da ficha repetida nas páginas de continuação.
- Observações longas: quebrar o texto, sem cortar e sem transbordar a margem.
- P07: margens laterais de 32 pt, valores em 9 pt, espaçamento vertical reduzido e conteúdo integral. Um único PDF completo; não há versão resumida alternativa. Quantidade de páginas depende dos registros/textos; comparação fictícia antes/depois na tarefa P07.
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
6. Valores ausentes no PDF como "Não informado" ou motivo específico; nunca zero presumido.
7. Acentos renderizando corretamente no PDF; rótulos completos e códigos explicados.
8. Observação longa quebrando página sem corte.
9. Offline: PDF gerado marcado como parcial.
10. Filtro por praia, espécie e temporada combinada com o período.

## 8. Entrega e evidência

P03 fornece fonte real confirmada conforme STATUS/TESTING. P04 organiza resumo de todos os ninhos incluídos e tabelas por ficha, com todos os campos do manual (sem FOTOGRAFIA), motivos e códigos legíveis; sem serialização JSON ou UID como nome. Autoria técnica preservada no JSON; nome usa displayName da sessão quando conhecido, sem inventar identidade. Amostra P04 fictícia em output/pdf/relatorio-p04-demonstracao.pdf.

P07 reorganiza apenas layout e paginação, preservando fontes e regras. Amostra nova `output/pdf/relatorio-p07-demonstracao.pdf`: cinco ninhos fictícios com observação longa, 19 → 11 páginas; 728 rótulos/valores conferidos por extração, sem ausência ou caracteres fora das margens. Conferência visual e resultados em [P07](tasks/P07-pdf-menos-paginas.md).

## 9. P08 — Excel e ano
XLSX local OpenXML/fflate: coluna A = informações; linha 1 = números anuais textuais, um ninho por coluna. Campos/históricos integrais de secoesFicha, organização operacional em seção própria; origem e todos os destinos separados. Linha 1/coluna A fixas; textos extensos em linhas de continuação, sem corte; zero numérico e ausências com motivo. Datas de campo em texto DD/MM/AAAA preservam a referência registrada; coordenadas textuais preservam precisão. Sem fórmulas executáveis provenientes de texto. Aba Sobre informa escopo/parcial/fórmula/avisos. Até 16.383 ninhos por aba, sem omitir excedentes.
Filtro anual explicitamente informado; “Todos os anos” inclui registros sem organização, com código técnico no cabeçalho até atribuição. Ordenação por ano/número; UUID e N_REGISTRO/N_NINHO preservados separadamente. Contagens de exclusão por data anteriores ao filtro anual têm aviso, não representam contagem anual. JSON inclui somente metadados dos ninhos selecionados. PDF completo mantém layout P07 e acrescenta organização/previsão quando definida. CSV anterior permanece como formato técnico de compatibilidade.
