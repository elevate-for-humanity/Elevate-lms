"""Explicit encoder of owner-reviewed saved instruction/photos. No authoring or publication."""
import base64, hashlib, json, os, re, subprocess, sys, tempfile, urllib.request, urllib.error, uuid
from pathlib import Path
from datetime import datetime,timezone

PROJECT='https://cuxzzpsyufcewtmicszk.supabase.co'
COURSES={'e9a2547c-ae03-418e-97fc-51377d438f8c','580f7eeb-aa36-4b2a-8526-bbfa6899bb14','d48c61c4-8880-4d9d-9ab5-fab4dd51b201'}
BUCKET='elevate-course-media'

def digest(data): return hashlib.sha256(data).hexdigest()

def course_scope(row):
    if row.get('course_id') not in COURSES:raise RuntimeError('MANUAL_COURSE_SCOPE_INVALID')
    return row['course_id']

def request(url, data=None, headers=None, method=None):
    req=urllib.request.Request(url,data=None if data is None else json.dumps(data).encode(),headers=headers or {},method=method)
    try:
        with urllib.request.urlopen(req,timeout=90) as response: return json.load(response)
    except urllib.error.HTTPError as error:
        try: failure=json.load(error)
        except (ValueError,TypeError): failure={}
        reason=next((d.get('reason') for d in failure.get('error',{}).get('details',[]) if isinstance(d,dict) and isinstance(d.get('reason'),str)),failure.get('error',{}).get('status','UNKNOWN'))
        safe=reason if isinstance(reason,str) and re.fullmatch('[A-Z_]{1,80}',reason) else 'UNKNOWN'
        raise RuntimeError('MANUAL_REMOTE_HTTP_'+str(error.code)+'_'+safe) from None

def canonical_source(row):
    sections=row['content_json']['experience']['readingGuide']['sections']
    draft=row['content_json']['manualMediaDraft']
    text='\n\n'.join(s['heading']+'. '+s['body'] for s in sections)
    if draft.get('mode')!='manually-reviewed-source-and-photo-selections' or draft.get('noAutomaticPublication') is not True or draft.get('reviewRequiredAfterEncoding') is not True:
        raise RuntimeError('MANUAL_SOURCE_REVIEW_REQUIRED')
    if draft['sourceTranscriptSha256']!=digest(text.encode()): raise RuntimeError('MANUAL_SOURCE_CHANGED')
    groups=draft['photoGroups']
    if len(groups)!=len(sections) or not all(len(g)==2 for g in groups): raise RuntimeError('MANUAL_PHOTO_PLAN_INVALID')
    return sections,groups,text

def main():
    import boto3
    from botocore.exceptions import ClientError
    lesson=str(uuid.UUID(os.environ['LESSON_ID']))
    service=os.environ['SUPABASE_SERVICE_ROLE_KEY']
    headers={'apikey':service,'Authorization':'Bearer '+service,'Content-Type':'application/json','Prefer':'resolution=ignore-duplicates,return=representation'}
    def db(path,data=None,method=None): return request(PROJECT+'/rest/v1/'+path,data,headers,method)
    rows=db('course_lessons?select=id,course_id,title,content_json&id=eq.'+lesson)
    if len(rows)!=1: raise RuntimeError('MANUAL_LESSON_NOT_FOUND')
    row=rows[0];COURSE=course_scope(row);sections,groups,text=canonical_source(row)
    photos=db('course_visual_assets?select=id,asset_url,alt_text,metadata&course_id=eq.'+COURSE+'&metadata->>manualCatalogue=eq.true')
    lookup={p['id']:p for p in photos}; images=[]
    for photo_id in sorted({i for g in groups for i in g}):
        p=lookup[photo_id]; m=p['metadata']; url=p['asset_url']
        if m.get('license_observed') is not True or not m.get('entitlement_id') or not m.get('manualReviewedDerivative',{}).get('sha256'):
            raise RuntimeError('MANUAL_PHOTO_REVIEW_REQUIRED')
        if url.startswith('data:image/jpeg;base64,'):
            if not m.get('sourceVideoId') or not m.get('sourceSha256') or not m.get('frameStoragePath','').startswith('course-videos/manual-source-frames/'+COURSE+'/'):
                raise RuntimeError('MANUAL_PHOTO_PROVENANCE_INVALID')
            actual=base64.b64decode(url.split(',',1)[1],validate=True)
            if len(actual)>2*1024*1024 or digest(actual)!=m['manualReviewedDerivative']['sha256']:raise RuntimeError('MANUAL_PHOTO_HASH_MISMATCH')
        elif not url.startswith('https://elements-resized.envatousercontent.com/'):
            raise RuntimeError('MANUAL_PHOTO_ORIGIN_INVALID')
        images.append({'id':p['id'],'title':p['id'],'sourceTitle':p['alt_text'],'url':url,'sha256':m['manualReviewedDerivative']['sha256'],'entitlementId':m['entitlement_id']})
    # Read only the existing authorized runtime key family; never print credentials.
    def secret(key):
        value=db('rpc/get_platform_secret',{'p_key':key})
        if not isinstance(value,str) or not value.strip(): raise RuntimeError('MANUAL_CREDENTIAL_UNAVAILABLE')
        return value.strip()
    access=secret('ELEVATE_MEDIA_ACCESS_KEY_ID'); private=secret('ELEVATE_MEDIA_SECRET_ACCESS_KEY')
    s3=boto3.client('s3',endpoint_url='https://s3.us-east-005.backblazeb2.com',region_name='us-east-005',aws_access_key_id=access,aws_secret_access_key=private)
    source_hash=digest(text.encode())
    plan_hash=digest(json.dumps({'source':source_hash,'photos':images,'groups':groups,'voice':'en-US-Neural2-F','renderer':'manual-ffmpeg-v1'},sort_keys=True).encode())
    prefix=f'course-videos/manual-lessons/{COURSE}/{lesson}/reviewed-{plan_hash}'
    manifest_key=prefix+'/render-manifest.json'; film_key=prefix+'/completed-lesson-manual.mp4'
    def get(key):
        try: return s3.get_object(Bucket=BUCKET,Key=key)['Body'].read()
        except ClientError as error:
            if error.response['Error']['Code'] in ('NoSuchKey','404'): return None
            raise RuntimeError('MANUAL_PRIVATE_READ_FAILED') from None
    def put(key,data,mime):
        s3.put_object(Bucket=BUCKET,Key=key,Body=data,ContentType=mime,CacheControl='private, max-age=0')
    if os.environ.get('MANUAL_VERIFY_UPLOADED')=='true':
        from urllib.parse import quote
        candidates=db('course_videos?select=id,storage_path&lesson_id=eq.'+lesson+'&course_id=eq.'+COURSE+'&generated_by=eq.manual&status=eq.ready&storage_path=like.course-videos/manual-lessons/*&order=created_at.desc')
        audits=db('admin_audit_events?select=metadata&metadata->>mode=eq.completed-lesson-review&metadata->>lesson_id=eq.'+lesson+'&order=created_at.desc&limit=20')
        for candidate in candidates:
            matches=[a['metadata'] for a in audits if a['metadata'].get('storage_path')==candidate['storage_path']]
            if not matches: continue
            audit=matches[0];data=get(candidate['storage_path'])
            if not data or len(data)!=audit['bytes'] or digest(data)!=audit['sha256']: raise RuntimeError('MANUAL_UPLOADED_STORED_BYTES_MISMATCH')
            with tempfile.TemporaryDirectory(prefix='manual-verify-') as directory:
                film=Path(directory)/'film.mp4';film.write_bytes(data)
                probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(film)]))
                subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(film),'-f','null','-'],check=True)
            evidence={'candidateVideoId':candidate['id'],'mediaSha256':digest(data),'bytes':len(data),'durationSeconds':float(probe['format']['duration']),'storedBytesHashMatchesUploadInput':True,'fullDecode':True,'method':'Actual authenticated Backblaze readback, SHA-256 comparison with the authenticated upload audit and full-file ffmpeg decode','nativeLmsReview':'pending'}
            latest=db('course_lessons?select=content_json,updated_at&id=eq.'+lesson+'&course_id=eq.'+COURSE)[0];canonical_source(latest)
            content=latest['content_json'];content['manualMediaDraft']['storedFileVerification']=evidence
            changed=db('course_lessons?id=eq.'+lesson+'&course_id=eq.'+COURSE+'&updated_at=eq.'+quote(latest['updated_at'],safe=''),{'content_json':content,'updated_at':datetime.now(timezone.utc).isoformat()},'PATCH')
            if len(changed)!=1: raise RuntimeError('MANUAL_SOURCE_CHANGED_DURING_VERIFY_SAVE')
            print(json.dumps({'lessonId':lesson,'state':'stored-upload-verified',**evidence}));return
        raise RuntimeError('MANUAL_UPLOADED_CANDIDATE_NOT_FOUND')
    def retain_review(manifest):
        from urllib.parse import quote
        sheet=get(prefix+'/film-review-sheet.jpg')
        if not sheet or len(sheet)>2*1024*1024: raise RuntimeError('MANUAL_REVIEW_SHEET_INVALID')
        # Private admin thumbnail; actual saved review frames remain available
        # without an expiring bearer URL or a public repository artifact.
        db('course_videos?id=eq.'+manifest['candidateVideoId'],{'thumbnail_url':'data:image/jpeg;base64,'+base64.b64encode(sheet).decode()},'PATCH')
        latest=db('course_lessons?select=content_json,updated_at&id=eq.'+lesson+'&course_id=eq.'+COURSE)[0]
        canonical_source(latest)
        if latest['content_json']['manualMediaDraft']['sourceTranscriptSha256']!=source_hash: raise RuntimeError('MANUAL_SOURCE_CHANGED_DURING_REVIEW')
        content=latest['content_json'];content['manualMediaDraft']['encodedReview']=manifest
        changed=db('course_lessons?id=eq.'+lesson+'&course_id=eq.'+COURSE+'&updated_at=eq.'+quote(latest['updated_at'],safe=''),{'content_json':content,'updated_at':datetime.now(timezone.utc).isoformat()},'PATCH')
        if len(changed)!=1: raise RuntimeError('MANUAL_SOURCE_CHANGED_DURING_REVIEW_SAVE')
    old=get(manifest_key)
    if old:
        manifest=json.loads(old)
        if manifest.get('sourceTranscriptSha256')!=source_hash or manifest.get('reviewRequired') is not True: raise RuntimeError('MANUAL_CANDIDATE_CONFLICT')
        retain_review(manifest)
        print(json.dumps({'lessonId':lesson,'state':'existing-review-candidate','manifestKey':manifest_key})); return
    if os.environ.get('MANUAL_REVIEW_ONLY')=='true':
        print(json.dumps({'lessonId':lesson,'state':'not-yet-encoded'}));return
    import google.auth
    from google.auth.transport.requests import Request as GoogleRequest
    speech_credentials,_=google.auth.default(scopes=['https://www.googleapis.com/auth/cloud-platform'])
    with tempfile.TemporaryDirectory(prefix='manual-lesson-') as directory:
        root=Path(directory); out=root/'film'; out.mkdir(); speech=out/'speech'; speech.mkdir()
        # Content-addressed private narration cache avoids repeated paid synthesis.
        chunks=[]
        for section in sections:
            for sentence in re.split(r'(?<=[.!?])\s+',section['heading']+'. '+section['body']):
                part=[]
                for word in sentence.split():
                    if len(' '.join(part+[word]))>130 and part: chunks.append(' '.join(part)); part=[]
                    part.append(word)
                if part: chunks.append(' '.join(part))
        for chunk in chunks:
            h=digest(chunk.encode()); cached=get('course-videos/manual-narration/en-US-Neural2-F/'+h+'.mp3')
            if not cached:
                speech_headers={'Content-Type':'application/json'}
                speech_credentials.before_request(GoogleRequest(),'POST','https://texttospeech.googleapis.com/v1/text:synthesize',speech_headers)
                result=request('https://texttospeech.googleapis.com/v1/text:synthesize',{'input':{'text':chunk},'voice':{'languageCode':'en-US','name':'en-US-Neural2-F'},'audioConfig':{'audioEncoding':'MP3'}},speech_headers)
                cached=base64.b64decode(result['audioContent'],validate=True)
                if len(cached)<1000: raise RuntimeError('MANUAL_NARRATION_EMPTY')
                put('course-videos/manual-narration/en-US-Neural2-F/'+h+'.mp3',cached,'audio/mpeg')
            (speech/(h+'.mp3')).write_bytes(cached)
        plan={'lessonId':lesson,'courseId':COURSE,'title':row['title'],'sections':sections,'images':images,'photoGroups':groups,'outputDirectory':'film'}
        path=root/'plan.json'; path.write_text(json.dumps(plan))
        env={**os.environ,'MANUAL_RENDER_ROOT':str(root)}
        subprocess.run([sys.executable,str(Path(__file__).with_name('encode_reviewed_lesson.py')),str(path)],check=True,env=env)
        film=out/'completed-lesson-manual.mp4'; manifest=json.loads((out/'render-manifest.json').read_text())
        if digest(film.read_bytes())!=manifest['sha256']: raise RuntimeError('MANUAL_FILM_HASH_MISMATCH')
        if ' '.join(c['text'] for c in manifest['captionCues']).split()!=text.split(): raise RuntimeError('MANUAL_CAPTION_COVERAGE_FAILED')
        subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(film),'-f','null','-'],check=True)
        check=subprocess.run(['ffmpeg','-v','info','-i',str(film),'-vf','blackdetect=d=0.4:pix_th=0.05','-af','silencedetect=n=-45dB:d=1','-f','null','-'],capture_output=True,text=True,check=True)
        if 'black_start:' in check.stderr or 'silence_start:' in check.stderr: raise RuntimeError('MANUAL_BLACK_OR_SILENCE_REVIEW_REQUIRED')
        # Recheck canonical instruction after encoding; no stale film promotion.
        latest=db('course_lessons?select=content_json&id=eq.'+lesson+'&course_id=eq.'+COURSE)[0]
        canonical_source(latest)
        if latest['content_json']['manualMediaDraft']['sourceTranscriptSha256']!=source_hash: raise RuntimeError('MANUAL_SOURCE_CHANGED_DURING_ENCODE')
        for audio in speech.glob('*.mp3'): put('course-videos/manual-narration/en-US-Neural2-F/'+audio.name,audio.read_bytes(),'audio/mpeg')
        put(film_key,film.read_bytes(),'video/mp4')
        if digest(get(film_key))!=manifest['sha256']: raise RuntimeError('MANUAL_STORED_BYTES_MISMATCH')
        manifest.update({'sourceTranscriptSha256':source_hash,'planSha256':plan_hash,'storagePath':film_key,'technicalChecks':{'fullDecode':True,'blackAtLeastPoint4Seconds':False,'silenceAtLeast1SecondAtMinus45dB':False,'storedBytesHashMatches':True},'visualReview':'pending','nativeLmsReview':'pending'})
        from PIL import Image,ImageDraw
        shots=manifest['visualShots']; sheet=Image.new('RGB',(960,290*((len(shots)+1)//2)),(24,24,27)); cursor=0
        for i,shot in enumerate(shots):
            frame=out/(str(i)+'.review.jpg')
            subprocess.run(['ffmpeg','-v','error','-y','-ss',str(min(cursor+shot['duration']/2,manifest['durationSeconds']-.1)),'-i',str(film),'-frames:v','1',str(frame)],check=True)
            image=Image.open(frame).convert('RGB');image.thumbnail((480,270));sheet.paste(image,((i%2)*480,(i//2)*290));ImageDraw.Draw(sheet).text(((i%2)*480+8,(i//2)*290+271),str(i+1)+' — '+shot['title'][:60],fill='white');cursor+=shot['duration']
        review=out/'film-review-sheet.jpg';sheet.save(review,quality=88);put(prefix+'/film-review-sheet.jpg',review.read_bytes(),'image/jpeg')
        for name,mime in [('captions.vtt','text/vtt'),('transcript.txt','text/plain')]: put(prefix+'/'+name,(out/name).read_bytes(),mime)
        # Candidate only; never change instruction, quizzes, publication, jobs or approvals.
        url=s3.generate_presigned_url('get_object',Params={'Bucket':BUCKET,'Key':film_key,'ResponseContentType':'video/mp4'},ExpiresIn=3600)
        video_id=str(uuid.uuid5(uuid.NAMESPACE_URL,film_key))
        thumbnail=s3.generate_presigned_url('get_object',Params={'Bucket':BUCKET,'Key':prefix+'/film-review-sheet.jpg'},ExpiresIn=3600)
        db('course_videos?on_conflict=id',{'id':video_id,'lesson_id':lesson,'course_id':COURSE,'title':row['title']+' — manually reviewed source; encoded film awaiting visual review','video_url':url,'thumbnail_url':thumbnail,'storage_path':film_key,'duration_seconds':round(manifest['durationSeconds']),'transcript':text,'generated_by':'manual','asset_role':'reference','status':'ready'})
        manifest['candidateVideoId']=video_id
        put(manifest_key,json.dumps(manifest).encode(),'application/json')
        retain_review(manifest)
        print(json.dumps({'lessonId':lesson,'candidateVideoId':video_id,'state':'encoded-review-required','sha256':manifest['sha256'],'durationSeconds':manifest['durationSeconds'],'manifestKey':manifest_key}))

if __name__=='__main__': main()
