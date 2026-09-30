"""Build the one-page 2026 resume. Requires reportlab and Arial TTF fonts."""
import json
import os
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, KeepTogether,
)

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "data/resume-2026.json").read_text())
FONT_DIR = Path(os.environ.get("RESUME_FONT_DIR", "/System/Library/Fonts/Supplemental"))
pdfmetrics.registerFont(TTFont("Resume", str(FONT_DIR / "Arial.ttf")))
pdfmetrics.registerFont(TTFont("ResumeBold", str(FONT_DIR / "Arial Bold.ttf")))
pdfmetrics.registerFontFamily("Resume", normal="Resume", bold="ResumeBold")
OUTPUT = ROOT / "public/Adi_Agarwal_Resume_2026.pdf"
WIDTH = A4[0] - 64
BODY = ParagraphStyle("Body", fontName="Resume", fontSize=10.2, leading=13)
SMALL = ParagraphStyle("Small", parent=BODY, fontSize=9.2, leading=12)
TITLE = ParagraphStyle("Title", parent=BODY, fontName="ResumeBold", fontSize=10.5, leading=13.5)
SECTION = ParagraphStyle("Section", parent=TITLE, fontSize=10, leading=12.5)
NAME = ParagraphStyle("Name", parent=TITLE, fontSize=25, leading=30)


def p(text, style=BODY):
    return Paragraph(text, style)


def row(left, right, style=TITLE):
    # Keep each role and its dates in one text flow. Separate right-aligned
    # objects let PDF parsers insert dates midway through the bullet below.
    return p(f'{left}<font name="Resume" size="9" color="#555555"> | {right}</font>', style)


def section(title):
    return [Spacer(1, 4), HRFlowable(width="100%", thickness=0.55, color=colors.HexColor('#8C8C8C')),
            Spacer(1, 4), p(title, SECTION), Spacer(1, 4)]


def entry(item):
    title = escape(item["title"])
    if item.get("url"):
        title = f'<link href="{escape(item["url"])}">{title}</link>'
    content = [row(title, escape(item["meta"])), Spacer(1, 2)]
    for text in item["bullets"]:
        bullet_style = ParagraphStyle("Bullet", parent=BODY, leftIndent=10, firstLineIndent=0, bulletIndent=1,
                                      bulletFontName="Resume", bulletFontSize=BODY.fontSize)
        content.append(Paragraph(text, bullet_style, bulletText="\u2022"))
        content.append(Spacer(1, 1))
    content.append(Spacer(1, 2))
    return KeepTogether(content)


story = [p(escape(DATA["name"]), NAME), Spacer(1, 5)]
contact = '  |  '.join(f'<link href="{escape(c["url"])}">{escape(c["text"])}</link>' for c in DATA["contact"])
story += [p(contact, SMALL), Spacer(1, 8),
          p(escape(DATA["headline"]), ParagraphStyle("Headline", parent=BODY, textColor=colors.HexColor('#444444')))]
story += section("WORK EXPERIENCE")
story += [entry(item) for item in DATA["experience"]]
story += section("SELECTED PROJECTS")
story += [entry(item) for item in DATA["projects"]]
if DATA.get("additionalProject"):
    story.append(p(DATA["additionalProject"], SMALL))
story += section("EDUCATION")
for item in DATA["education"]:
    degree = f'<b>{escape(item["title"])}</b> · {escape(item["degree"])}'
    story += [row(degree, escape(item["meta"]), SMALL), Spacer(1, 4)]
story += section("LEADERSHIP & PROTOTYPING")
story += [entry(item) for item in DATA["leadership"]]
for item in DATA["achievements"]:
    story += [row(escape(item["title"]), escape(item["meta"]), SMALL), Spacer(1, 3)]
story += section("SKILLS")
story.append(p(DATA["skills"], SMALL))

doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, leftMargin=26, rightMargin=26,
                        topMargin=25, bottomMargin=25, title="Aditya Agarwal - Resume 2026", author="Aditya Agarwal")
doc.build(story)
print(OUTPUT)
