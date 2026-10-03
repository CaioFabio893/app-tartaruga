# Revisão inicial da base - Codex

Data: 02/10/2026. Escopo: E01, contratos, domínio, consultas planejadas e viabilidade de segurança/offline.
Resultado: correções pontuais aplicadas; concluir R02 antes de E02/E04. Interface visual preservada.

## Evidência e limites

- Base recebida: 40 testes passaram e build/typecheck passaram.
- Revisão: inspeção de src/domain, testes, configuração e contratos; conferência visual das páginas
  relevantes do manual. Não existe implementação de login, Firestore, PDF, fila, mapa ou GPS para testar.
- Regressões adicionadas para calendário, horários, 09h, contagens inválidas e códigos/observações.
- Usuário forneceu transcrição durante a revisão; salva sem alterar conteúdo em
  docs/references/MANUAL-TRANSCRITO.md. Os trechos corrigidos também foram confrontados com esse texto.
- Resultado final das verificações registrado em docs/tasks/R01-revisao-base.md.
- Nenhuma regra Firestore foi validada no emulador ou produção. Nenhum PDF final foi gerado.

## Achados corrigidos

### F01 - Alta: datas e horas impossíveis entravam nos cálculos

Arquivos: src/domain/datas.ts e tests/datas.test.ts.
Antes: paraDia aceitava 2026-02-30 por normalização do Date; partesInstante aceitava 24h, minutos/segundos
fora da faixa e offsets inválidos. ISO sem segundos era rejeitado apesar de aceito pelo formato declarado.
Abertura inválida sem eclosão passava como ok. Datas inválidas podiam mudar de mês e entrar no relatório.
Correção: validação do calendário e dos componentes, segundos opcionais tratados como zero, faixa de
dias segura e validação de abertura antes de verificar ausência de eclosão. Ano fica com quatro dígitos.

### F02 - Alta: categoria B excluía exatamente 09h

Arquivo: src/domain/datas.ts. Manual p. 4 inclui 09:00 em B; o código usava horas < 9 e devolvia C.
Correção: comparar hora completa com 09:00:00 inclusivo. Testes cobrem antes, limite e depois.

### F03 - Alta: contagens inválidas geravam resultados numéricos

Arquivo: src/domain/calculos.ts. Negativos, frações e NaN entravam no total; percentual podia passar
de 100; datas inválidas podiam causar exceção durante geração do relatório.
Correção: contagens inteiras não negativas e finitas, soma segura, vivos <= total e retorno vazio com
motivo quando inválido. Versão dos derivados passa a v2. Não converte ausente para zero.

### F04 - Alta: transcrição do manual alterava o significado dos dados

Arquivos: docs/DOMAIN_RULES.md, docs/FIELD_DICTIONARY.md, src/domain/tipos.ts.
Correções: OVOS_TRANS é contagem observada (p. 4), não derivado nem proibido de digitar; DATA_ECLOS
refere-se à emergência de pelo menos um filhote (p. 4), não ao menor filhote. NM exclui ninhos perdidos
e encontrados apenas após nascimento (p. 5), contrário ao texto inicial. Espécie e coleta de material do
ninho não dependem de observar a fêmea. Morte da fêmea exige também registro não reprodutivo, sem apagar
desova confirmada (p. 3). D/E se sobrepõem; não há lacuna entre 24h e 15 dias.
Localizadores de campos na tabela foram corrigidos; parte das referências narrativas antigas ainda
precisa de normalização em R02. Nomes manuscritos pente/couro corrigidos. Bairro estava transcrito como baixo_mar.

### F05 - Média: validações aceitavam códigos arbitrários

Arquivo: src/domain/validacao.ts. Tipos TypeScript não validam texto de formulário/importação.
Correção: validar códigos em ocorrências, situação, histórico e tumores; situação só em CD; qualquer
histórico preenchido pede complemento OBS, conforme manual p. 5. Testes de comportamento adicionados.

### F06 - Média: documentação declarava funcionalidades inexistentes

Arquivos: AGENTS.md, docs/TEAM.md, docs/ARCHITECTURE.md, README.md, .env.example.
Correção: Claude como autor visual; esclarecer que TypeScript não impede imports entre camadas;
remover variável de Storage desnecessária; criar README com comandos e limites reais. Manifest sozinho
não comprova PWA/offline. Existem referências a ícones ausentes e não existe public/sw.js.

## Achados pendentes - tarefa R02 (OpenCode)

### F07 - Alta: relatório por eclosão/abertura não tem consulta de projeto implementável

DATA_MODEL.md §7 propõe consultar aberturas dentro de cada ninho. Isso exige enumerar todos os ninhos
para achar o período e contradiz não baixar o banco inteiro. Filtros praia/espécie/temporada não estão nas
aberturas; não há join Firestore. O índice praia_origem/local_origem não corresponde a campos consultáveis
definidos no contrato.
Correção exigida: escolher e documentar collectionGroup('aberturas') com projeto_id e metadados de filtro
materializados de forma controlada, OU projeção de relatório por projeto com ID estável. Definir filtros,
campos reais, índices e sincronização atômica da projeção. Para collectionGroup, regras v2 devem validar
membro/projeto e permitir a consulta restrita; segurança não é filtro automático.
Aceite: três consultas concretas por critério, sem enumerar todos os ninhos, com tipos/projeção e testes
futuros das regras; indicar custo das leituras adicionais dos detalhes. Contagens de ausentes/excluídos
exigem consulta própria com escopo; não inventá-las a partir do resultado do período.

### F08 - Alta: política offline pode sobrescrever dados antes de detectar conflito

OFFLINE.md propõe comparar timestamps de dispositivos sem uma gravação condicional atômica.
Firestore usa last-write-wins para alterações concorrentes de documentos. Uma fila separada combinada
com gravações offline diretas do SDK pode aplicar duas vezes ou sobrescrever antes de exibir conflito.
Correção exigida: fila persistente com operationId, baseVersion, payload, estado e política de usuário;
operações de alteração só chegam ao documento canônico numa transação online que compara version.
Atualizar documento/versão/auditoria juntos; marcar a fila como concluída somente após confirmação.
Transações falham offline: guardar rascunho local, não executar transação offline nem usar cache como
confirmação. Evitar timestamps do aparelho como critério de concorrência; usar versão e serverTimestamp.
Não misturar retry de fila própria com escrita pendente automática no mesmo documento.
Aceite: plano único, idempotência em queda após commit, dois aparelhos com mesma versão e rejeição por
permissão preservando o rascunho; testes de implementação na E09.

### F09 - Alta: unicidade dos números não existe por declaração

DATA_MODEL.md §6 diz que o servidor verifica números, mas não existe serviço pago nem verificação
automática de unicidade de campos no Firestore.
Correção exigida: documento de reserva com chave determinística por escopo/número, escrito numa
transação online com ocorrência/ninho; regras validam a reserva e impedem usurpar dono. Definir se
N_REGISTRO é único no projeto ou na temporada e escopo de N_NINHO por cercado. Até a coordenação
confirmar o escopo, não declarar garantia oficial de unicidade.
Aceite: dois clientes tentando o mesmo número resultam em um vencedor; retry é idempotente;
offline fica com número pendente. Nenhuma Cloud Function/Blaze necessária para esse desenho.

### F10 - Alta: campos duplicados e ausentes tornam ambíguo o relatório

Ninho repete numeroRegistro/localOrigem da Ocorrencia; tempo/cercado repetem Transferencia; o contrato
diz não haver duplicação. Tipos de Transferencia/Visita/Abertura não têm projetoId/auditoria/version
apesar de exigidos nos documentos. Flagrante estava ausente no tipo e inferido de uma hora possivelmente
desconhecida; corrigido como resposta explícita. Coleta biológica não distingue claramente não observado
de não coletado. OVOS_FURAD é definido no manejo mas existe só na Abertura: não registrar a mesma
contagem em dois lugares e somar duas vezes.
Correção exigida: um dono por campo; cópias só como projeção explicitamente derivada com atualização
atômica. Definir agregado de relatório, seleção da abertura válida e qual transferência fornece OVOS_TRANS
em múltiplas transferências. Ordenar posição atual por instante/sequência confirmada, não só data do dia.
Campos observados, não observados e coletados precisam de contratos inequívocos.
Aceite: tipos e DATA_MODEL coerentes, mapeadores camelCase/snake_case explícitos, exemplo de ficha
montada sem conflitos de fonte e sem contagem duplicada.

### F11 - Média: fuso e horário de verão não foram implementados

dataReferenciaNoite lê a hora escrita no ISO; não converte para o fuso do projeto. O teste inicial com
duas madrugadas não demonstrava conversão; substituído por teste que revela o contrato real.
Aceite R02: declarar entradas locais obrigatórias, fuso do projeto e ponto de conversão no serviço;
Date.toISOString() não pode entrar direto na função. Conversão histórica de horário de verão para
HORA_OCORR permanece pendente e deve ter evidência antes de ser anunciada como pronta.

### F12 - Média: entrega E01 incompleta como PWA, emuladores e arquitetura de UI

React foi adicionado sem decisão registrada; dependências runtime React/ReactDOM estão em devDependencies.
README faltava (corrigido), não há configuração de emuladores e o manifest aponta ícones inexistentes.
Aceite R02: documentar manter React ou voltar à base simples (não reescrever por preferência); se mantido,
classificar dependências corretamente. Registrar PWA/emuladores como pendentes e tarefas com caminhos
de edição completos; entregar esses itens antes de alegar PWA funcional ou segurança validada.

## Continuação

OpenCode executa R02, ajusta os contratos e só depois E02 com PDF fictício. E03 visual pode seguir após
R02. Não devolver ao Codex cada detalhe cosmético: revisão final quando as partes críticas estiverem
integradas, ou diagnóstico pontual se houver falha persistente.

Fontes técnicas consultadas: [transações Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions)
e [persistência offline](https://firebase.google.com/docs/firestore/manage-data/enable-offline).
