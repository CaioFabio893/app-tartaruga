# P05 — estimativa de capacidade Spark

Dono: Codex, sequencial. Pedido: estimar quantos ninhos cabem no plano atual. Escopo somente documental: esta tarefa, docs/FIREBASE.md e STATUS/BACKLOG/CHANGELOG. Consulta administrativa somente leitura no projeto autorizado; sem modificar dados, índices, regras, plano ou código.

Estado: concluída em 03/10/2026.

Método: enumerar ocorrência/ninho/projeção/operação, filhos transferência/visita/abertura e reservas do projeto principal. Contar UTF-8+1 para nomes/textos, escalares conforme documentação, nomes de documentos+16, mapas/documentos+32. Estimar índices automáticos ascendentes/descendentes de campos escalares/mapas, entradas de arrays e quatro índices compostos da projeção. Valores de índices truncados a 1.500 bytes. Fonte: https://firebase.google.com/docs/firestore/storage-size e https://firebase.google.com/docs/firestore/quotas . Não representa bytes medidos pelo faturamento; estruturas/indexação efetiva e histórico futuro variam.

Amostra lida: 2 ocorrências, 1 ninho, 1 projeção, 6 operações, 1 transferência, 1 visita, 1 abertura e 3 reservas. Dados/documentos estimados 29 KiB; índices estimados 237 KiB; total aproximado 266 KiB. Inclui ocorrência adicional sem ninho e auditoria da amostra, não uma média estatística de ninhos. Outros projetos lógicos não entraram nessa extrapolação. Nenhum conteúdo pessoal ou coordenada reproduzido aqui.

Extrapolação aritmética: 1 GiB / consumo dessa amostra ≈ 3.949 conjuntos semelhantes, sem reserva. Faixa de planejamento aproximada 2.000–3.000 ninhos acumulados com históricos comparáveis/curtos e folga; muitas visitas, correções ou observações longas reduzem a capacidade. Não é garantia nem teste de carga. Leituras diárias e carga inicial podem limitar antes do armazenamento; coleção no app atualmente limitada a 5.000 registros.

Validação: consultas REST retornaram sucesso; cálculo executado localmente. Código não mudou; testes/build não foram repetidos. Próximo passo: medir amostra de temporada representativa e avaliar redução de índices técnicos e leitura integral, preservando auditoria/dados e regras. Nenhuma otimização aplicada silenciosamente.
