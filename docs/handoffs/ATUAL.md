# Handoff — OpenCode → Codex (Prompt 3)

## Origem
**Ferramenta**: OpenCode (build)
**Modelo**: opencode/big-pickle
**Data**: 02/10/2026

## Destino
**Ferramenta**: Codex
**Prompt a executar**: **Prompt 3** — Revisão inicial concentrada (PROMPTS-DO-PROJETO.md, seção 3)

## Objetivo
Revisar a base crítica (contratos + domínio + segurança) **antes** de implementar telas. Impedir retrabalho
nos dados e relatórios.

## Arquivos entregues (críticos)

| Arquivo | Status | Observação |
| --- | --- | --- |
| `AGENTS.md` | OK | Regras comuns |
| `docs/STATUS.md` | OK | Estado real, tarefa ativa, bloqueios |
| `docs/INDEX.md` | OK | Leitura seletiva |
| `docs/BACKLOG.md` | OK | E01 concluída |
| `docs/CHANGELOG.md` | OK | Registro de E01 |
| `docs/DECISIONS.md` | OK | D-001–D-010 |
| `docs/TEAM.md` | OK | Papéis |
| `docs/TESTING.md` | OK | Cenários de comportamento |
| `docs/FIELD_DICTIONARY.md` | OK | Extração do manual com página (p.N) |
| `docs/DOMAIN_RULES.md` | OK | 8 dúvidas pendentes (§8) |
| `docs/DATA_MODEL.md` | OK | Ocorrência↔Ninho, concorrência offline, índices |
| `docs/ARCHITECTURE.md` | OK | Camadas, dependências verificáveis |
| `docs/PRODUCT.md` | OK | Escopo/excluídos (sem fotos/Blaze/Storage/IA) |
| `docs/REPORT_SPEC.md` | OK | Período inclusivo, vazio≠zero, PDF cliente |
| `docs/FIREBASE.md`, `docs/SECURITY.md`, `docs/OFFLINE.md`, `docs/DEPLOY.md` | OK | Base para revisão |
| `src/domain/*` (tipos.ts, datas.ts, calculos.ts, validacao.ts) | OK | Código puro, versionado |
| `tests/*` (datas.test.ts, calculos.test.ts) | OK | **40 testes passando** |
| `tsconfig.json`, `vite.config.ts`, `package.json`, `package-lock.json` | OK | Build/strict OK |

## Evidências

```powershell
npx vitest run  # 40 passed (2 test files)
npx tsc --noEmit # sem erros
npx vite build  # dist gerado com sucesso
```

## Pontos para focar na revisão (conforme Prompt 3)

1. **Relacionamentos**: Ocorrência (`CD`) cria Ninho com `ninho_id` vinculado. Ficha é visão, não coleção
   duplicada. Está correto em `DATA_MODEL.md`?
2. **Datas de campo**: regra de noite (12:00:00 pertence à noite anterior). Coberta por testes — verificar
   se está de acordo com a intenção do manual.
3. **IDs offline**: UUID local + numeração oficial pode ficar `null` até sincronização. Estratégia de
   concorrência (não promete sequência global offline) — avaliar viabilidade.
4. **Exceção OVOS_TOT**: usa `problemaIncubacao` (projeto) e **não** aplica se `null` (sem inferência).
   Confirma com DÚVIDA 04?
5. **Consultas por período**: índices propostos em `DATA_MODEL.md §7`; relatório não baixa todo o banco.
6. **Plano Spark**: sem fotos/Storage/Blaze/IA no app — respeitado em todos os documentos.
7. **Permissões por projeto**: isolamento via `projeto_id`, negação por padrão, sem autoelevação.
8. **Conflitos offline**: `last-write-wins` **não** é automático. Proposta de resolução explícita — avaliar.

## Riscos conhecidos

- 8 dúvidas científicas (`DOMAIN_RULES.md §8`) bloqueiam fechamento de algumas regras. **Não** foram
  resolvidas por implementação.
- `problemaIncubacao` é acréscimo do projeto (necessário para não inferir). Precisa de validação pela
  coordenação científica (DÚVIDA 04).
- Unidades de biometria (`COMP_CASCO`, `LARG_CASCO`) não constam no manual (DÚVIDA 01).

## Próxima ação (Codex)

Executar **Prompt 3** (revisão inicial concentrada). Entregar `docs/reviews/REVISAO-BASE.md` com achados
concretos (gravidade, arquivo, consequência, critério de correção). Se alterar domínio, registrar no próprio
achado. Não redesenhar UI. Após revisão, converter achados em tarefas no `docs/BACKLOG.md` para execução
sequencial pelo OpenCode (Prompt 4).

## Estado para continuação

`docs/STATUS.md` aponta tarefa E01 concluída. Próxima tarefa: aguardar revisão do Codex (Prompt 3).