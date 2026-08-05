"""Busca en los manuales el pasaje que respalda cada pregunta del cuestionario.

No decide solas las respuestas: extrae los fragmentos relevantes de los dos
manuales para que cada clave pueda contrastarse contra la fuente. La salida
alimenta la revisión manual que se registra en data/answer-audit.js.

Uso:  python audit_keys.py [hoja]      # sin argumento, todas
"""
import json
import pathlib
import re
import sys

import fitz

MANUALS = {
    "comercial": "DL-650-2019-2021-Aug-2023-passes-accessibility.pdf",
    "general": "8-11-25-DL-600-R6-2025-WWW.pdf",
}

STOP = set("""a about above after all also an and any are as at be been before being between both but by
can cannot could did do does doing down during each few for from further had has have having he her here
hers him his how i if in into is it its just me more most must my no nor not of off on once only or other
our out over own same she should so some such than that the their them then there these they this those
through to too under until up very was we were what when where which while who whom why will with you your""".split())


def load_bank():
    return {p.stem: json.loads(p.read_text(encoding="utf-8"))
            for p in sorted(pathlib.Path("bank").glob("*.json"))}


def load_keys():
    """pageForms usa comillas simples y claves sin comillar; se exporta con
    `node` a data/answer-keys.json, que es la fuente de esta auditoria."""
    return json.loads(pathlib.Path("data/answer-keys.json").read_text(encoding="utf-8"))


def manual_pages():
    out = {}
    for tag, path in MANUALS.items():
        doc = fitz.open(path)
        out[tag] = [re.sub(r"\s+", " ", doc[i].get_text()) for i in range(doc.page_count)]
    return out


def keywords(question, limit=6):
    """Terminos poco comunes del enunciado, que son los que localizan el pasaje."""
    words = re.findall(r"[a-z]{4,}", question.lower())
    seen, out = set(), []
    for w in words:
        if w in STOP or w in seen:
            continue
        seen.add(w)
        out.append(w)
    return out[:limit]


def search(pages, terms, want=3):
    """Paginas que contienen mas terminos del enunciado, mejor primero."""
    scored = []
    for i, text in enumerate(pages):
        low = text.lower()
        hits = [t for t in terms if t in low]
        if len(hits) >= max(2, len(terms) // 2):
            scored.append((len(hits), i + 1, hits, text))
    scored.sort(reverse=True, key=lambda x: x[0])
    return scored[:want]


def snippet(text, terms, width=260):
    low = text.lower()
    for t in terms:
        at = low.find(t)
        if at != -1:
            return text[max(0, at - width // 3):at + width].strip()
    return text[:width].strip()


def main():
    bank = load_bank()
    forms = load_keys()
    pages = manual_pages()
    only = sys.argv[1] if len(sys.argv) > 1 else None

    report = []
    for stem, page in bank.items():
        file_no = str(page["file"])
        if only and only != file_no:
            continue
        key = forms.get(file_no, {}).get("key", {})
        for q in page["questions"]:
            answer = key.get(str(q["n"]))
            terms = keywords(q["en"])
            evidence = []
            for tag, texts in pages.items():
                for score, pno, hits, text in search(texts, terms):
                    evidence.append({
                        "manual": tag, "pagina": pno, "coincidencias": score,
                        "texto": snippet(text, hits),
                    })
            report.append({
                "hoja": page["folio"], "archivo": page["file"], "n": q["n"],
                "pregunta": q["en"],
                "opciones": q["opts_en"],
                "clave": answer,
                "respuesta": q["opts_en"]["ABC".index(answer)] if answer else None,
                "evidencia": evidence[:4],
            })

    out = pathlib.Path(__file__).resolve().parent / ".codex-review" / "audit.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    con = sum(1 for r in report if r["evidencia"])
    print(f"{len(report)} preguntas · {con} con pasajes candidatos -> {out}")


if __name__ == "__main__":
    main()
