import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {approvedReferencePhotoPicker} from './approved-reference-photos.mjs';
import {ULTIMATE_TEACHING_SEQUENCE} from '../instructional/teaching-sequence.ts';
const digest=b=>createHash('sha256').update(b).digest('hex');
function fixture(base='https://test.supabase.co'){
 const lessonId='e1e53bfd-2504-46b0-a814-a31c74a0090a',film=Buffer.from('owner-approved-film');
 const storagePath='generated-lessons/lesson-'+lessonId+'-immutable.mp4',videoUrl=base+'/storage/v1/object/public/course-videos/'+storagePath;
 const files=new Map([[storagePath,film]]),calls=[];
 const scenes=Array.from({length:13},(_,i)=>({id:'scene:seg-'+String(i+1).padStart(2,'0')+'-stage',order:i+1,pictureCues:Array.from({length:3},(_,j)=>{
  const path='approved-teaching-photos/'+i+'-'+j+'.png',bytes=Buffer.from('photograph-'+i+'-'+j);files.set(path,bytes);
  return {imageUrl:base+'/storage/v1/object/sign/course_videos/'+path+'?token=expired',sha256:digest(bytes),isRecap:j===2,narrationQuote:'Approved source cue '+i+' '+j};
 })}));
 const lesson={id:lessonId,approved:true,is_published:true,video_url:videoUrl};
 const version={id:'17166b5b-e730-4b1e-a52c-6c467e38b234',content:{render:{success:true,videoUrl,sceneData:{scenes}}}};
 const input={lessonId,presentationContract:{approvedReferenceVideo:{assetId:version.id,storagePath,sha256:digest(film),permittedUses:['presentation-reference']}}};
 const db={from(table){calls.push(['read',table]);return {select(){return this;},eq(){return this;},async single(){return {data:table==='course_lessons'?lesson:version};}};},storage:{from(bucket){return {async download(path){calls.push(['download',bucket,path]);const value=files.get(path);return value?{data:{arrayBuffer:async()=>value}}:{error:Error('missing')};},async createSignedUrl(path,expires){calls.push(['sign',bucket,path,expires]);return {data:{signedUrl:base+'/storage/v1/object/sign/'+bucket+'/'+path+'?token=renewed'}};}};}}};
 return {base,input,db,calls,files,lesson,version,scenes};
}
async function within(f,work){const previous=process.env.NEXT_PUBLIC_SUPABASE_URL;process.env.NEXT_PUBLIC_SUPABASE_URL=f.base;try{return await work();}finally{if(previous===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=previous;}}
test('reuses 39 exact approved photographs with fresh private URLs and their real provenance',async()=>{
 const f=fixture();await within(f,async()=>{
  const pick=await approvedReferencePhotoPicker(f.input,f.db),out=[];
  for(let scene=1;scene<=13;scene++)for(let cue=0;cue<3;cue++)out.push(await pick({id:'scene:seg_'+String(scene).padStart(2,'0')+'_stage'},cue,{narrationQuote:'Current teaching cue '+scene+' '+cue},cue===2));
  assert.equal(new Set(out.map(p=>p.sha256)).size,39);
  assert.ok(out.every(p=>p.provider==='owner-approved-reference'&&p.ownerReferenceArtifactId===f.version.id&&p.imageUrl.endsWith('token=renewed')));
  assert.equal(f.calls.filter(c=>c[0]==='download'&&c[1]==='course-videos').length,1);
  assert.equal(f.calls.filter(c=>c[0]==='sign').length,39);
  assert.ok(f.calls.every(c=>['read','download','sign'].includes(c[0])));
 });
});
test('a different lesson, absent permission, or practical demonstration never inherits these pictures',async()=>{
 for(const modify of [f=>f.input.lessonId='another-lesson',f=>f.input.presentationContract.approvedReferenceVideo.permittedUses=[],f=>f.input.requiresPhysicalDemonstration=true]){
  const f=fixture();modify(f);assert.equal(await approvedReferencePhotoPicker(f.input,f.db),null);assert.deepEqual(f.calls,[]);
 }
});
test('requires actual published owner approval and the exact immutable film artifact',async()=>{
 for(const modify of [f=>f.lesson.approved=false,f=>f.lesson.is_published=false,f=>f.version.content.render.videoUrl+='different']){
  const f=fixture();modify(f);await within(f,()=>assert.rejects(()=>approvedReferencePhotoPicker(f.input,f.db),/OWNER_REFERENCE_/));
 }
});
test('rejects a changed source film before signing any photograph',async()=>{
 const f=fixture();f.files.set(f.input.presentationContract.approvedReferenceVideo.storagePath,Buffer.from('changed-film'));
 await within(f,()=>assert.rejects(()=>approvedReferencePhotoPicker(f.input,f.db),/FILM_HASH_MISMATCH/));assert.equal(f.calls.some(c=>c[0]==='sign'),false);
});
test('rejects altered photographs and foreign origins without signing them',async()=>{
 for(const change of [f=>f.files.set('approved-teaching-photos/0-0.png',Buffer.from('changed')),f=>f.scenes[0].pictureCues[0].imageUrl='https://example.org/file.png']){
  const f=fixture();change(f);await within(f,async()=>{const pick=await approvedReferencePhotoPicker(f.input,f.db);await assert.rejects(()=>pick({id:'scene:seg_01_why'},0,{narrationQuote:'A matching moment'},false),/PHOTO_HASH_MISMATCH|IMAGE_ORIGIN_REQUIRED/);});assert.equal(f.calls.some(c=>c[0]==='sign'),false);
 }
});
test('a missing stage or cue cannot be silently replaced with an unrelated image',async()=>{
 const f=fixture();await within(f,async()=>{const pick=await approvedReferencePhotoPicker(f.input,f.db);await assert.rejects(()=>pick({id:'scene:seg_14_extra'},0,{narrationQuote:'Cue'},false),/STAGE_REQUIRED/);await assert.rejects(()=>pick({id:'scene:seg_01_why'},4,{narrationQuote:'Cue'},false),/PICTURE_REQUIRED/);});
});
test('named blueprint stages resolve to their exact approved numbered stage and existing photo hashes',async()=>{
 const f=fixture();await within(f,async()=>{
  const pick=await approvedReferencePhotoPicker(f.input,f.db);
  for(const [i,stage] of ULTIMATE_TEACHING_SEQUENCE.entries()){
   const photo=await pick({id:'scene:seg-'+stage.replaceAll('_','-'),stage},0,{narrationQuote:'Current teaching cue'},false);
   assert.equal(photo.referenceSceneId,f.scenes[i].id);assert.equal(photo.sha256,f.scenes[i].pictureCues[0].sha256);
  }
 });
});
test('rewritten narration or additional teaching cues use the normal illustration pipeline instead of mismatched approved photographs',async()=>{
 for(const extra of [false,true]){
  const f=fixture(),source=f.scenes[3];source.pictureCues[1].narrationQuote=source.pictureCues[0].narrationQuote;
  const scene={id:'scene:seg-concept-explanation',stage:'concept_explanation',recapText:source.pictureCues[2].narrationQuote,teachingVisual:{steps:extra?Array.from({length:3},()=>({narrationQuote:source.pictureCues[0].narrationQuote})):[{narrationQuote:'A newly authored, different teaching point'}]}};
  f.input.artifacts={storyboard:{storyboard:{scenes:[scene]}}};
  assert.equal(await approvedReferencePhotoPicker(f.input,f.db,{storageOrigin:f.base}),null);assert.equal(f.calls.some(c=>c[0]==='sign'),false);
 }
});
test('an exactly covered current storyboard retains immutable film and photograph verification',async()=>{
 const f=fixture(),source=f.scenes[3];source.pictureCues[1].narrationQuote=source.pictureCues[0].narrationQuote;
 f.input.artifacts={storyboard:{storyboard:{scenes:[{id:'scene:seg-concept-explanation',stage:'concept_explanation',recapText:source.pictureCues[2].narrationQuote,teachingVisual:{steps:[{narrationQuote:source.pictureCues[0].narrationQuote}]}}]}}};
 const pick=await approvedReferencePhotoPicker(f.input,f.db,{storageOrigin:f.base});assert.equal(typeof pick,'function');
 const photo=await pick(f.input.artifacts.storyboard.storyboard.scenes[0],0,{narrationQuote:source.pictureCues[0].narrationQuote},false);assert.equal(photo.sha256,source.pictureCues[0].sha256);
 f.files.set(f.input.presentationContract.approvedReferenceVideo.storagePath,Buffer.from('changed-film'));
 await assert.rejects(approvedReferencePhotoPicker(f.input,f.db,{storageOrigin:f.base}),/FILM_HASH_MISMATCH/);
});
test('unknown, conflicting or ambiguous teaching stages are rejected before photo signing',async()=>{
 for(const scene of [{id:'scene:seg-unknown',stage:'invented'},{id:'scene:seg-01-why',stage:'recap'},{id:'scene:seg-why-it-matters'}]){
  const f=fixture();await within(f,async()=>{const pick=await approvedReferencePhotoPicker(f.input,f.db);await assert.rejects(()=>pick(scene,0,{narrationQuote:'Cue'},false),/STAGE_REQUIRED/);});
  assert.equal(f.calls.some(c=>c[0]==='sign'),false);
 }
 const f=fixture();Object.assign(f.scenes[1],{id:f.scenes[0].id,order:1});
 await within(f,async()=>{const pick=await approvedReferencePhotoPicker(f.input,f.db);await assert.rejects(()=>pick({id:'scene:seg-why-it-matters',stage:'why_it_matters'},0,{narrationQuote:'Cue'},false),/STAGE_REQUIRED/);});
 assert.equal(f.calls.some(c=>c[0]==='sign'),false);
});
test('the real photo preparation path uses the selected reference without invoking generation or unrelated asset lookup',async()=>{
 const {readFileSync}=await import('node:fs');const {stripTypeScriptTypes}=await import('node:module');
 const source=stripTypeScriptTypes(readFileSync(new URL('./teaching-photos.ts',import.meta.url),'utf8').replace(/^import[^\n]*\n/gm,''));
 const prefix=readFileSync(new URL('./teaching-photo-batch.mjs',import.meta.url),'utf8').replace(/^export /gm,'')+`\nconst never=()=>{throw Error('UNEXPECTED_GENERATION_OR_REPLACEMENT')};
 const approvedReferencePhotoPicker=async()=>async(scene,index,step)=>({imageUrl:'https://test.supabase.co/photo',storagePath:'approved-teaching-photos/'+scene.id+'-'+index+'.png',sha256:Buffer.from(scene.id+'-'+index).toString('hex').padEnd(64,'0'),narrationQuote:step.narrationQuote,ownerReferenceArtifactId:'owner-reference'});
 const courseSelectedStill=never,recoverTeachingPhoto=never,selectReviewedTeachingPhoto=never,compatibleVisualTask=never,createHash=never,generateTeachingPhoto=never;
 const reportCourseProgress=()=>{},courseProgressSignal=()=>undefined;\n`;
 const {prepareTeachingPhotos}=await import('data:text/javascript;base64,'+Buffer.from(prefix+source).toString('base64'));
 const scenes=Array.from({length:13},(_,i)=>({id:'scene:seg_'+String(i+1).padStart(2,'0')+'_topic',recapText:'A complete source-supported recap.',teachingVisual:{steps:[{label:'Teaching moment',value:'A source-supported action',narrationQuote:'A source-supported action'}]}}));
 const out=await prepareTeachingPhotos({lessonPresentation:'approved-premium-v1',artifacts:{storyboard:{storyboard:{scenes}}}},{from(){throw Error('UNEXPECTED_ASSET_LOOKUP');}});
 assert.equal(Object.values(out.teachingPhotos).flat().length,39);
 assert.ok(Object.values(out.teachingPhotos).flat().every(p=>p.ownerReferenceArtifactId==='owner-reference'));
});
test('the dependency-free live preflight reads and signs the existing 39 assets without uploads or generation',async()=>{
 const {verifyOwnerReferencePhotos}=await import('../../../scripts/gcp/verify-owner-reference-photos.mjs');
 const f=fixture('https://cuxzzpsyufcewtmicszk.supabase.co'),calls=[];
 const profile={presentationContract:f.input.presentationContract,canonicalLessonIds:{competency:f.input.lessonId}};
 const scenes=f.scenes.map((s,i)=>({id:'scene:seg_'+String(i+1).padStart(2,'0')+'_stage',recapText:'An authorized recap of this moment.',teachingVisual:{steps:[{narrationQuote:'A teaching moment from the current lesson.'}]}}));
 const request=async(url,options)=>{
  const u=new URL(url);calls.push({path:u.pathname,method:options.method??'GET'});
  assert.equal(u.origin,f.base);assert.equal(options.headers.apikey,'existing-test-service-role');assert.equal(options.redirect,'error');
  if(u.pathname.startsWith('/rest/v1/'))return {ok:true,json:async()=>[u.pathname.endsWith('course_lessons')?f.lesson:u.pathname.endsWith('ultimate_artifact_versions')?f.version:{artifacts:{storyboard:{scenes}}}]};
  if(u.pathname.startsWith('/storage/v1/object/authenticated/')){
   const key=u.pathname.split('/').slice(6).map(decodeURIComponent).join('/'),bytes=f.files.get(key);assert.ok(bytes,key);return {ok:true,arrayBuffer:async()=>bytes};
  }
  assert.ok(u.pathname.startsWith('/storage/v1/object/sign/course_videos/'));
  assert.equal(options.method,'POST');assert.equal(JSON.parse(options.body).expiresIn,3600);
  return {ok:true,json:async()=>({signedURL:u.pathname.replace('/storage/v1','')+'?token=verified'})};
 };
 const result=await verifyOwnerReferencePhotos({env:{NEXT_PUBLIC_SUPABASE_URL:f.base,SUPABASE_SERVICE_ROLE_KEY:'existing-test-service-role'},profile,lessonBuildId:'lesson-build',competencyId:'competency',request});
 assert.deepEqual(result,{sourceSha256:f.input.presentationContract.approvedReferenceVideo.sha256,sceneCount:13,pictureCount:39,distinctPictures:39,generatedPictures:0});
 assert.equal(calls.filter(c=>c.method==='POST').length,39);assert.ok(calls.filter(c=>c.method==='POST').every(c=>c.path.includes('/object/sign/')));
});

test('incomplete reference cue evidence selects the ordinary cue-matched pipeline before rendering',async()=>{
 for(const mutate of [f=>{f.scenes[3].pictureCues[0].sha256='';},f=>{f.scenes[3].pictureCues[0].imageUrl='';},f=>{f.scenes[3].order=99;}]){
  const f=fixture(),source=f.scenes[3];source.pictureCues[1].narrationQuote=source.pictureCues[0].narrationQuote;
  f.input.artifacts={storyboard:{storyboard:{scenes:[{id:'scene:seg-concept-explanation',stage:'concept_explanation',recapText:source.pictureCues[2].narrationQuote,teachingVisual:{steps:[{narrationQuote:source.pictureCues[0].narrationQuote}]}}]}}};
  mutate(f);
  assert.equal(await approvedReferencePhotoPicker(f.input,f.db,{storageOrigin:f.base}),null);
  assert.equal(f.calls.some(call=>call[0]==='sign'),false);
 }
});
