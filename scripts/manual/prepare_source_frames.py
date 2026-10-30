"""Prepare inactive photographic frame candidates from explicitly selected owned sources."""
import base64,io,json,os,re,subprocess,tempfile,urllib.request,urllib.error,uuid
from pathlib import Path
from PIL import Image,ImageDraw
from render_saved_lesson import PROJECT,BUCKET,request,digest

COURSES={'580f7eeb-aa36-4b2a-8526-bbfa6899bb14','d48c61c4-8880-4d9d-9ab5-fab4dd51b201'}

def source_ids(values):
    if not isinstance(values,list) or not 1<=len(values)<=20: raise ValueError('MANUAL_SOURCE_SELECTION_INVALID')
    ids=[str(uuid.UUID(x)) for x in values]
    if len(set(ids))!=len(ids): raise ValueError('MANUAL_SOURCE_SELECTION_DUPLICATE')
    return ids

def main():
    import boto3
    headers={'apikey':os.environ['SUPABASE_SERVICE_ROLE_KEY'],'Authorization':'Bearer '+os.environ['SUPABASE_SERVICE_ROLE_KEY'],'Content-Type':'application/json','Prefer':'resolution=ignore-duplicates,return=representation'}
    def db(path,data=None,method=None):return request(PROJECT+'/rest/v1/'+path,data,headers,method)
    def secret(key):
        result=db('rpc/get_platform_secret',{'p_key':key})
        if not isinstance(result,str) or not result.strip(): raise RuntimeError('MANUAL_STORAGE_CREDENTIAL_UNAVAILABLE')
        return result.strip()
    s3=boto3.client('s3',endpoint_url='https://s3.us-east-005.backblazeb2.com',region_name='us-east-005',aws_access_key_id=secret('ELEVATE_MEDIA_ACCESS_KEY_ID'),aws_secret_access_key=secret('ELEVATE_MEDIA_SECRET_ACCESS_KEY'))
    def process(identity):
        rows=db('course_videos?select=id,course_id,title,storage_path,entitlement_id,status,asset_role&id=eq.'+identity)
        if len(rows)!=1:raise RuntimeError('MANUAL_SOURCE_NOT_FOUND')
        source=rows[0]
        if source['course_id'] not in COURSES or source['status']!='ready' or source['asset_role']!='source_broll' or not source['entitlement_id']:raise RuntimeError('MANUAL_SOURCE_SCOPE_INVALID')
        rights=db('licensed_media_entitlements?select=id,provider,license_type,metadata&id=eq.'+source['entitlement_id'])
        if len(rights)!=1 or rights[0]['metadata'].get('licenseObserved') is not True:raise RuntimeError('MANUAL_SOURCE_LICENSE_EVIDENCE_REQUIRED')
        license=rights[0];key=source['storage_path']
        if not key.startswith('licensed-library/') or any(p in ('.','..') for p in key.split('/')):raise RuntimeError('MANUAL_SOURCE_PATH_INVALID')
        # Read the existing private uploaded original, never scrape a catalogue preview.
        from urllib.parse import quote
        req=urllib.request.Request(PROJECT+'/storage/v1/object/authenticated/course_videos/'+quote(key,safe='/'),headers=headers)
        with urllib.request.urlopen(req,timeout=120) as response:
            data=response.read(512*1024*1024+1)
        if not data or len(data)>512*1024*1024:raise RuntimeError('MANUAL_SOURCE_SIZE_INVALID')
        sha=digest(data);expected=license['metadata'].get('sha256')
        if expected and expected!=sha:raise RuntimeError('MANUAL_SOURCE_HASH_MISMATCH')
        with tempfile.TemporaryDirectory(prefix='manual-source-') as directory:
            root=Path(directory);original=root/('source'+Path(key).suffix);original.write_bytes(data)
            is_photo=license['metadata'].get('mediaType')=='photo' or Path(key).suffix.lower() in ('.jpg','.jpeg','.png','.webp')
            duration=0 if is_photo else float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(original)]))
            if not is_photo and not .2<duration<300:raise RuntimeError('MANUAL_SOURCE_DURATION_INVALID')
            moments=[0] if is_photo else [duration*.25,duration*.5,duration*.75]
            sheet=Image.new('RGB',(480*len(moments),300),(24,24,27));draw=ImageDraw.Draw(sheet);candidate_ids=[]
            for n,moment in enumerate(moments):
                frame=root/(str(n)+'.jpg')
                args=['ffmpeg','-v','error','-y']+([] if is_photo else ['-ss',str(moment)])+['-i',str(original),'-vf','scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black','-frames:v','1','-q:v','2',str(frame)]
                subprocess.run(args,check=True);image=frame.read_bytes();frame_sha=digest(image)
                stable=f'course-videos/manual-source-frames/{source["course_id"]}/{sha}/{n}.jpg'
                s3.put_object(Bucket=BUCKET,Key=stable,Body=image,ContentType='image/jpeg',CacheControl='private, max-age=0')
                image_id=str(uuid.uuid5(uuid.NAMESPACE_URL,stable));candidate_ids.append(image_id)
                exists=db('course_visual_assets?select=id&id=eq.'+image_id)
                if not exists:
                    orders=db('course_visual_assets?select=sort_order&course_id=eq.'+source['course_id']+'&placement=eq.lesson&order=sort_order.desc&limit=1')
                    order=(orders[0]['sort_order'] if orders else 0)+1
                    db('course_visual_assets?on_conflict=id',{'id':image_id,'course_id':source['course_id'],'placement':'lesson','media_type':'image','asset_url':'data:image/jpeg;base64,'+base64.b64encode(image).decode(),'alt_text':source['title']+' — source frame at '+str(round(moment,2))+' seconds','caption':'Contextual source frame awaiting manual instructional review.','sort_order':order,'is_active':False,'metadata':{'sourceVideoId':identity,'sourceStoragePath':key,'sourceSha256':sha,'sourceTimeSeconds':moment,'frameStoragePath':stable,'sha256':frame_sha,'provider':license['provider'],'entitlement_id':license['id'],'license_type':license['license_type'],'license_observed':True,'manualCatalogue':False,'reviewStatus':'pending','practicalDemonstrationVerified':False}})
                thumb=Image.open(io.BytesIO(image)).convert('RGB');thumb.thumbnail((480,270));sheet.paste(thumb,(480*n,0));draw.text((480*n+8,275),str(round(moment,2))+'s — '+source['title'][:48],fill='white')
            buffer=io.BytesIO();sheet.save(buffer,format='JPEG',quality=88)
            db('course_videos?id=eq.'+identity,{'thumbnail_url':'data:image/jpeg;base64,'+base64.b64encode(buffer.getvalue()).decode()},'PATCH')
            print(json.dumps({'sourceVideoId':identity,'sourceSha256':sha,'sourceBytes':len(data),'durationSeconds':duration,'frameCandidateIds':candidate_ids,'reviewStatus':'pending'}))

    failed=[]
    for identity in source_ids(json.loads(os.environ['MANUAL_SOURCE_IDS'])):
        try:process(identity)
        except Exception as error:
            code='HTTP_'+str(error.code) if isinstance(error,urllib.error.HTTPError) else str(error) if isinstance(error,RuntimeError) and re.fullmatch('[A-Z_]{1,100}',str(error)) else type(error).__name__
            print(json.dumps({'sourceVideoId':identity,'reviewStatus':'source-check-failed','reason':code}));failed.append(identity)
    if failed:raise RuntimeError('MANUAL_SOURCE_PREPARATION_PARTIAL')

if __name__=='__main__':main()
