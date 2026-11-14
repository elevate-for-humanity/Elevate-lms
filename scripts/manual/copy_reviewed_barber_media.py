"""Copy explicitly reviewed films inside the owner's existing bucket to canonical lesson identities.

No authoring, synthesis, primary-job changes, assessment changes, or publication.
"""
import base64,json,os,re,subprocess,tempfile,uuid
from pathlib import Path
from datetime import datetime,timezone
from urllib.parse import quote
from render_saved_lesson import request,digest,PROJECT,BUCKET

SOURCE='580f7eeb-aa36-4b2a-8526-bbfa6899bb14'
DESTINATION='2c723bfa-8c40-4acc-b961-98d917710ffc'
PAIRS=[
 ('1daf5923-8ac2-4622-853d-e15fa6f661d8','320aed93-7e5e-49cc-911b-0001399d8e2f'),
 ('f3bb1248-548e-4cd7-977d-d36079c47b9b','07946ab8-4e21-45a6-9dc7-369b7bf95772'),
 ('f3ed80af-705d-4482-ba25-9cfad9864203','28c6289a-b7a5-457a-b3be-fd232b15629a'),
 ('78c754a3-6e48-45fb-8fdf-9397f8d1816f','f0bddca8-5f15-4833-a7bc-96f56299fd3f'),
 ('0bd41361-f32b-4acf-98d3-30c81363c6c9','c8690f1f-9618-4de8-88dd-eba8d68ecdf8'),
 ('d5f746e6-5bd6-4dd8-b0c4-e3173c264fb1','335cd31f-cf50-4609-88d8-8ef0f5e501ab'),
 ('c5ba80fa-6145-4827-b1f7-f75ec02333ba','287ddc2e-a3b1-4afe-9cde-54e3a6204418'),
 ('2a590513-ee20-4473-8aa6-46950befbc0f','3db8e953-649c-466e-8957-3e8e0a704f04'),
 ('4c5f16ab-1a2b-4949-8616-ead431dce494','aafa58a3-d731-4189-a82a-8f6c53c60f36'),
 ('e370ade7-5566-4747-b6c3-087ddb5d26a1','84c6bc0b-e1f7-4bde-b0b9-2e225f380f4d'),
 ('cbf330b1-ddfe-438e-b583-f1035f045ff7','78939b29-61bf-4638-b107-d2780ee799b9'),
 ('46d1c315-68d5-4855-85ea-b4f061ec7cd6','0e045552-909f-4266-bd43-acc70dfedda5'),
 ('310eb276-19e4-4588-8a51-e065d918a8a2','5e74e26b-31d6-4b83-85f4-21b9e47a1336'),
 ('972050a9-d51b-4e3d-86a1-16c03a631aed','eebff1e7-005a-4542-862b-4c02dad120be'),
]

def validated_identity(source,destination):
    pair=(source['id'],destination['id'])
    if pair not in PAIRS or source['course_id']!=SOURCE or destination['course_id']!=DESTINATION:
        raise ValueError('MANUAL_CANONICAL_PAIR_INVALID')
    if source['title']!=destination['title'] or source['order_index']!=destination['order_index']:
        raise ValueError('MANUAL_CANONICAL_TITLE_ORDER_CHANGED')
    if source.get('practical_required') is not True or destination.get('practical_required') is not True:
        raise ValueError('MANUAL_CANONICAL_PRACTICAL_REQUIREMENT_CHANGED')
    sections=source['content_json']['experience']['readingGuide']['sections']
    text='\n\n'.join(s['heading']+'. '+s['body'] for s in sections)
    target=destination['content_json']['experience']['readingGuide']['sections']
    if target!=sections or destination['content_json']['manualMediaDraft']['sourceTranscriptSha256']!=digest(text.encode()):
        raise ValueError('MANUAL_CANONICAL_SOURCE_NOT_ATTACHED')
    m=source['content_json']['manualMediaDraft']['encodedReview']
    if m['sourceTranscriptSha256']!=digest(text.encode()):raise ValueError('MANUAL_CANONICAL_SOURCE_HASH_CHANGED')
    if m['courseId']!=SOURCE or m['lessonId']!=source['id']:raise ValueError('MANUAL_CANONICAL_MANIFEST_SCOPE_CHANGED')
    qa=source['media_quality_evidence'];publication=source['content_json']['manualMediaPublication']
    if source['video_status']!='complete' or source['media_quality_status']!='approved' or source['is_published'] is not True:
        raise ValueError('MANUAL_CANONICAL_SOURCE_NOT_REVIEWED')
    if qa.get('mediaSha256')!=m['sha256'] or publication.get('candidateVideoId')!=m['candidateVideoId']:
        raise ValueError('MANUAL_CANONICAL_REVIEW_IDENTITY_CHANGED')
    if qa.get('visualReview',{}).get('reviewedShots')!=len(m['visualShots']):
        raise ValueError('MANUAL_CANONICAL_VISUAL_REVIEW_MISSING')
    prefix=f"course-videos/manual-lessons/{SOURCE}/{source['id']}/reviewed-"
    if not m['storagePath'].startswith(prefix) or not re.fullmatch('[a-f0-9]{64}/completed-lesson-manual.mp4',m['storagePath'][len(prefix):]):
        raise ValueError('MANUAL_CANONICAL_STORAGE_IDENTITY_CHANGED')
    checks=m['technicalChecks']
    if not(checks.get('fullDecode') is True and checks.get('storedBytesHashMatches') is True and checks.get('blackAtLeastPoint4Seconds') is False and checks.get('silenceAtLeast1SecondAtMinus45dB') is False):
        raise ValueError('MANUAL_CANONICAL_TECHNICAL_REVIEW_MISSING')
    return m,text

def main():
    import boto3
    service=os.environ['SUPABASE_SERVICE_ROLE_KEY']
    headers={'apikey':service,'Authorization':'Bearer '+service,'Content-Type':'application/json','Prefer':'resolution=ignore-duplicates,return=representation'}
    def db(path,data=None,method=None):return request(PROJECT+'/rest/v1/'+path,data,headers,method)
    def secret(name):
        value=db('rpc/get_platform_secret',{'p_key':name})
        if not isinstance(value,str) or not value.strip():raise RuntimeError('MANUAL_CREDENTIAL_UNAVAILABLE')
        return value.strip()
    s3=boto3.client('s3',endpoint_url='https://s3.us-east-005.backblazeb2.com',region_name='us-east-005',aws_access_key_id=secret('ELEVATE_MEDIA_ACCESS_KEY_ID'),aws_secret_access_key=secret('ELEVATE_MEDIA_SECRET_ACCESS_KEY'))
    selected=json.loads(os.environ['MANUAL_CANONICAL_LESSON_IDS'])
    if not isinstance(selected,list) or not 1<=len(selected)<=14 or len(set(selected))!=len(selected) or any(x not in {p[1] for p in PAIRS} for x in selected):raise ValueError('MANUAL_CANONICAL_SELECTION_INVALID')
    for source_id,target_id in PAIRS:
        if target_id not in selected:continue
        source=db('course_lessons?select=*&id=eq.'+source_id+'&course_id=eq.'+SOURCE)[0]
        destination=db('course_lessons?select=*&id=eq.'+target_id+'&course_id=eq.'+DESTINATION)[0]
        if not source.get('content_json',{}).get('manualMediaPublication',{}).get('candidateVideoId'):
            print(json.dumps({'lessonId':target_id,'state':'awaiting-original-film-review'}));continue
        m,text=validated_identity(source,destination)
        jobs=db('video_jobs?select=status,review_status,video_url,quality_evidence&id=eq.'+source['video_job_id']+'&course_id=eq.'+SOURCE+'&lesson_id=eq.'+source_id+'&asset_kind=eq.lesson&asset_key=is.null')
        if len(jobs)!=1 or jobs[0]['status']!='complete' or jobs[0]['review_status']!='approved' or jobs[0]['video_url']!=source['video_url'] or jobs[0]['quality_evidence'].get('mediaSha256')!=m['sha256']:raise RuntimeError('MANUAL_CANONICAL_PRIMARY_REVIEW_MISSING')
        original=m['storagePath'];prefix=f"course-videos/manual-lessons/{DESTINATION}/{target_id}/reviewed-{m['planSha256']}";key=prefix+'/completed-lesson-manual.mp4'
        data=s3.get_object(Bucket=BUCKET,Key=original)['Body'].read()
        if digest(data)!=m['sha256'] or len(data)!=m['bytes']:raise RuntimeError('MANUAL_CANONICAL_SOURCE_BYTES_CHANGED')
        s3.copy_object(Bucket=BUCKET,Key=key,CopySource={'Bucket':BUCKET,'Key':original},MetadataDirective='COPY')
        copied=s3.get_object(Bucket=BUCKET,Key=key)['Body'].read()
        if digest(copied)!=m['sha256'] or copied!=data:raise RuntimeError('MANUAL_CANONICAL_COPY_READBACK_FAILED')
        with tempfile.TemporaryDirectory(prefix='manual-canonical-copy-') as directory:
            film=Path(directory)/'film.mp4';film.write_bytes(copied)
            subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(film),'-f','null','-'],check=True)
        source_prefix=original.rsplit('/',1)[0]
        for name in ['captions.vtt','transcript.txt','film-review-sheet.jpg']:
            s3.copy_object(Bucket=BUCKET,Key=prefix+'/'+name,CopySource={'Bucket':BUCKET,'Key':source_prefix+'/'+name},MetadataDirective='COPY')
        sheet=s3.get_object(Bucket=BUCKET,Key=prefix+'/film-review-sheet.jpg')['Body'].read()
        if not sheet or len(sheet)>2*1024*1024:raise RuntimeError('MANUAL_CANONICAL_REVIEW_SHEET_INVALID')
        candidate=str(uuid.uuid5(uuid.NAMESPACE_URL,key));url='https://s3.us-east-005.backblazeb2.com/'+BUCKET+'/'+key
        copied_manifest={**m,'courseId':DESTINATION,'lessonId':target_id,'storagePath':key,'candidateVideoId':candidate,'published':False,'visualReview':'identical-film-source-review-retained; canonical attachment requires manual review','canonicalCopyEvidence':{'sourceCourseId':SOURCE,'sourceLessonId':source_id,'sourceCandidateVideoId':m['candidateVideoId'],'sourceStoragePath':original,'mediaSha256':digest(copied),'bytes':len(copied),'sameOwnerSameBucket':True,'newSynthesis':False,'sourceAndDestinationBytesIdentical':True,'fullDestinationDecode':True,'sourceQualityEvidence':source['media_quality_evidence']}}
        s3.put_object(Bucket=BUCKET,Key=prefix+'/render-manifest.json',Body=json.dumps(copied_manifest).encode(),ContentType='application/json',CacheControl='private, max-age=0')
        db('course_videos?on_conflict=id',{'id':candidate,'lesson_id':target_id,'course_id':DESTINATION,'title':destination['title']+' — identical reviewed film attached to original course, awaiting canonical publication','video_url':url,'storage_path':key,'thumbnail_url':'data:image/jpeg;base64,'+base64.b64encode(sheet).decode(),'duration_seconds':round(m['durationSeconds']),'transcript':text,'generated_by':'manual','asset_role':'reference','status':'ready'})
        latest=db('course_lessons?select=*&id=eq.'+target_id+'&course_id=eq.'+DESTINATION)[0];validated_identity(source,latest)
        content=latest['content_json'];content['manualMediaDraft']['encodedReview']=copied_manifest
        changed=db('course_lessons?id=eq.'+target_id+'&course_id=eq.'+DESTINATION+'&updated_at=eq.'+quote(latest['updated_at'],safe=''),{'content_json':content,'updated_at':datetime.now(timezone.utc).isoformat()},'PATCH')
        if len(changed)!=1:raise RuntimeError('MANUAL_CANONICAL_DESTINATION_CHANGED')
        print(json.dumps({'lessonId':target_id,'candidateVideoId':candidate,'state':'canonical-copy-reviewed-source-awaiting-publication','sha256':digest(copied),'bytes':len(copied)}))

if __name__=='__main__':main()
