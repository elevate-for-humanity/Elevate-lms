import {createHash} from 'node:crypto';
import {optionalStorageCacheMiss} from '../core/worker-error.mjs';

export function teachingPhotoRequests(scene) {
 const steps=scene.teachingVisual?.steps??[];
 const requests=steps.length===1?[{...steps[0],view:'full workstation view'},{...steps[0],view:'close detail view with complete hands and tools'}]:steps.map(step=>({...step,view:'complete action view'}));
 if(scene.recapText?.trim())requests.push({label:'Recap',value:scene.recapText,narrationQuote:scene.recapText,view:'fresh summary illustration'});
 return requests;
}
// Keep existing cue cache keys reachable while broadening asset selection.
export function teachingPhotoPrompt(input,scene,step) {
 return ['Generate a camera-realistic professional training photograph with natural skin texture, lifelike materials and photographic lighting. No cartoons, anime, drawings, vector art, clip art or 3D-rendered characters.',
 'This synthetic photograph is an educational illustration, not evidence of a performed practical procedure.',
 'Show complete hands, tools and relevant subject, uncropped, no printed text, no logos, no invented measurements.',
 'Use a realistic professional training setting. No unsafe actions or invented numbered guards.',String(input.courseTitle),String(scene.visualRequirement),String(step.narrationQuote),step.view].join('\n');
}
const valid=photo=>/^[a-f0-9]{64}$/.test(photo?.sha256??'')&&new RegExp('^approved-teaching-photos/'+photo.sha256+'\\.(png|jpg|webp)$').test(photo.storagePath??'');
const terms=text=>new Set(String(text).toLowerCase().match(/[a-z]{3,}/g)??[]);
async function optionalDownload(bucket,path) {
 const result=await bucket.download(path);
 if(result.error&&!optionalStorageCacheMiss(result.error))throw result.error;
 return result.data;
}
export async function rememberCoursePhoto(input,bucket,photo,context='') {
 if(!input.courseId||typeof bucket.list!=='function'||!valid(photo))return;
 const path='course-related-photos/'+input.courseId+'/'+photo.sha256+'.json';
 const result=await bucket.upload(path,Buffer.from(JSON.stringify({...photo,courseId:input.courseId,courseTitle:input.courseTitle,context})),{contentType:'application/json',upsert:true});
 if(result.error)throw result.error;
}
/** Course provenance and real bytes remain mandatory; sentence/scene equality
 * is not. Reuse the best contextual picture before requesting new inference. */
export async function coursePhotoPicker(input,bucket,loadSeeds=async()=>[]) {
 if(!input.courseId||typeof bucket.list!=='function')return null;
 const prefix='course-related-photos/'+input.courseId;
 const photos=new Map();
 // Recover already-created cue pictures after a failed render. No paid calls.
 const prime=async seed=>{
 for(const scene of seed.artifacts?.storyboard?.storyboard?.scenes??[]){
  const requests=teachingPhotoRequests(scene);
  for(let offset=0;offset<requests.length;offset+=4)await Promise.all(requests.slice(offset,offset+4).map(async(step,j)=>{
   const index=offset+j,prompt=teachingPhotoPrompt(seed,scene,step);
   const hash=createHash('sha256').update(JSON.stringify({version:'photographic-course-cues-v4',lesson:seed.lessonId,scene:scene.id,index,prompt})).digest('hex');
   const file=await optionalDownload(bucket,'approved-teaching-photo-index/'+hash+'.json');
   if(!file)return;
   const photo=JSON.parse(await file.text());
   if(!valid(photo))return;
   const entry={...photo,context:[scene.visualRequirement,step.narrationQuote].join(' ')};
   photos.set(photo.sha256,entry);await rememberCoursePhoto(input,bucket,photo,entry.context);
  }));
 }
 };
 await prime(input);
 // A lesson with no saved pictures may use another lesson's bookkeeping
 // pictures from this same course; it need not generate its own exact image.
 if(photos.size<2)for(const seed of await loadSeeds()){await prime(seed);if(photos.size>=8)break;}
 for(let offset=0;;offset+=100){
  const result=await bucket.list(prefix,{limit:100,offset,sortBy:{column:'name',order:'asc'}});
  if(result.error)throw result.error;
  for(const row of result.data??[]){
   if(!/^[a-f0-9]{64}\.json$/.test(row.name))continue;
   const file=await optionalDownload(bucket,prefix+'/'+row.name);if(!file)continue;
   const photo=JSON.parse(await file.text());
   if(photo.courseId===input.courseId&&valid(photo))photos.set(photo.sha256,photo);
  }
  if((result.data??[]).length<100)break;
 }
 const uses=new Map(),verified=new Set();
 return async(scene,index,step)=>{
  const previous=scene.previousPhotoHash;
  const quoteTerms=terms(step.narrationQuote);
  const ranked=[...photos.values()].filter(p=>p.sha256!==previous).sort((a,b)=>{
   const count=(uses.get(a.sha256)??0)-(uses.get(b.sha256)??0);if(count)return count;
   const score=p=>[...terms(p.context)].filter(t=>quoteTerms.has(t)).length;
   return score(b)-score(a)||a.sha256.localeCompare(b.sha256);
  });
  const photo=ranked[0];if(!photo)return null;
  if(!verified.has(photo.sha256)){
   const file=await optionalDownload(bucket,photo.storagePath);if(!file)throw Error('COURSE_RELATED_PHOTO_READBACK_FAILED');
   if(createHash('sha256').update(Buffer.from(await file.arrayBuffer())).digest('hex')!==photo.sha256)throw Error('COURSE_RELATED_PHOTO_HASH_MISMATCH');
   verified.add(photo.sha256);
  }
  const signed=await bucket.createSignedUrl(photo.storagePath,3600);
  if(signed.error||!signed.data?.signedUrl)throw Error('COURSE_RELATED_PHOTO_SIGNING_FAILED');
  uses.set(photo.sha256,(uses.get(photo.sha256)??0)+1);
  return {...photo,imageUrl:signed.data.signedUrl,narrationQuote:step.narrationQuote,illustration:true,courseRelated:true,selectionMethod:'course-context',provider:photo.provider??'google-generated'};
 };
}
