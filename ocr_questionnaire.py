"""Build a page-level OCR draft. Output is never treated as verified source text."""
import argparse
import json
from pathlib import Path

from rapidocr_onnxruntime import RapidOCR

parser = argparse.ArgumentParser()
parser.add_argument("--start", type=int, default=1)
parser.add_argument("--end", type=int, default=26)
args = parser.parse_args()

source = Path("assets/questionnaire")
output = Path("data/ocr-drafts")
output.mkdir(parents=True, exist_ok=True)
ocr = RapidOCR()

for page in range(args.start, args.end + 1):
    image = source / f"page-{page:02}.jpg"
    result, _ = ocr(str(image))
    records = []
    for box, text, confidence in result or []:
        records.append({"box": box, "text": text, "confidence": confidence})
    destination = output / f"page-{page:02}.json"
    destination.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OCR draft {page:02}/26: {len(records)} lines", flush=True)
