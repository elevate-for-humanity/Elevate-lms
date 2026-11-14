import {approvedReferencePhotoPicker} from '../../lib/ultimate-course-builder/adapters/approved-reference-photos.mjs';

/** Read and sign existing owner-approved assets. No image generation, uploads,
 * bucket changes, application publication, or lease operations. */
export async function verifyOwnerReferencePhotos({env,profile,lessonBuildId,competencyId,request=fetch}){
 const base=env.NEXT_PUBLIC_SUPABASE_URL;
 if(base!=='https://cuxzzpsyufcewtmicszk.supabase.co'||!env.SUPABASE_SERVICE_ROLE_KEY)throw Error('OWNER_REFERENCE_DATABASE_REQUIRED');
 const headers={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'content-type':'application/json'};
 const call=(path,options={})=>request(base+path,{...options,headers,redirect:'error',signal:AbortSignal.timeout(30000)});
 const db={from(table){
  if(!['course_lessons','ultimate_artifact_versions','ultimate_lesson_steps'].includes(table))throw Error('OWNER_REFERENCE_TABLE_REQUIRED');
  const query=new URLSearchParams();
  return {select(fields){query.set('select',fields);return this;},eq(key,value){query.set(key,'eq.'+value);return this;},async single(){
   const response=await call('/rest/v1/'+table+'?'+query);if(!response.ok)throw Error('OWNER_REFERENCE_READ_HTTP_'+response.status);
   const rows=await response.json();return {data:rows.length===1?rows[0]:null};
  }};
 },storage:{from(bucket){
  if(!['course-videos','course_videos'].includes(bucket))throw Error('OWNER_REFERENCE_BUCKET_REQUIRED');
  const path=key=>key.split('/').map(encodeURIComponent).join('/');
  return {async download(key){const response=await call('/storage/v1/object/authenticated/'+bucket+'/'+path(key));return response.ok?{data:response}:{error:Error('OWNER_REFERENCE_DOWNLOAD_HTTP_'+response.status)};},async createSignedUrl(key,expiresIn){
   const response=await call('/storage/v1/object/sign/'+bucket+'/'+path(key),{method:'POST',body:JSON.stringify({expiresIn})});
   if(!response.ok)return {error:Error('OWNER_REFERENCE_SIGN_HTTP_'+response.status)};
   const body=await response.json(),relative=body.signedURL;
   if(typeof relative!=='string'||!relative.startsWith('/object/sign/'+bucket+'/'))return {error:Error('OWNER_REFERENCE_SIGN_ORIGIN_REQUIRED')};
   return {data:{signedUrl:base+'/storage/v1'+relative}};
  }};
 }}};
 const lessonId=profile.canonicalLessonIds?.[competencyId];
 const pick=await approvedReferencePhotoPicker({lessonId,presentationContract:profile.presentationContract},db,{storageOrigin:base});
 if(!pick)throw Error('OWNER_REFERENCE_SAME_LESSON_REQUIRED');
 const {data:board}=await db.from('ultimate_lesson_steps').select('artifacts').eq('lesson_build_id',lessonBuildId).eq('step','storyboard').single();
 const scenes=board?.artifacts?.storyboard?.scenes;
 if(!Array.isArray(scenes)||scenes.length!==13)throw Error('OWNER_REFERENCE_CURRENT_STORYBOARD_REQUIRED');
 const hashes=[];
 for(const scene of scenes){
  const steps=scene.teachingVisual?.steps;
  if(!steps?.length||!scene.recapText?.trim())throw Error('OWNER_REFERENCE_CURRENT_CUES_REQUIRED');
  const requests=steps.length===1?[steps[0],steps[0]]:[...steps];
  requests.push({narrationQuote:scene.recapText});
  const sceneHashes=[];
  for(const [index,step] of requests.entries()){
   const photo=await pick(scene,index,step,index===requests.length-1);hashes.push(photo.sha256);sceneHashes.push(photo.sha256);
  }
  if(new Set(sceneHashes).size!==sceneHashes.length)throw Error('OWNER_REFERENCE_DISTINCT_CUES_REQUIRED');
 }
 return {sourceSha256:profile.presentationContract.approvedReferenceVideo.sha256,sceneCount:scenes.length,pictureCount:hashes.length,distinctPictures:new Set(hashes).size,generatedPictures:0};
}
