"""Genera el cuestionario en español a partir del banco de preguntas.

El PDF fuente solo existe en inglés, así que la biblioteca no tenía versión
en español de su documento principal. Este script arma esa versión con las
transcripciones de bank/NN.json, conservando el folio, la sección y la
numeración del original.

No es una reproducción del formulario oficial: cada hoja va rotulada como
traducción de estudio no oficial.
"""
import json
import pathlib

from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, PageBreak, PageTemplate,
    Paragraph, Spacer,
)

BANK_DIR = pathlib.Path("bank")
OUT = pathlib.Path("Cuestionario impreso - Espanol.pdf")

INK = "#102637"
MUTED = "#5b6b78"
RULE = "#bcc8ce"

base = getSampleStyleSheet()
styles = {
    "section": ParagraphStyle(
        "section", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=11.5,
        leading=15, alignment=TA_CENTER, textColor=INK, spaceAfter=2),
    "grade": ParagraphStyle(
        "grade", parent=base["Normal"], fontName="Helvetica", fontSize=8.5,
        leading=11, alignment=TA_CENTER, textColor=MUTED, spaceAfter=14),
    "q": ParagraphStyle(
        "q", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=10,
        leading=13.5, textColor=INK, spaceBefore=9, spaceAfter=1),
    "qen": ParagraphStyle(
        "qen", parent=base["Normal"], fontName="Helvetica-Oblique", fontSize=8,
        leading=10.5, textColor=MUTED, leftIndent=16, spaceAfter=4),
    "opt": ParagraphStyle(
        "opt", parent=base["Normal"], fontName="Helvetica", fontSize=9.5,
        leading=12.5, textColor=INK, leftIndent=30, spaceAfter=1),
    "note": ParagraphStyle(
        "note", parent=base["Normal"], fontName="Helvetica-Oblique", fontSize=7.5,
        leading=10, textColor="#8a6d1f", leftIndent=30, spaceBefore=2, spaceAfter=3),
    "blank": ParagraphStyle(
        "blank", parent=base["Normal"], fontName="Helvetica-Oblique", fontSize=9,
        leading=12, textColor=MUTED, leftIndent=30, spaceAfter=3),
}

ESCAPES = {"&": "&amp;", "<": "&lt;", ">": "&gt;"}

SECTIONS_ES = {
    "General Knowledge / Air Brake Test": "Conocimientos Generales / Prueba de Frenos de Aire",
    "General Knowledge Test": "Prueba de Conocimientos Generales",
    "Air Brake Test": "Prueba de Frenos de Aire",
    "Passenger Transport Endorsement": "Endoso de Transporte de Pasajeros",
    "Class C Examination": "Examen de Clase C",
    "Commercial Driver Examination": "Examen de Conductor Comercial",
}


def esc(text):
    return "".join(ESCAPES.get(c, c) for c in str(text))


def load_pages():
    pages = []
    for path in sorted(BANK_DIR.glob("*.json")):
        pages.append(json.loads(path.read_text(encoding="utf-8")))
    return pages


def page_furniture(canvas, doc):
    """Encabezado y pie repetidos: identifican la hoja y la naturaleza del documento."""
    canvas.saveState()
    width, height = letter

    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(INK)
    canvas.drawString(inch * 0.85, height - inch * 0.62, "RUTA CDL · CUESTIONARIO EN ESPAÑOL")
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(width - inch * 0.85, height - inch * 0.62,
                           f"Hoja {doc.folio} del folleto original")
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.6)
    canvas.line(inch * 0.85, height - inch * 0.72, width - inch * 0.85, height - inch * 0.72)

    canvas.setFont("Helvetica", 6.8)
    canvas.setFillColor(MUTED)
    canvas.drawString(inch * 0.85, inch * 0.55,
                      "Traducción de estudio no oficial. No sustituye al formulario original ni a "
                      "ninguna publicación del DMV de California.")
    canvas.drawRightString(width - inch * 0.85, inch * 0.55, f"{doc.page}")
    canvas.restoreState()


def build():
    pages = load_pages()

    doc = BaseDocTemplate(
        str(OUT), pagesize=letter,
        leftMargin=inch * 0.85, rightMargin=inch * 0.85,
        topMargin=inch * 0.95, bottomMargin=inch * 0.8,
        title="Cuestionario impreso · Español",
        author="Ruta CDL — traducción de estudio",
        subject="Traducción al español del cuestionario de conocimientos comerciales",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="body")
    doc.folio = pages[0]["folio"]
    doc.addPageTemplates([PageTemplate(id="hoja", frames=[frame], onPage=page_furniture)])

    story = []
    for index, page in enumerate(pages):
        if index:
            story.append(PageBreak())

        # El folio se fija antes de dibujar la página, por eso se envuelve en un flowable.
        folio = page["folio"]

        class SetFolio(Spacer):
            def __init__(self, value):
                super().__init__(0, 0)
                self.value = value

            def draw(self):
                self.canv._doctemplate.folio = self.value

        story.append(SetFolio(folio))
        section_en = page["section"]
        section_es = SECTIONS_ES.get(section_en, section_en)
        story.append(Paragraph(esc(section_es), styles["section"]))
        story.append(Paragraph(
            f"{esc(section_en)} · hoja {folio} · {len(page['questions'])} preguntas",
            styles["grade"]))

        for q in page["questions"]:
            block = [
                Paragraph(f"{q['n']}. {esc(q['es'])}", styles["q"]),
                Paragraph(esc(q["en"]), styles["qen"]),
            ]
            for letter_label, option_es, option_en in zip("ABC", q["opts_es"], q["opts_en"]):
                block.append(Paragraph(
                    f"<font color='{MUTED}'>☐</font>  <b>{letter_label}.</b> {esc(option_es)}"
                    f"  <font size='7.5' color='{MUTED}'>({esc(option_en)})</font>",
                    styles["opt"]))
            if q.get("figure"):
                block.append(Paragraph(
                    "Esta pregunta depende de una figura impresa: consúltala en el escaneo original.",
                    styles["note"]))
            if q.get("note"):
                block.append(Paragraph(esc(q["note"]), styles["note"]))
            story.append(KeepTogether(block))

    doc.build(story)
    total = sum(len(p["questions"]) for p in pages)
    print(f"{len(pages)} hojas · {total} preguntas -> {OUT}")


if __name__ == "__main__":
    build()
