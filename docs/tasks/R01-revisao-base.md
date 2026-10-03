# R01 - Revisão inicial Codex

Data: 02/10/2026. Dono: Codex. Estado: revisão realizada; validação final abaixo.

## Escopo

Código de domínio/testes, contratos e documentos relacionados. Não implementar as telas/Firebase/PDF.
Transferência recebida do OpenCode autoriza correções pontuais de domínio e documentação.

## Alterações

- datas.ts: calendário/horários/offsets válidos, segundos opcionais, limite 09h, abertura e faixa de dias.
- calculos.ts: contagens inteiras finitas não negativas, consistência percentual, datas inválidas sem
  exceção e versão v2.
- validacao.ts: códigos válidos e observações em todo histórico informado.
- tipos.ts: flagrante explícito e comentário correto de ovos transferidos.
- Testes de regressão em três arquivos.
- Correções da extração do manual e documentação, README, remoção de variável Storage e retorno do Claude
  como responsável visual.
- Revisão com achados e tarefa R02 para OpenCode, sem substituir o restante da implementação.

## Verificação

Recebido: 40/40 testes e build/typecheck passaram.
Após primeira rodada: uma regressão expôs ano 0099 sem padding; corrigido no formatador.
Resultado final: **63/63 testes passaram em três arquivos** (`npm test`); `npm run build` passou,
incluindo `tsc --noEmit`. Não houve emulador/produção.

## Fonte textual adicionada durante a tarefa

Usuário forneceu transcrição; copiada integralmente para docs/references/MANUAL-TRANSCRITO.md.
Atualizados AGENTS.md e índice para consulta por campo e imagens somente em caso de dúvida.

## Limites

Sem UI real, PDF gerado, Firebase/emulador, offline ou deploy para validar nesta fase.
Pendências dos contratos e consultas estão em REVISAO-BASE.md F07-F12.
