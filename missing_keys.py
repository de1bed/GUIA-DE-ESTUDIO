"""Localiza las preguntas del cuestionario que todavía no tienen clave.

El botón "Verificar respuesta" del portal sólo aparece cuando la pregunta
lleva `key` en bank-v2/NN.json. Este script recorre las 52 hojas y deja el
inventario en data/claves-pendientes.md, para saber exactamente dónde falta
la respuesta y no confundir el hueco con un fallo de la interfaz.

Uso:  python missing_keys.py
"""
import json
import pathlib

BANK_DIR = pathlib.Path("bank-v2")
OUT = pathlib.Path("data/claves-pendientes.md")


def rangos(numeros):
    """Comprime [11,12,13,15] en "11-13, 15"; la numeración reinicia por
    sección, así que un rango puede volver a empezar dentro de la hoja."""
    tramos = []
    for n in numeros:
        if tramos and n == tramos[-1][1] + 1:
            tramos[-1][1] = n
        else:
            tramos.append([n, n])
    return ", ".join(str(a) if a == b else f"{a}-{b}" for a, b in tramos)


hojas = []
for path in sorted(BANK_DIR.glob("*.json")):
    page = json.loads(path.read_text(encoding="utf-8"))
    preguntas = page["questions"]
    faltan = [q["n"] for q in preguntas if not q.get("key")]
    hojas.append((int(path.stem), page["section"], len(preguntas), faltan))

total = sum(h[2] for h in hojas)
sin_clave = sum(len(h[3]) for h in hojas)

lineas = [
    "# Preguntas sin clave de respuesta",
    "",
    f"Generado con `python missing_keys.py` · {total} preguntas en {len(hojas)} hojas · "
    f"{total - sin_clave} con clave · **{sin_clave} sin clave**.",
    "",
    "El botón «Verificar respuesta» aparece sólo en las preguntas con clave.",
    "Donde falta, el portal ahora lo dice en lugar de dejar el hueco en blanco.",
    "",
    "| Hoja | Sección | Preguntas | Sin clave | Números sin clave |",
    "| ---: | --- | ---: | ---: | --- |",
]
for numero, seccion, cuantas, faltan in hojas:
    lineas.append(
        f"| {numero} | {seccion} | {cuantas} | {len(faltan)} | {rangos(faltan) or '—'} |"
    )

OUT.write_text("\n".join(lineas) + "\n", encoding="utf-8")
print(f"{sin_clave} preguntas sin clave de {total} -> {OUT}")
