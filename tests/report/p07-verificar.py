"""Conferência independente do PDF fictício gerado com P07_GRAVAR=1.

Requer pdfplumber no ambiente de verificação, não no aplicativo.
"""
import json
import re
import unicodedata
from pathlib import Path

import pdfplumber


def normalizar(texto):
    return re.sub(r"\s+", "", unicodedata.normalize("NFC", texto))


esperado = json.loads(Path("tmp/pdfs/p07/conteudo-esperado.json").read_text(encoding="utf-8"))
with pdfplumber.open("output/pdf/relatorio-p07-demonstracao.pdf") as pdf:
    # Excluir faixa de cabeçalho/identificação e rodapé repetidos entre páginas.
    texto = normalizar("".join(c["text"] for p in pdf.pages for c in p.chars if 88 <= c["top"] <= 790))
    ausentes = [valor for linha in esperado for valor in linha if normalizar(valor) not in texto]
    fora = [(i + 1, c["text"]) for i, p in enumerate(pdf.pages) for c in p.chars
            if c["x0"] < 31 or c["x1"] > 565 or c["top"] < 0 or c["bottom"] > 825]
    assert not ausentes, f"Rótulos/valores ausentes: {len(ausentes)}"
    assert not fora, f"Caracteres fora das margens: {fora}"
    assert len(pdf.pages) < 19, "A mesma amostra precisa ocupar menos páginas que o layout anterior."
    print(f"{len(pdf.pages)} páginas; {len(esperado)*2} rótulos/valores presentes; sem caracteres fora das margens.")
