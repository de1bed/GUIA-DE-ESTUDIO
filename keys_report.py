"""Inventario de dónde salió la respuesta de cada pregunta del cuestionario.

Cruza las claves impresas en el folleto (bank-v2/NN.json) con las completadas
en data/claves-ia.js y deja el resultado en data/procedencia-de-claves.md, para
poder auditar de un vistazo qué respuesta es original y cuál se dedujo.

Uso:  python keys_report.py      (después de python build_ia_keys.py)
"""
import json
import pathlib

BANK_DIR = pathlib.Path("bank-v2")
IA_JS = pathlib.Path("data/claves-ia.js")
OUT = pathlib.Path("data/procedencia-de-claves.md")

ia = json.loads(IA_JS.read_text(encoding="utf-8").split("=", 1)[1].rstrip().rstrip(";"))

ETIQUETA = {
    ("folleto", "impresa"): "folleto",
    ("duplicado", "exacta"): "duplicado",
    ("ia", "confirmada"): "IA confirmada",
    ("ia", "deducida"): "IA deducida",
    ("ia", "cambio"): "IA · norma cambiada",
}

filas, totales, revisables = [], {}, []
for path in sorted(BANK_DIR.glob("*.json")):
    hoja = int(path.stem)
    page = json.loads(path.read_text(encoding="utf-8"))
    cuenta = {}
    for q in page["questions"]:
        if q.get("key"):
            marca = ETIQUETA[("folleto", "impresa")]
        else:
            e = ia[str(hoja)][str(q["n"])]
            marca = ETIQUETA[(e["origen"], e["certeza"])]
            if e["origen"] == "ia" and e["certeza"] != "confirmada":
                revisables.append((hoja, q["n"], e["certeza"], q["en"]))
        cuenta[marca] = cuenta.get(marca, 0) + 1
        totales[marca] = totales.get(marca, 0) + 1
    filas.append((hoja, page["section"], len(page["questions"]), cuenta))

columnas = list(ETIQUETA.values())
lineas = [
    "# Procedencia de cada respuesta",
    "",
    f"Generado con `python keys_report.py` · {sum(totales.values())} preguntas en {len(filas)} hojas.",
    "",
    "| Procedencia | Preguntas | Qué significa |",
    "| --- | ---: | --- |",
    f"| folleto | {totales.get('folleto', 0)} | La clave venía impresa en el cuestionario original. |",
    f"| duplicado | {totales.get('duplicado', 0)} | La misma pregunta aparece en otra hoja con su clave impresa; se trasladó por el texto de la opción. |",
    f"| IA confirmada | {totales.get('IA confirmada', 0)} | Deducida de los manuales, con una frase literal que la respalda. |",
    f"| IA deducida | {totales.get('IA deducida', 0)} | Deducida por descarte o inferencia, sin frase literal. Revisable. |",
    f"| IA · norma cambiada | {totales.get('IA · norma cambiada', 0)} | La ley cambió desde 2003; se marca la clave del cuestionario y se explica la regla vigente. |",
    "",
    "## Por hoja",
    "",
    "| Hoja | Sección | Preguntas | " + " | ".join(columnas) + " |",
    "| ---: | --- | ---: | " + " | ".join(["---:"] * len(columnas)) + " |",
]
for hoja, seccion, total, cuenta in filas:
    celdas = " | ".join(str(cuenta.get(c, "")) for c in columnas)
    lineas += [f"| {hoja} | {seccion} | {total} | {celdas} |"]

lineas += [
    "",
    "## Respuestas a revisar",
    "",
    "Las que no tienen una frase literal del manual detrás. Son las únicas que",
    "conviene contrastar antes de estudiarlas como definitivas.",
    "",
    "| Hoja | Pregunta | Certeza | Enunciado |",
    "| ---: | ---: | --- | --- |",
]
for hoja, n, certeza, texto in revisables:
    lineas.append(f"| {hoja} | {n} | {certeza} | {texto} |")

OUT.write_text("\n".join(lineas) + "\n", encoding="utf-8")
print(f"{sum(totales.values())} preguntas · {len(revisables)} a revisar -> {OUT}")
for marca in columnas:
    print(f"   {marca:22s} {totales.get(marca, 0)}")
