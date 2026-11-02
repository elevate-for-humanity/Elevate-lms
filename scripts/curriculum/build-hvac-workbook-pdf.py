"""Build the protected workbook master from the same published online content."""
import argparse,json,os
from html import escape
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,KeepTogether,Flowable,Image
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

parser=argparse.ArgumentParser();parser.add_argument('--content',required=True);parser.add_argument('--bank',required=True);parser.add_argument('--output',required=True);parser.add_argument('--image-root',default='public');args=parser.parse_args()
data=json.load(open(args.content));bank=json.load(open(args.bank))
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
if os.path.exists(font):
 pdfmetrics.registerFont(TTFont('Workbook',font));pdfmetrics.registerFont(TTFont('WorkbookBold',bold));regular='Workbook';strong='WorkbookBold'
else:regular='Helvetica';strong='Helvetica-Bold'
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyW',fontName=regular,fontSize=10.5,leading=16,spaceAfter=10,textColor=colors.HexColor('#292524')))
styles.add(ParagraphStyle(name='TitleW',fontName=strong,fontSize=27,leading=35,spaceAfter=20,textColor=colors.HexColor('#292524')))
styles.add(ParagraphStyle(name='HeadW',fontName=strong,fontSize=15,leading=21,spaceBefore=12,spaceAfter=9,keepWithNext=True))
styles.add(ParagraphStyle(name='SmallW',fontName=regular,fontSize=8,leading=12,spaceAfter=8))
class Diagram(Flowable):
 def __init__(self,labels):Flowable.__init__(self);self.labels=labels;self.width=480;self.height=175
 def draw(self):
  c=self.canv
  for i,label in enumerate(self.labels):
   x=(i%2)*245;y=95-(i//2)*85;c.setFillColor(colors.HexColor(['#fef3c7','#e0f2fe','#dcfce7','#f3e8ff'][i]));c.setStrokeColor(colors.HexColor('#78716c'));c.roundRect(x,y,230,70,9,stroke=1,fill=1)
   p=Paragraph(f'<b>{i+1}. {escape(label)}</b>',styles['BodyW']);w,h=p.wrap(205,65);p.drawOn(c,x+12,y+35-h/2)
def body(t):return Paragraph(escape(t),styles['BodyW'])
def heading(t):return Paragraph(escape(t),styles['HeadW'])
story=[Spacer(1,65),Paragraph('ELEVATE FOR HUMANITY',styles['HeadW']),Paragraph('HVAC &amp; EPA 608<br/>Illustrated Practice Workbook',styles['TitleW']),Diagram(['Understand the system','Work the example','Complete activities','Pass section practice']),Spacer(1,30),body('17 chapters • 51 guided activities • Four section practice tests'),body('Online companion: PARIS narration, animated refrigeration, virtual electrical, recovery-decision and airflow exercises.'),body('Workbook completion and internal practice passes are required for the assigned course. Actual supervised skills and external EPA certification remain separate.'),body('Version '+data['version']),PageBreak(),heading('How to use this workbook'),body('Read the teaching and inspect each diagram. Work through the example, then complete the three assigned activities in your own words. In the online workbook, save notes, every practice response, and a next goal; review your work and save the checklist. Each saved field needs at least ten meaningful characters. Paper responses must be entered into your account or reviewed through the approved staff process; a paper page does not automatically update the LMS.'),body('Practice tests use original Elevate questions and an internal training threshold of 80 percent in each section. They are not official EPA examination questions, and passing them does not issue an EPA credential. Use provider instructions for the exam version you are scheduled to take.'),body('Diagrams illustrate concepts and decision paths. They do not supply equipment-specific connections or authorize unsupervised electrical, refrigerant, combustion, or medical procedures.'),heading('Contents')]
for ch in data['chapters']:story.append(body(f'{ch["number"]}. {ch["title"]}'))
for ch in data['chapters']:
 story.extend([PageBreak(),Paragraph(f'Chapter {ch["number"]}<br/>{escape(ch["title"])}',styles['TitleW']),Diagram(ch['diagram']),Paragraph('Concept map - not an equipment connection instruction.',styles['SmallW'])])
 image_path=os.path.join(args.image_root,(ch.get('image') or '').lstrip('/'))
 if ch.get('image') and os.path.isfile(image_path):
  picture=Image(image_path);ratio=min(480/picture.imageWidth,220/picture.imageHeight);picture.drawWidth=picture.imageWidth*ratio;picture.drawHeight=picture.imageHeight*ratio
  story.extend([picture,Spacer(1,8),Paragraph('Workplace context: '+escape(ch.get('imageAlt') or ch['title'])+'. This picture does not verify student performance.',styles['SmallW'])])
 for lesson in ch['lessons']:story.extend([heading(lesson['heading']),body(lesson['text'])])
 story.extend([heading(ch['heading']),body(ch['text']),heading('Worked example'),body(ch['example']),heading('Check your reasoning'),body(ch['review']),heading('Guided activities')])
 for i,prompt in enumerate(ch['prompts']):
  story.extend([heading(f'Activity {i+1}'),body(prompt),body('Show your reasoning, units, assumptions, and any question for the instructor.'),Spacer(1,24)])
 story.extend([heading('My next goal and instructor questions'),Spacer(1,35),body('Online: save your responses and reviewed checklist. Practical performance and hours require their own verified evidence.')])
story.extend([PageBreak(),Paragraph('Section practice tests',styles['TitleW']),body('Choose one response per question. Complete each section independently before reviewing the explanations. The online server records your own scored attempts. Passing requirement: 20 of 25 correct (80 percent) in every section.')])
for section in bank:
 story.extend([PageBreak(),Paragraph(escape(section['section'])+' practice',styles['TitleW'])])
 for i,q in enumerate(section['questions']):
  block=[body(f'{i+1}. {q["question"]}')]+[body(f'{chr(65+j)}. {choice}') for j,choice in enumerate(q['options'])]
  story.extend([KeepTogether(block),Spacer(1,7)])
story.extend([PageBreak(),Paragraph('Practice explanations',styles['TitleW']),body('Review after attempting the questions. Record the topic you missed, the corrected reasoning, and a new example. This key is for learning; the external certifying organization has its own secure exam.')])
for section in bank:
 story.append(heading(section['section']))
 for i,q in enumerate(section['questions']):story.append(body(f'{i+1}. {chr(65+q["correctAnswer"])} - {q["explanation"]}'))
story.extend([PageBreak(),Paragraph('Reference sources and completion record',styles['TitleW'])])
for source in data['sources']:story.extend([heading(source['title']),Paragraph(escape(source['url']),styles['SmallW'])])
story.extend([body('Source review date: November 2, 2026. Regulatory scopes and equipment requirements must be checked against current official rules. No claim of EPA approval of these preparatory materials is made.'),heading('Student completion checklist'),body('All 17 learning chapters reviewed; all 51 practice responses completed; notes and next goals saved; all four internal practice sections passed; unresolved questions reviewed with the instructor. Actual practical checkoffs and external credentials are verified separately.')])
def footer(c,doc):
 c.saveState();c.setStrokeColor(colors.HexColor('#d6d3d1'));c.line(54,42,558,42);c.setFont(regular,8);c.setFillColor(colors.HexColor('#57534e'));c.drawString(54,28,'Elevate for Humanity | Protected instructional master | '+data['version']);c.drawRightString(558,28,str(doc.page));c.restoreState()
os.makedirs(os.path.dirname(args.output) or '.',exist_ok=True)
SimpleDocTemplate(args.output,pagesize=(612,792),rightMargin=54,leftMargin=54,topMargin=48,bottomMargin=58,title='HVAC and EPA 608 Illustrated Practice Workbook',author='Elevate for Humanity').build(story,onFirstPage=footer,onLaterPages=footer)
print('Protected HVAC workbook PDF generated')
