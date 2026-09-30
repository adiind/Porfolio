"""Check PDF text extraction and reading order with two independent parsers."""
import json
import re
from html import unescape
from pathlib import Path

from pdfminer.high_level import extract_text
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "public/Adi_Agarwal_Resume_2026.pdf"
DATA = json.loads((ROOT / "data/resume-2026.json").read_text())


def plain(value):
    value = re.sub(r"<br\s*/?>", " ", value)
    return " ".join(unescape(re.sub(r"<[^>]+>", "", value)).split())


reader = PdfReader(PDF)
assert not reader.is_encrypted, "Resume must permit text extraction"
assert len(reader.pages) == 1, "Resume must remain one page"
assert PDF.stat().st_size < 2_500_000, "Resume exceeds common parser size limits"
page = reader.pages[0]
assert not list(page.images), "Resume must remain text rather than a raster image"

expected = [DATA["name"], *[c["text"] for c in DATA["contact"]], DATA["headline"], "WORK EXPERIENCE"]
for section, items in [(None, DATA["experience"]), ("SELECTED PROJECTS", DATA["projects"]), ("EDUCATION", DATA["education"]), ("LEADERSHIP & PROTOTYPING", DATA["leadership"]), (None, DATA["achievements"])]:
    if section:
        expected.append(section)
    for item in items:
        expected.append(item["title"])
        if item.get("degree"):
            expected.append(item["degree"])
        expected.append(item["meta"])
        expected.extend(item.get("bullets", []))
expected.extend(["SKILLS", DATA["skills"]])

for name, text in [("pypdf", page.extract_text()), ("PDFMiner", extract_text(str(PDF)))]:
    assert not any((ord(c) < 32 and c not in "\n\r\t\f") or ord(c) == 127 for c in text), f"{name}: control characters in extracted text"
    normalized = " ".join(text.split())
    cursor = 0
    for block in expected:
        fragment = plain(block)
        position = normalized.find(fragment, cursor)
        assert position >= 0, f"{name}: missing or reordered text: {fragment}"
        cursor = position + len(fragment)
    print(f"{name}: all content, role/date/bullet associations, and reading order PASS")

print(f"Resume PASS: one page, selectable text, {PDF.stat().st_size:,} bytes")
