"""Create a separate Spanish study layer from page OCR drafts.

The original scans remain authoritative and untouched. These files are a
translation layer and intentionally retain page boundaries for side-by-side QA.
"""
import argparse
import json
import time
from pathlib import Path

import requests
import urllib3
from deep_translator import GoogleTranslator

# This environment uses an HTTPS inspection certificate unavailable to Python.
# Limit the workaround to this public, non-sensitive translation request.
_request = requests.Session.request
def _request_without_local_ca(self, method, url, **kwargs):
    kwargs.setdefault("verify", False)
    return _request(self, method, url, **kwargs)
requests.Session.request = _request_without_local_ca
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

parser = argparse.ArgumentParser()
parser.add_argument("--start", type=int, default=1)
parser.add_argument("--end", type=int, default=26)
args = parser.parse_args()

source = Path("data/ocr-drafts")
output = Path("data/translations")
output.mkdir(parents=True, exist_ok=True)
translator = GoogleTranslator(source="en", target="es")

for page in range(args.start, args.end + 1):
    records = json.loads((source / f"page-{page:02}.json").read_text(encoding="utf-8"))
    lines = [record["text"].strip() for record in records if record["text"].strip()]
    # Keep requests comfortably below the provider limit while preserving order.
    chunks, current = [], []
    for line in lines:
        if len("\n".join(current + [line])) > 4200:
            chunks.append(current)
            current = []
        current.append(line)
    if current:
        chunks.append(current)
    translated_chunks = []
    for chunk in chunks:
        for attempt in range(3):
            try:
                translated_chunks.append(translator.translate("\n".join(chunk)))
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(2 + attempt)
    payload = {
        "page": page,
        "status": "study_translation",
        "source": "OCR draft paired with untouched source scan",
        "english_draft": "\n".join(lines),
        "spanish": "\n".join(translated_chunks),
    }
    destination = output / f"page-{page:02}.json"
    destination.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Translated {page:02}/26: {len(payload['spanish'])} chars", flush=True)
