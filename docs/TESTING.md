# Testes

## Comandos

```powershell
# Rodar todos os testes
npx vitest run

# Rodar em modo watch
npx vitest

# Checagem de tipos
npx tsc --noEmit

# Build de produção
npx vite build

# Preview local
npx vite preview
```

## Cenários obrigatórios (comportamento)

| Área | Cenário | Evidência |
| --- | --- | --- |
| Datas | Madrugada pertence à noite anterior (01:30 → noite de dia anterior). **12:00:00** pertence à noite anterior; **12:00:01** pertence ao novo dia. | `tests/datas.test.ts` |
| Período | Inclusivo em ambas as pontas. Data ausente nunca entra. Período invertido não seleciona nada. | `tests/datas.test.ts` |
| OVOS_TOT | Soma normal 4 componentes; componente ausente → `null`, nunca `0`. Zero real é aceito. | `tests/calculos.test.ts` |
| Exceção OVOS_TOT | `SITUACAO = P` ou `T` + `problemaIncubacao = true` → usa `OVOS_TRANS`. Se `problemaIncubacao = null` → **não** aplica (sem inferência). | `tests/calculos.test.ts` |
| PCT_VIVOS | Só com `CD + SU + OVOS_TOT > 0`. Total zero ou indefinido bloqueia. | `tests/calculos.test.ts` |
| TEMP_INCUB | Só com `CD + SU` e ambas as datas. `DATA_OCORR` em branco → `null` (desova localizada depois). Eclosão anterior à postura → `null`. | `tests/calculos.test.ts` |
| Tipo ocorrência | `SD` exige `verificacaoPraiaRealizada = true` (p. 2). Só `CD` cria ninho. | Cobrir em testes de app |
| Condicionais | `HIST_NINHO = OT` exige OBS. `TUMORES` obrigatório no flagrante. `EVIDENCIA_INT_PESCA` exige `TIPO_EVIDENCIA`. | Cobrir em testes de app |
| Transferência | Cercado exige `N_NINHO`; praia **proíbe** `N_NINHO` (p. 3). | Cobrir em testes de app |
| Relatório | Filtro = PDF (mesmo conjunto). Período inclusivo. Datas vazias excluídas e contabilizadas. Vazios impressos como `—`. | Cobrir em testes de relatório |

**Regra**: Domínio, filtros, permissões e sincronização exigem **teste de comportamento**. Não escrever teste
que só repete a implementação nem teste que só verifica CSS.