"""Print-first visual resume. Separate from the ATS resume; uses approved source claims."""
from pathlib import Path
from io import BytesIO
from PIL import Image
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/pdf/visual-resume'
OUT.mkdir(parents=True,exist_ok=True)
FONT=Path('/System/Library/Fonts/Supplemental')
for n,f in [('Body','Arial.ttf'),('Bold','Arial Bold.ttf'),('Display','Georgia Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(n,str(FONT/f)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold')
W,H=612,792
GREEN='#163F36'; LIME='#DCF087'; INK='#182D27'; MUTED='#52665D'; PAPER='#FCFBF7'; SIDE='#EDF2E8'
c=canvas.Canvas(str(OUT/'Aditya_Agarwal_Visual_Resume_2026.pdf'),pagesize=(W,H))
c.setTitle('Aditya Agarwal | Product Management, AI & Prototyping')
c.setAuthor('Aditya Agarwal')

def box(x,t,w,h,color):
    c.setFillColor(HexColor(color));c.rect(x,H-t-h,w,h,fill=1,stroke=0)
def text(s,x,t,size=10,font='Body',color=INK):
    c.setFillColor(HexColor(color));c.setFont(font,size);c.drawString(x,H-t-size,s)
def para(s,x,t,w,size=9.5,leading=12.6,color=INK,font='Body'):
    p=Paragraph(s,ParagraphStyle('p',fontName=font,fontSize=size,leading=leading,textColor=HexColor(color)))
    _,h=p.wrap(w,H);p.drawOn(c,x,H-t-h)
    assert t+h<758, f'Content exceeds footer: {s[:65]} at {t+h}'
    return t+h
def label(s,x,t,w):
    box(x,t+2,4,10,GREEN)
    text(s,x+10,t,9,'Bold',GREEN)
    return t+20
def role(company,title,dates,bullets,t):
    text(company,32,t,13,'Bold',GREEN)
    tw=pdfmetrics.stringWidth(dates,'Body',8)
    text(dates,363-tw,t+3,8,'Body',MUTED)
    t=para(title,32,t+18,331,9.4,12,font='Bold')+5
    for b in bullets:
        box(33,t+4,2.5,2.5,GREEN)
        t=para(b,42,t,321)+3
    return t+6

box(0,0,W,H,PAPER)
box(0,0,W,132,GREEN)
box(32,18,30,3,LIME)
text('Aditya Agarwal',30,29,31,'Display','#FFFFFF')
text('PRODUCT MANAGEMENT',32,72,11,'Bold',LIME)
text('AI fluency. Analytical depth. Hands-on making.',32,91,10,'Body','#FFFFFF')
text('kriitya@gmail.com  |  +1 (253) 421 7650',32,113,8.8,'Body','#FFFFFF')
c.linkURL('mailto:kriitya@gmail.com',(32,H-125,112,H-112),relative=0)
# Encode a print-resolution copy for the PDF; preserve the original asset and aspect ratio.
photo=Image.open(OUT/'assets/adi-headshot.jpg').convert('RGB')
photo.thumbnail((900,1350),Image.Resampling.LANCZOS)
photo_bytes=BytesIO(); photo.save(photo_bytes,format='JPEG',quality=92)
photo_bytes.seek(0)
c.saveState()
portrait_mask=c.beginPath()
portrait_mask.circle(522,H-66,49)
c.clipPath(portrait_mask,stroke=0,fill=0)
photo_width=98
photo_height=photo_width*photo.height/photo.width
c.drawImage(ImageReader(photo_bytes),473,H-17-photo_height,photo_width,photo_height,mask='auto')
c.restoreState()
box(388,149,192,597,SIDE)

left=label('PRODUCT EXPERIENCE',32,152,331)
left=role('Self','AI Product Manager · Intern','Jun–Aug 2026',[
'Co-prototyped agent-native privacy and payments products with engineers.',
'Designed agent workflows, context management, evaluations, human checkpoints, and progress dashboards.',
'Connected journey mapping to clickstream reporting, developer event handoff, and MCP-generated dashboards.'
],left)
left=role('Zomato','Senior Product Analyst','Oct 2024–Jul 2025',[
'Shaped Homepage and Search through clickstream analytics; led Friends’ Recommendations using a social graph of <b>one billion contacts</b>.',
'Supported Food Rescue, helping reduce food waste by approximately <b>50%</b> across India.'
],left)
left=role('Udaan','Product Analyst','Feb 2023–Sep 2024',[
'Built supply-chain reporting for <b>1,000+ stakeholders</b>; served as Wondermart’s sole analyst through national expansion.',
'Optimized listing and pricing; implemented clickstream analytics and helped create Percept Insights.'
],left)
left=role('Snapdeal','Data Analyst','Jun 2020–Sep 2022',[
'Automated forecasting and purchasing; supported ad experiments that increased seller ad revenue by <b>14%</b>.'
],left)
left=label('SELECTED DESIGN PROJECTS',32,left+2,331)
for title,body,url in [
('FamilySync · JPMorgan Chase','Designed agentic caregiver payments; mapped handoffs and tested delegated approvals through caregiving scenarios.','https://adidesign.org/work/familysync-jpmorgan'),
('Squad Up · McDonald’s','Designed group ordering from 4 site observations, 8 interviews, and 22 survey responses, through journey maps and prototypes.','https://adidesign.org/work/mcdonalds-interaction-design'),
('Product innovation · P&amp;G','On a five-person team, translated 8 in-home visits and 2 central-site rounds into requirements, then tested 10 form studies.',None)]:
    y=left
    left=para(title,32,left,331,10.1,13,font='Bold')+3
    left=para(body,32,left,331,9.3,12.3)+10
    if url: c.linkURL(url,(32,H-left,363,H-y),relative=0)

x=402; sw=162; right=label('BUILDING & LEADING',x,162,sw)
for title,sub,body in [
('Camp Lead','Camp EDI · 2026','Developed workshops in electronics, fabrication, and physical prototyping.'),
('School Ambassador','Bambu Lab · Northwestern','Supported campus printer labs and student training in 3D printing and prototyping.'),
('TinkerVerse','@tinker_verse · 2024–Present','Build IoT and 3D-printed prototypes: a voice assistant, drawing plotter, and lighting sculptures.')]:
    right=para(title,x,right,sw,10.5,13,font='Bold')+2
    right=para(sub,x,right,sw,8.2,10.6,MUTED)+4
    right=para(body,x,right,sw,9.1,12)+8
right=label('EDUCATION',x,right+1,sw)
for title,body in [('Northwestern University','MS Engineering Design Innovation<br/>2025–Present'),('BITS Pilani','MSc Biological Science<br/>BE Civil Engineering · 2016–2021')]:
    right=para(title,x,right,sw,9.4,12,font='Bold')+2
    right=para(body,x,right,sw,8.9,11.7)+9
right=label('TOOLKIT',x,right+1,sw)
right=para('<b>AI & data:</b> Claude Code, Codex,<br/>RAG, MCP, Python, SQL<br/><b>Design & making:</b> User research,<br/>journey mapping, CAD, 3D printing,<br/>Arduino, IoT, C/C++',x,right,sw,8.9,11.8)+13
right=label('RECOGNITION',x,right,sw)
right=para('<b>ASEAN Top 10</b> · Edge AI & IoT<br/>Circuit Digest / DigiKey · 2024<br/><b>TEDx BITS Hyderabad</b><br/>Stage Design Head · 2019',x,right,sw,8.5,11.4)+12
print('COLUMN BOTTOMS',left,right)
# Compact portfolio handoff, separated from the resume text.
box(32,759,548,1,'#C8D2C8')
text('adidesign.org',32,769,9,'Bold',GREEN)
text('linkedin.com/in/adiind',170,769,8.5,'Body',MUTED)
c.linkURL('https://adidesign.org',(32,10,142,26),relative=0)
c.linkURL('https://linkedin.com/in/adiind',(170,10,285,26),relative=0)
# QR placed in the side column only when it clears all text.
if right-12+44 <= 746:
    q=QrCodeWidget('https://adidesign.org'); b=q.getBounds(); d=Drawing(40,40,transform=[40/(b[2]-b[0]),0,0,40/(b[3]-b[1]),0,0]);d.add(q)
    renderPDF.draw(d,c,400,H-745)
    text('Explore my work',447,711,8.2,'Bold',GREEN)
    text('adidesign.org',447,726,8,'Body',MUTED)
else:
    raise ValueError(f'No space for portfolio QR: {right}')
c.showPage();c.save()
print(OUT/'Aditya_Agarwal_Visual_Resume_2026.pdf')
