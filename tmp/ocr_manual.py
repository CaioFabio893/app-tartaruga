"""Extrai texto das 7 paginas escaneadas do manual para revisao humana.

Uso: python tmp/ocr_manual.py
Saida: tmp/ocr/paginaN.txt (uma pagina por arquivo, ordem de leitura aproximada)
"""

from pathlib import Path
import sys

from rapidocr_onnxruntime import RapidOCR

RAIZ = Path(__file__).resolve().parent.parent
SRC = RAIZ / "tmp" / "pdfs"
DST = RAIZ / "tmp" / "ocr"


def main() -> int:
    paginas = sorted(SRC.glob("page*.png"))
    if not paginas:
        print("nenhuma pagina encontrada em", SRC)
        return 1

    DST.mkdir(parents=True, exist_ok=True)
    engine = RapidOCR()

    for i, img in enumerate(paginas):
        resultado, _ = engine(str(img))
        linhas = []
        if resultado:
            # ordena por cima (y) e depois por esquerda (x) para manter a ordem da tabela
            for caixa, texto, score in sorted(
                resultado, key=lambda r: (round(r[0][0][1] / 12), r[0][0][0])
            ):
                linhas.append(f"{texto}\t[{score:.2f}]")
        destino = DST / f"pagina{i}.txt"
        destino.write_text("\n".join(linhas), encoding="utf-8")
        print(f"{img.name}: {len(linhas)} blocos -> {destino.name}")

    return 0


if __name__ == "__main__":
    sys.exit(main())