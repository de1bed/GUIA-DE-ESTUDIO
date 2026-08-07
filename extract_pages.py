"""Extracts the original embedded questionnaire scans byte-for-byte."""
from pathlib import Path

from pypdf import PdfReader

SOURCE = Path("Mandatory Class B Practice Test.pdf")
OUTPUT = Path("assets/questionnaire-v2")
OUTPUT.mkdir(parents=True, exist_ok=True)

reader = PdfReader(str(SOURCE))
for page_number, page in enumerate(reader.pages, start=1):
    embedded = page.images[0]
    destination = OUTPUT / f"page-{page_number:02}.jpg"
    destination.write_bytes(embedded.data)
    print(destination)
