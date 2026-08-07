"""Genera el cuestionario en español a partir del banco de preguntas.

Las preguntas de bank-v2/NN.json se transcribieron leyendo los escaneos uno por
uno, no con OCR. Este script solo las maqueta: conserva el folio, la sección
y la numeración del original.

No reproduce el formulario oficial: cada hoja va rotulada como traducción de
estudio no oficial.
"""
import json
import pathlib

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

BANK_DIR = pathlib.Path("bank-v2")
OUT = pathlib.Path("Mandatory Class B Practice Test - Espanol.pdf")

INK = colors.HexColor("#102637")
MUTED = colors.HexColor("#6b7a86")
FAINT = colors.HexColor("#9aa8b2")
RULE = colors.HexColor("#c8d2d9")
AMBER = colors.HexColor("#b8860b")

SECTIONS_ES = {
    "General Knowledge / Air Brake Test": "Conocimientos Generales / Prueba de Frenos de Aire",
    "General Knowledge Test": "Prueba de Conocimientos Generales",
    "Air Brake Test": "Prueba de Frenos de Aire",
    "Passenger Transport Endorsement": "Endoso de Transporte de Pasajeros",
    "Class C Examination": "Examen de Clase C",
    "Commercial Driver Examination": "Examen de Conductor Comercial",
}

ESCAPES = {"&": "&amp;", "<": "&lt;", ">": "&gt;"}
base = getSampleStyleSheet()


def style(name, **kw):
    return ParagraphStyle(name, parent=base["Normal"], **kw)


S = {
    "cover_title": style("cover_title", fontName="Helvetica-Bold", fontSize=25, leading=30,
                         textColor=INK, spaceAfter=8),
    "cover_sub": style("cover_sub", fontName="Helvetica", fontSize=11, leading=16,
                       textColor=MUTED, spaceAfter=20),
    "cover_body": style("cover_body", fontName="Helvetica", fontSize=9.5, leading=15,
                        textColor=INK, spaceAfter=9),
    "toc": style("toc", fontName="Helvetica", fontSize=9, leading=14, textColor=INK),
    "section": style("section", fontName="Helvetica-Bold", fontSize=13, leading=17,
                     textColor=INK, spaceAfter=2),
    "section_en": style("section_en", fontName="Helvetica", fontSize=8, leading=11,
                        textColor=FAINT, spaceAfter=16),
    "q_es": style("q_es", fontName="Helvetica-Bold", fontSize=10.5, leading=14.5,
                  textColor=INK, spaceAfter=2),
    "q_en": style("q_en", fontName="Helvetica-Oblique", fontSize=8, leading=11,
                  textColor=FAINT, spaceAfter=7),
    "o_es": style("o_es", fontName="Helvetica", fontSize=10, leading=13.5, textColor=INK),
    "o_en": style("o_en", fontName="Helvetica-Oblique", fontSize=7.5, leading=10,
                  textColor=FAINT, spaceBefore=1),
    "letter": style("letter", fontName="Helvetica-Bold", fontSize=9.5, leading=12,
                    textColor=INK, alignment=TA_CENTER),
    "note": style("note", fontName="Helvetica-Oblique", fontSize=7.5, leading=10.5,
                  textColor=AMBER, spaceBefore=5),
}


def esc(text):
    return "".join(ESCAPES.get(c, c) for c in str(text))


def load_pages():
    return [json.loads(p.read_text(encoding="utf-8")) for p in sorted(BANK_DIR.glob("*.json"))]


def question_range(page):
    """Rango de numeros impresos; algunas hojas cambian de seccion a medio camino."""
    numbers = [q["n"] for q in page["questions"]]
    runs, start = [], 0
    for i in range(1, len(numbers) + 1):
        if i == len(numbers) or numbers[i] != numbers[i - 1] + 1:
            runs.append((numbers[start], numbers[i - 1]))
            start = i
    return ", ".join(str(a) if a == b else f"{a}\u2013{b}" for a, b in runs)


def question_block(q):
    """Una pregunta: enunciado, referencia en inglés y tres opciones con casilla."""
    def checkbox():
        """Cuadro pequeño y fijo: una tabla anidada de 11x11 con borde."""
        box = Table([[""]], colWidths=[11], rowHeights=[11])
        box.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.8, RULE),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        return box

    rows = []
    for label, es_text, en_text in zip("ABC", q["opts_es"], q["opts_en"]):
        body = [Paragraph(esc(es_text), S["o_es"]), Paragraph(esc(en_text), S["o_en"])]
        rows.append([checkbox(), Paragraph(label, S["letter"]), body])

    table = Table(rows, colWidths=[18, 18, 400], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (0, -1), 0),
        ("TOPPADDING", (0, 0), (0, -1), 3),
        ("TOPPADDING", (1, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (2, 0), (2, -1), 4),
    ]))

    block = [
        Paragraph(f"<b>{q['n']}.</b>&nbsp;&nbsp;{esc(q['es'])}", S["q_es"]),
        Paragraph(esc(q["en"]), S["q_en"]),
        table,
    ]
    if q.get("figure"):
        block.append(Paragraph(
            "▲ Depende de una figura impresa: consúltala en el escaneo original.", S["note"]))
    if q.get("note"):
        block.append(Paragraph(f"▲ {esc(q['note'])}", S["note"]))
    block.append(Spacer(0, 9))
    return KeepTogether(block)


def furniture(canvas, doc):
    canvas.saveState()
    width, height = letter
    if doc.folio is not None:
        canvas.setFont("Helvetica-Bold", 7.5)
        canvas.setFillColor(INK)
        canvas.drawString(inch * 0.8, height - inch * 0.6, "CUESTIONARIO CDL · TRADUCCIÓN AL ESPAÑOL")
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawRightString(width - inch * 0.8, height - inch * 0.6,
                               f"Hoja {doc.folio} del folleto original")
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.6)
        canvas.line(inch * 0.8, height - inch * 0.7, width - inch * 0.8, height - inch * 0.7)

    canvas.setFont("Helvetica", 6.5)
    canvas.setFillColor(FAINT)
    canvas.drawString(inch * 0.8, inch * 0.5,
                      "Traducción de estudio no oficial · no sustituye al formulario original "
                      "ni a ninguna publicación del DMV de California")
    canvas.drawRightString(width - inch * 0.8, inch * 0.5, str(doc.page))
    canvas.restoreState()


class SetFolio(Spacer):
    """Fija el folio que dibujará el encabezado de la página en curso."""

    def __init__(self, value):
        super().__init__(0, 0)
        self.value = value

    def draw(self):
        self.canv._doctemplate.folio = self.value


def build():
    pages = load_pages()
    total = sum(len(p["questions"]) for p in pages)

    doc = BaseDocTemplate(
        str(OUT), pagesize=letter,
        leftMargin=inch * 0.8, rightMargin=inch * 0.8,
        topMargin=inch * 0.9, bottomMargin=inch * 0.75,
        title="Mandatory Class B Practice Test · Español",
        author="Ruta CDL — traducción de estudio",
        subject="Traducción al español del cuestionario de conocimientos comerciales",
    )
    doc.folio = None  # la portada y el índice no llevan folio
    doc.addPageTemplates([PageTemplate(
        id="hoja",
        frames=[Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="body")],
        onPage=furniture)])

    story = [
        Paragraph("Mandatory Class B Practice Test", S["cover_title"]),
        Paragraph("Traducción de estudio al español · California", S["cover_sub"]),
        Paragraph(
            f"Contiene las <b>{len(pages)} hojas</b> escaneadas del folleto original y sus "
            f"<b>{total} preguntas</b>, cada una con su enunciado en español, la frase original "
            "en inglés como referencia y las tres opciones tal como se imprimen.", S["cover_body"]),
        Paragraph(
            "El PDF fuente contiene las <b>52 hojas consecutivas</b> del folleto. Se conserva "
            "el folio impreso, la sección, la numeración y el orden de cada pregunta.", S["cover_body"]),
        Paragraph(
            "Las preguntas se transcribieron leyendo los escaneos uno por uno. Donde el original "
            "trae una anotación manuscrita o depende de una figura impresa, queda señalado bajo "
            "la pregunta.", S["cover_body"]),
        Spacer(0, 16),
        Paragraph("<b>Contenido</b>", S["cover_body"]),
    ]

    toc = [[Paragraph("<b>Hoja</b>", S["toc"]), Paragraph("<b>Sección</b>", S["toc"]),
            Paragraph("<b>Preguntas</b>", S["toc"])]]
    for page in pages:
        toc.append([
            Paragraph(str(page["folio"]), S["toc"]),
            Paragraph(esc(SECTIONS_ES.get(page["section"], page["section"])), S["toc"]),
            Paragraph(question_range(page), S["toc"]),
        ])
    toc_table = Table(toc, colWidths=[45, 330, 70], hAlign="LEFT")
    toc_table.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, 0), 0.8, RULE),
        ("LINEBELOW", (0, 1), (-1, -2), 0.3, colors.HexColor("#e8edf0")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(toc_table)

    for page in pages:
        story.append(PageBreak())
        story.append(SetFolio(page["folio"]))
        section_en = page["section"]
        story.append(Paragraph(
            esc(SECTIONS_ES.get(section_en, section_en)), S["section"]))
        story.append(Paragraph(
            f"{esc(section_en)} &nbsp;·&nbsp; hoja {page['folio']} del folleto &nbsp;·&nbsp; "
            f"{len(page['questions'])} preguntas", S["section_en"]))
        for q in page["questions"]:
            story.append(question_block(q))

    doc.build(story)
    print(f"{len(pages)} hojas · {total} preguntas -> {OUT}")


if __name__ == "__main__":
    build()
