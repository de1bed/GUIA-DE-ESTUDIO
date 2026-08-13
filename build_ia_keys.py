"""Arma data/claves-ia.js: las respuestas que el cuestionario no traía.

El folleto original sólo llegó con clave en 271 de sus 500 preguntas. Las 229
restantes se completan aquí, y el portal las muestra siempre etiquetadas como
derivadas, nunca mezcladas con las que sí venían impresas.

Dos procedencias, ninguna inventada:

  duplicado  La misma pregunta aparece en otra hoja CON su clave original. Se
             traslada por el TEXTO de la opción correcta, no por su letra: el
             orden de las opciones cambia de una hoja a otra.
  ia         Deducida leyendo los manuales oficiales del repositorio. Cada una
             se declara a mano en data/claves-ia.json con su cita y su nivel
             de certeza (confirmada / deducida / cambio).

Uso:  python build_ia_keys.py
"""
import json
import pathlib
import re
import sys

BANK_DIR = pathlib.Path("bank-v2")
FUENTE = pathlib.Path("data/claves-ia.json")
OUT_JS = pathlib.Path("data/claves-ia.js")

norm = lambda s: re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()

paginas = {int(p.stem): json.loads(p.read_text(encoding="utf-8"))
           for p in sorted(BANK_DIR.glob("*.json"))}


def firma(q):
    """Identifica una pregunta por su enunciado y su juego de opciones, sin
    depender del orden en que estén impresas."""
    return norm(q["en"]), tuple(sorted(norm(o) for o in q["opts_en"]))


def pregunta(hoja, n):
    for q in paginas[hoja]["questions"]:
        if q["n"] == n:
            return q
    raise SystemExit(f"La hoja {hoja} no tiene la pregunta {n}.")


def letra_por_texto(q, texto):
    """Traduce el texto de la opción correcta a la letra que le toca en ESTA
    hoja. Devuelve None si esa hoja no imprime esa opción."""
    for letra, opcion in zip("ABC", q["opts_en"]):
        if norm(opcion) == texto:
            return letra
    return None


# --- 1. Lo que ya venía con clave, indexado por firma ------------------------
originales = {}
for hoja, datos in paginas.items():
    for q in datos["questions"]:
        if q.get("key"):
            texto = norm(q["opts_en"]["ABC".index(q["key"])])
            originales.setdefault(firma(q), {}).setdefault(texto, (hoja, q["n"]))

for f, textos in originales.items():
    if len(textos) > 1:
        print(f"AVISO: claves originales en conflicto para «{f[0][:60]}»: {list(textos)}")

# --- 2. Lo que se deduce a mano de los manuales ------------------------------
fuente = json.loads(FUENTE.read_text(encoding="utf-8"))
deducidas = {}
for e in fuente["deducciones"]:
    hoja, n = (int(x) for x in e["ref"].split("."))
    q = pregunta(hoja, n)
    if e["clave"] not in "ABC":
        raise SystemExit(f"{e['ref']}: la clave debe ser A, B o C.")
    texto = norm(q["opts_en"]["ABC".index(e["clave"])])
    f = firma(q)
    if f in originales:
        raise SystemExit(f"{e['ref']}: esta pregunta ya tiene clave original, no hay que deducirla.")
    if f in deducidas:
        raise SystemExit(f"{e['ref']}: duplica una deducción ya declarada.")
    deducidas[f] = (texto, e)

# --- 3. Resolver cada pregunta sin clave ------------------------------------
salida, sin_resolver = {}, []
for hoja in sorted(paginas):
    for q in paginas[hoja]["questions"]:
        if q.get("key"):
            continue
        f = firma(q)
        if f in originales:
            texto, (h_src, n_src) = next(iter(originales[f].items()))
            entrada = {
                "clave": letra_por_texto(q, texto),
                "origen": "duplicado",
                "certeza": "exacta",
                "fuente": f"hoja {h_src}, pregunta {n_src}",
                "nota": (f"Enunciado y opciones idénticos a la hoja {h_src}, pregunta {n_src}, "
                         "cuya clave sí venía impresa en el folleto."),
            }
        elif f in deducidas:
            texto, e = deducidas[f]
            entrada = {
                "clave": letra_por_texto(q, texto),
                "origen": "ia",
                "certeza": e["certeza"],
                "manual": e["manual"],
                "pagina": e["pagina"],
                "cita": e["cita"],
                "nota": e["nota"],
            }
        else:
            sin_resolver.append((hoja, q["n"], q["en"][:70]))
            continue
        if entrada["clave"] is None:
            raise SystemExit(f"hoja {hoja} pregunta {q['n']}: la opción correcta no aparece en esta hoja.")
        salida.setdefault(str(hoja), {})[str(q["n"])] = entrada

OUT_JS.write_text(
    "window.CLAVES_IA=" + json.dumps(salida, ensure_ascii=False, separators=(",", ":")) + ";\n",
    encoding="utf-8",
)

total = sum(len(v) for v in salida.values())
por_origen = {}
for hoja in salida.values():
    for e in hoja.values():
        por_origen[(e["origen"], e["certeza"])] = por_origen.get((e["origen"], e["certeza"]), 0) + 1
print(f"{total} claves completadas -> {OUT_JS}")
for (origen, certeza), n in sorted(por_origen.items()):
    print(f"   {origen:10s} {certeza:12s} {n}")
if sin_resolver:
    print(f"\nSIN RESOLVER ({len(sin_resolver)}):")
    for hoja, n, texto in sin_resolver:
        print(f"   {hoja}.{n} {texto}")
    sys.exit(1)
