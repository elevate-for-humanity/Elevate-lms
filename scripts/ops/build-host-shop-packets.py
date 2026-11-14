"""Render the existing syllabi and operating guide into printable Host Shop copies."""
from pathlib import Path
import re
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/docs/host-shop-packets'
OUT.mkdir(parents=True, exist_ok=True)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Copy', fontName='Helvetica', fontSize=10.5, leading=14, spaceAfter=7))
styles['Title'].fontSize=22
styles['Title'].leading=27
styles['Heading2'].spaceBefore=13
styles['Heading2'].leading=19
def inline(text):
    text=escape(text.strip())
    text=re.sub(r'\[([^\]]+)\]\((https?://[^\s)]+)\)',r'<link href="\2" color="#5b21b6">\1</link>',text)
    return re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',text)
def footer(c, doc):
    c.setStrokeColor(colors.HexColor('#dddde4'));c.line(45,40,567,40)
    c.setFillColor(colors.HexColor('#555566'));c.setFont('Helvetica',8)
    c.drawString(45,27,'Elevate for Humanity | Authorized Host Shop training copy')
    c.drawRightString(567,27,str(doc.page))
files=[('host-shop-operating-guide.md','Host-Shop-Operating-Guide.pdf'),('syllabi/barber-apprenticeship.md','Barber-Apprenticeship-Syllabus.pdf'),('syllabi/cosmetology-apprenticeship.md','Cosmetology-Apprenticeship-Syllabus.pdf'),('syllabi/nail-technician-apprenticeship.md','Nail-Technician-Apprenticeship-Syllabus.pdf'),('syllabi/professional-esthetician.md','Esthetician-Apprenticeship-Syllabus.pdf')]
for source,target in files:
    lines=(ROOT/'public/docs'/source).read_text().splitlines();story=[];i=0
    while i<len(lines):
        line=lines[i].strip();i+=1
        if not line:continue
        if line.startswith('|'):
            rows=[]
            while True:
                if not re.match(r'^\|[\s:|\-]+\|$',line):rows.append([Paragraph(inline(x),styles['Copy']) for x in line.strip('|').split('|')])
                if i>=len(lines) or not lines[i].strip().startswith('|'):break
                line=lines[i].strip();i+=1
            widths=[402,120] if len(rows[0])==2 else [522/len(rows[0])]*len(rows[0])
            table=Table(rows,colWidths=widths,repeatRows=1,hAlign=TA_LEFT)
            table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#eeeaf8')),('VALIGN',(0,0),(-1,-1),'TOP'),('BOX',(0,0),(-1,-1),.5,colors.HexColor('#dddde4')),('INNERGRID',(0,0),(-1,-1),.4,colors.HexColor('#dddde4')),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8)]));story.extend([table,Spacer(1,12)]);continue
        style=styles['Title'] if line.startswith('# ') else styles['Heading2'] if line.startswith('## ') else styles['Heading3'] if line.startswith('### ') else styles['Copy']
        text=re.sub(r'^#{1,3}\s+','',line)
        if text.startswith('- '):text='• '+text[2:]
        story.append(Paragraph(inline(text),style))
    SimpleDocTemplate(str(OUT/target),pagesize=(612,792),rightMargin=45,leftMargin=45,topMargin=45,bottomMargin=54,title=target.replace('-',' ').replace('.pdf',''),author='Elevate for Humanity').build(story,onFirstPage=footer,onLaterPages=footer)
    print(OUT/target)
