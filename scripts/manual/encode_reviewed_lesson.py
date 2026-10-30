"""Encode the reviewed saved lesson and licensed photographs; no course/quiz authoring."""
import hashlib, json, math, re, subprocess, textwrap, urllib.request, sys, time, os, base64
from pathlib import Path

ROOT=Path(os.environ['MANUAL_RENDER_ROOT'])
PLAN=json.loads(Path(sys.argv[1]).read_text())
OUT=ROOT/PLAN['outputDirectory'];OUT.mkdir(exist_ok=True)
def run(args):
    return subprocess.check_output(args,stderr=subprocess.PIPE).decode().strip()
def duration(path):
    return float(run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(path)]))
def photo(term):
    return next(i for i in PLAN['images'] if term.lower() in i['title'].lower())

for image in PLAN['images']:
    p=ROOT/(image['id']+'.jpg')
    if not p.exists():
        req=urllib.request.Request(image['url'],headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req,timeout=30) as response: data=response.read()
        if hashlib.sha256(data).hexdigest()!=image['sha256']:raise RuntimeError('SAVED_PHOTO_HASH_CHANGED:'+image['id'])
        p.write_bytes(data)
    if hashlib.sha256(p.read_bytes()).hexdigest()!=image['sha256']:raise RuntimeError('LOCAL_PHOTO_HASH_CHANGED')

groups=PLAN['photoGroups']
assert len(groups)==len(PLAN['sections'])
speech_dir=OUT/'speech';speech_dir.mkdir(exist_ok=True)
captions=[];audio=[];visuals=[];cursor=0.0
for n,section in enumerate(PLAN['sections']):
    text=section['heading']+'. '+section['body']
    sentences=re.split(r'(?<=[.!?])\s+',text)
    chunks=[]
    for sentence in sentences:
        words=sentence.split();chunk=[]
        for word in words:
            if len(' '.join(chunk+[word]))>130 and chunk:chunks.append(' '.join(chunk));chunk=[]
            chunk.append(word)
        if chunk:chunks.append(' '.join(chunk))
    start=cursor
    for j,chunk in enumerate(chunks):
        digest=hashlib.sha256(chunk.encode()).hexdigest();path=speech_dir/(digest+'.mp3')
        if not path.exists(): raise RuntimeError('MANUAL_PREPARED_NARRATION_MISSING')
        seconds=duration(path)
        if not 0.3<seconds<120:raise RuntimeError('NARRATION_DURATION_INVALID')
        audio.append(path);captions.append({'start':cursor,'end':cursor+seconds,'text':chunk});cursor+=seconds
        (OUT/'captions-checkpoint.json').write_text(json.dumps(captions))
        # Do not print private instruction or signed source URLs.
    section_seconds=cursor-start
    for term in groups[n]:
        item=photo(term);visuals.append({'image':item,'duration':section_seconds/len(groups[n]),'title':section['heading']})

assert cursor>120
(OUT/'audio.ffconcat').write_text(''.join("file '"+str(p)+"'\n" for p in audio))
subprocess.run(['ffmpeg','-v','error','-threads','2','-y','-f','concat','-safe','0','-i',str(OUT/'audio.ffconcat'),'-c','copy',str(OUT/'narration.mp3')],check=True)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';clips=[]
for n,visual in enumerate(visuals):
    p=ROOT/(visual['image']['id']+'.jpg');title=OUT/(str(n)+'.title.txt');title.write_text('\n'.join(textwrap.wrap(visual['title'],62)))
    clip=OUT/('shot-'+str(n)+'.mp4');frames=math.ceil(visual['duration']*24)
    if not clip.exists():
        filt=("scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x18181b,"
              "zoompan=z='min(1.035,1+on*0.00004)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d="+str(frames)+":s=1280x720:fps=24,"
              "drawbox=x=0:y=0:w=iw:h=100:color=black@0.65:t=fill,"
              "drawbox=x=40:y=94:w=1200:h=3:color=0xd4b887:t=fill,"
              "drawtext=fontfile="+font+":textfile="+str(title)+":fontsize=27:fontcolor=white:x=40:y=25:line_spacing=6,"
              "fade=t=in:st=0:d=0.75,format=yuv420p")
        subprocess.run(['ffmpeg','-v','error','-threads','2','-y','-loop','1','-i',str(p),'-vf',filt,'-frames:v',str(frames),'-an','-c:v','libx264','-preset','veryfast','-threads','2','-crf','24',str(clip)],check=True)
    clips.append(clip);pass
(OUT/'video.ffconcat').write_text(''.join("file '"+str(p)+"'\n" for p in clips))
def stamp(s):
    hours=int(s//3600);minutes=int(s%3600//60);seconds=s%60
    return f'{hours:02}:{minutes:02}:{seconds:06.3f}'
vtt='WEBVTT\n\n'+'\n\n'.join(stamp(c['start'])+' --> '+stamp(c['end'])+'\n'+'\n'.join(textwrap.wrap(c['text'],58)) for c in captions)+'\n'
(OUT/'captions.vtt').write_text(vtt)
(OUT/'transcript.txt').write_text('\n\n'.join(s['heading']+'. '+s['body'] for s in PLAN['sections']))
srt='\n\n'.join(str(n+1)+'\n'+stamp(c['start']).replace('.',',')+' --> '+stamp(c['end']).replace('.',',')+'\n'+'\n'.join(textwrap.wrap(c['text'],58)) for n,c in enumerate(captions))+'\n'
(OUT/'captions.srt').write_text(srt)
film=OUT/'completed-lesson-manual.mp4'
subprocess.run(['ffmpeg','-v','error','-threads','2','-y','-f','concat','-safe','0','-i',str(OUT/'video.ffconcat'),'-i',str(OUT/'narration.mp3'),
 '-vf',"subtitles="+str(OUT/'captions.srt')+":force_style='FontName=DejaVu Sans,FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H0018181B,BorderStyle=3,Outline=2,MarginV=22'",
 '-af','loudnorm=I=-16:TP=-2:LRA=11','-c:v','libx264','-preset','veryfast','-threads','2','-crf','24','-c:a','aac','-b:a','128k','-ar','48000','-shortest','-movflags','+faststart',str(film)],check=True)
manifest={'courseId':PLAN['courseId'],'lessonId':PLAN['lessonId'],'source':'Reviewed existing canonical reading-guide sections',
 'durationSeconds':duration(film),'narrationSeconds':cursor,'sha256':hashlib.sha256(film.read_bytes()).hexdigest(),
 'bytes':film.stat().st_size,'captionCues':captions,'visualShots':[{**v,'image':{k:v['image'][k] for k in ['id','sha256','entitlementId','title']}} for v in visuals],
 'reviewRequired':True,'published':False,'captionTimingMethod':'Measured duration of each separately recorded TTS input; no ASR or word alignment claimed'}
(OUT/'render-manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({'state':'encoded-review-required','file':str(film),'seconds':manifest['durationSeconds'],'bytes':manifest['bytes'],'shots':len(visuals)}),flush=True)
