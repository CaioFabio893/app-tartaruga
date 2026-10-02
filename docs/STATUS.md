# Status

Estado atual: **base e contratos prontos + domínio com testes verdes**.

## Resumo

- Manual de 7 páginas extraído para `docs/FIELD_DICTIONARY.md` e `docs/DOMAIN_RULES.md`. 8 dúvidas pendentes
  de decisão da coordenação científica (não de implementação).
- Contratos definidos: `DATA_MODEL.md`, `ARCHITECTURE.md`, `PRODUCT.md`, `REPORT_SPEC.md`.
- Domínio: datas (noite de monitoramento), cálculos derivados versionados (OVOS_TOT, PCT_VIVOS, TEMP_INCUB),
  validações condicionais. **40 testes de comportamento** passando.
- Scaffold Vite + TypeScript strict + React mínimo + PWA (manifest + service worker placeholder). **Build** OK.

## Tarefa ativa

**E01 – Base e Contratos (em revisão)**. Próximo passo: iniciar **Prompt 3** (Codex) com
`docs/handoffs/ATUAL.md` pronto, ou avançar para a implementação das telas (Prompt 4) apenas depois que o
Codex aprovar ou registrar os achados.

## Bloqueios

- `DOMAIN_RULES.md §8`: 8 dúvidas científicas. Não devemos escolher silenciosamente (regra AGENTS.md). São
  principais: D01 (unidades de biometria), D02 (sobreposição de `TEMP_TRANSF` D/E), D04 (exceção de OVOS_TOT),
  D08 (ninho a partir da eclosão).
- Provedor de tiles/mapa e lista oficial de praias/códigos de tipo de evidência dependem de SITAMAR
  (D07).
- Primeiro usuário com papel `coordenacao` exige procedimento administrativo confiável (`SECURITY.md`).

## Próximo passo

1. Codex: executar **Prompt 3** (revisão inicial concentrada) usando `docs/handoffs/ATUAL.md`.
2. Após revisão: receber `docs/reviews/REVISAO-BASE.md` e converter achados em tarefas no `BACKLOG.md`,
   executando **Prompt 4** tarefa por tarefa (execução sequencial, um dono por arquivo).

## Comandos para verificar

```powershell
npx vitest run
npx tsc --noEmit
npx vite build
```