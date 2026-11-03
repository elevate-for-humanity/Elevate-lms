"""Render the PARIS partner orientation from exact approved portal workflows.
No private partner/student data is included. Spotify publication is a separate delivery step.
"""
import json, urllib.request, subprocess, pathlib, textwrap
from PIL import Image,ImageDraw,ImageFont
ROOT=pathlib.Path(__file__).resolve().parents[2]
WORK=ROOT/'.partner-onboarding-render';WORK.mkdir(exist_ok=True)
for directory in ['public/videos','public/audio','public/captions']: (ROOT/directory).mkdir(parents=True,exist_ok=True)
chapters=[
('Your business. Our shared standard.', ['Professional appearance','Prepared instruction','Respectful student service'], "Welcome to Elevate for Humanity. I'm PARIS, your onboarding guide. Elevate expects premium education and professional service. Present yourself and your business professionally. Keep training spaces clean, safe and ready. Under your independent contractor agreement, you operate your own business and deliver your assigned program services. Elevate provides the curriculum, platform, sponsor coordination, referrals and funding coordination stated in your agreement. Funding and student numbers are not guaranteed. Your signed agreement and applicable law control your responsibilities."),
('Read your own agreement', ['Open assigned MOU','Review scope and payment terms','Sign your own documents'], "Start with your own MOU in the dashboard. Check the organization, assigned programs, duties and payment terms. Read the full agreement and any individual addendum. Never use someone else's rates. If a field or original document is missing, ask Elevate to correct it. Each person signs their own agreement. Viewing a page or watching this video does not sign a contract. Existing signatures remain on record; a new addendum needs its own review."),
('Handbook, privacy and conduct', ['Read the full handbook','Protect student information','Ask before you accept unclear terms'], "Read the handbook, confidentiality obligations, and the full non-compete and non-solicitation terms linked in Forms. These describe how to protect student information and Elevate relationships. Ask questions before accepting anything you do not understand. Communicate respectfully, meet deadlines, and record actual attendance, progress and skills. Do not invent hours or promise funding, credentials, jobs or payments. Site coordinators can download team handouts, but each worker's own applicable agreement still controls their role."),
('Complete your W-9', ['Name and tax classification','Address and nine-digit TIN','Review, sign and save'], "Open Complete and save my W-9. Enter the name shown on your tax return. For a sole proprietor or disregarded LLC, line one generally identifies the owner; the business name belongs on line two. Select the federal tax classification from your tax records. Follow the official IRS instructions if unsure. Enter your mailing address and the matching nine-digit taxpayer number. This is not a bank account number. Read the certification, indicate backup withholding if applicable, then type your signature as the final entry. Save the protected PDF and check your dashboard document register. Format checks do not confirm an IRS name and number match."),
('Prepare the correct invoice', ['Choose assigned student','Review stage and suggested amount','Edit, certify and submit'], "Open Payouts and select Fill out an invoice. Choose a student from your assigned dashboard roster. The form fills the student information, recorded training dates and the available agreed installment amount. Select training start or completion and review the source. An individual student schedule takes priority. Prior payments and holds may require review before another amount is suggested. You can edit the request, dates and description. Add your unique invoice reference and certify the facts. Submit for Elevate review. An invoice does not change your MOU and does not release a payment."),
('Set up your banking securely', ['Request your Intuit invitation','Enter bank details with Intuit','Check verification status'], "Use the secure banking guide in Payouts. Request your personal QuickBooks contractor invitation if needed. Check your legal and tax information, then enter the account type, routing number and bank account number on the verified Intuit setup page. Use your bank's direct deposit instructions. A debit card number is not a bank account number. Never send bank or taxpayer numbers in Office Mail. Complete the provider's verification and return to your dashboard to check status. PayPal is a separate available method where your agreement allows it. A saved destination is not proof of payment."),
('Review, ask questions, sign off', ['Complete required forms','Check saved records','Confirm understanding after playback'], "Your Forms library contains the handbook, full agreements, W-9 flow, invoice form and team templates. Fill Elevate-created forms in the dashboard. Existing identity documents, licenses and insurance still need original evidence from the issuer. Complete your program plan and required acknowledgements. Use Office Mail for help with a specific missing item. After this video ends, review any questions and sign the watched-and-understood acknowledgement. It records your statement and playback progress, not a guarantee of understanding. Your MOU and other agreements still require their own signatures. Thank you for bringing excellence to your program."),
]
font=lambda n:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',n)
segments=[]; offset=0; cues=[]
for i,(title,bullets,script) in enumerate(chapters):
 mp3=WORK/f'{i}.mp3'
 if not mp3.exists():
  request=urllib.request.Request('https://app.elevateforhumanity.org/api/voice/natural',data=json.dumps({'text':script,'voice':'warm','style':'instructor'}).encode(),headers={'Content-Type':'application/json'})
  with urllib.request.urlopen(request,timeout=60) as response:
   if 'audio' not in response.headers.get('Content-Type',''):raise RuntimeError('Audio was not returned')
   mp3.write_bytes(response.read())
 duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(mp3)]))
 im=Image.new('RGB',(1280,720),'#f4f8ff');d=ImageDraw.Draw(im)
 d.rounded_rectangle((45,35,1235,685),radius=30,fill='white',outline='#c5d8ef',width=3)
 d.text((85,65),'ELEVATE FOR HUMANITY  /  PARIS',font=font(23),fill='#21509b')
 for j,line in enumerate(textwrap.wrap(title,36)):d.text((85,130+j*59),line,font=font(43),fill='#112c53')
 for j,bullet in enumerate(bullets):
  y=295+j*94;d.rounded_rectangle((85,y,940,y+72),radius=16,fill='#edf4ff')
  d.ellipse((105,y+15,149,y+59),fill='#2459ac');d.text((120,y+18),str(j+1),font=font(24),fill='white')
  d.text((175,y+21),bullet,font=font(29),fill='#183959')
 # Simple chapter illustrations accompany the short action cards.
 ink='#2459ac'; x=1065; y=425
 if i in [0,5]:
  d.polygon([(x-85,y-55),(x,y-110),(x+85,y-55)],outline=ink,width=7)
  d.line([(x-85,y-48),(x+85,y-48)],fill=ink,width=7)
  for dx in [-60,0,60]:d.rounded_rectangle((x+dx-9,y-30,x+dx+9,y+70),radius=4,fill=ink)
  d.line([(x-90,y+85),(x+90,y+85)],fill=ink,width=9)
 elif i==2:
  d.rounded_rectangle((x-85,y-90,x-3,y+65),radius=9,outline=ink,width=7)
  d.rounded_rectangle((x+3,y-90,x+85,y+65),radius=9,outline=ink,width=7)
  for dy in [-55,-25,5]:
   d.line([(x-65,y+dy),(x-20,y+dy)],fill=ink,width=5)
   d.line([(x+20,y+dy),(x+65,y+dy)],fill=ink,width=5)
 elif i==6:
  d.ellipse((x-85,y-85,x+85,y+85),outline=ink,width=8)
  d.line([(x-45,y),(x-10,y+35),(x+50,y-40)],fill=ink,width=11)
 else:
  d.rounded_rectangle((x-70,y-105,x+70,y+95),radius=12,outline=ink,width=7)
  for dy in [-65,-30,5]:d.line([(x-43,y+dy),(x+43,y+dy)],fill=ink,width=6)
  d.line([(x-42,y+60),(x-15,y+75),(x+43,y+35)],fill=ink,width=7)
 d.rounded_rectangle((85,630,1190,642),radius=6,fill='#dbe7f7');d.rounded_rectangle((85,630,85+int(1105*(i+1)/len(chapters)),642),radius=6,fill='#3067ba')
 d.text((85,655),f'Chapter {i+1} of {len(chapters)}  |  Review your own agreement and dashboard',font=font(17),fill='#536984')
 image=WORK/f'{i}.png';im.save(image)
 segment=WORK/f'{i}.mp4'
 if not segment.exists(): subprocess.run(['ffmpeg','-y','-loglevel','error','-loop','1','-i',str(image),'-i',str(mp3),'-t',str(duration),'-vf','scale=1280:720,format=yuv420p','-r','15','-c:v','libx264','-preset','fast','-tune','stillimage','-crf','28','-c:a','aac','-b:a','96k','-shortest',str(segment)],check=True)
 segments.append(segment)
 words=script.split();groups=[' '.join(words[n:n+12]) for n in range(0,len(words),12)]
 for j,text in enumerate(groups):cues.append((offset+duration*j/len(groups),offset+duration*(j+1)/len(groups),text))
 offset+=duration
 print(f'Chapter {i+1}: {duration:.1f}s',flush=True)
concat=WORK/'concat.txt';concat.write_text('\n'.join(f"file '{p}'" for p in segments))
out=ROOT/'public/videos/partner-onboarding-20261103.mp4'
out.parent.mkdir(parents=True,exist_ok=True)
(ROOT/'public/audio').mkdir(parents=True,exist_ok=True)
subprocess.run(['ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i',str(concat),'-c:v','copy','-c:a','aac','-b:a','96k','-af','aresample=async=1:first_pts=0','-movflags','+faststart',str(out)],check=True)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(out),'-vn','-c:a','libmp3lame','-b:a','96k',str(ROOT/'public/audio/partner-onboarding-20261103.mp3')],check=True)
def ts(n):
 h=int(n//3600);m=int(n%3600//60);s=n%60;return f'{h:02}:{m:02}:{s:06.3f}'
(ROOT/'public/captions/partner-onboarding-20261103.vtt').write_text('WEBVTT\n\n'+'\n\n'.join(f'{ts(a)} --> {ts(b)}\n{text}' for a,b,text in cues))
(ROOT/'lib/program-holder/onboarding-media.json').write_text(json.dumps({'version':'partner-onboarding-20261103','durationSeconds':offset,'video':'/videos/partner-onboarding-20261103.mp4','audio':'/audio/partner-onboarding-20261103.mp3','captions':'/captions/partner-onboarding-20261103.vtt','chapters':[{'title':t,'points':b,'script':s} for t,b,s in chapters]},indent=2))
print('Complete',offset,out.stat().st_size,flush=True)
