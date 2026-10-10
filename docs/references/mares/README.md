# Fonte das marés — Recife 2026

Centro de Hidrografia da Marinha, Tábuas das Marés DG6-63, Porto do Recife (Estado de Pernambuco), páginas 82–84, edição 2026, UTC -03.0. PDF original preservado em `recife-2026.pdf`.

URL verificada pela linha Porto do Recife da lista oficial: https://www.marinha.mil.br/chm/sites/www.marinha.mil.br.chm/files/dados_de_mare/24%20-%20PORTO%20DO%20RECIFE%20-%2082%20-%2084.pdf . Obtido em 03/10/2026.

SHA256: `721a006b9f25a1a25bded9ccac2e179ac665dd28aae35a7be5c68f06e2fea49f`.

Reprodução: Python com pdfplumber, `python scripts/extrair-mares.py`. Extração por 8 colunas em cada página, 4 meses/página; valida 365 datas, 3–4 eventos/dia, horas válidas e ordem cronológica. Comparação independente com texto completo das três páginas confirma todos os 1.411 pares horário/altura e suas multiplicidades. JSON em `src/features/mares/recife-2026.json` conserva valores publicados e fonte/hash. Testes fixam dois dias conferidos nas páginas 82/84, classificação alta/baixa, próximo evento/fuso e ausência de edição futura.

Uso: dados factuais de horário e altura, com atribuição. Não redistribuir o desenho da publicação como arte modificada. Não usar tabelas de blogs como fonte científica nem extrapolar para outras praias. Para nova edição, baixar/conferir original e adaptar extração; não reutilizar 2026 com outro ano. A extração é específica à diagramação desta edição.
