"""Arma data/question-bank.js a partir de las transcripciones por página.

Cada archivo bank/NN.json corresponde al escaneo assets/questionnaire/page-NN.jpg
e incluye el folio real impreso a mano en el original.
"""
import json
import pathlib
import sys

BANK_DIR = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "bank")
OUT = pathlib.Path("data/question-bank.js")

bank = {}
for path in sorted(BANK_DIR.glob("*.json")):
    page = json.loads(path.read_text(encoding="utf-8"))
    entries = []
    for q in page["questions"]:
        entries.append({
            "n": q["n"],
            "section": q.get("section", page["section"]),
            "en": q["en"],
            "es": q["es"],
            "optsEn": q["opts_en"],
            "optsEs": q["opts_es"],
            **({"figure": True} if q.get("figure") else {}),
        })
    bank[str(page["file"])] = {
        "folio": page["folio"],
        "section": page["section"],
        "questions": entries,
    }

OUT.write_text(
    "window.QUESTION_BANK=" + json.dumps(bank, ensure_ascii=False, separators=(",", ":")) + ";\n",
    encoding="utf-8",
)
total = sum(len(p["questions"]) for p in bank.values())
print(f"{len(bank)} páginas transcritas · {total} preguntas con opciones -> {OUT}")
