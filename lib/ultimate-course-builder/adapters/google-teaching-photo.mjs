import {photoResponseDetails} from './photo-repair.mjs';
import {courseProgressSignal} from '../worker/progress-watch.mjs';
import {normalizeTeachingPhoto} from './photo-format.mjs';
const successfulCapacityAlternates=new Map();
export async function generateTeachingPhoto(prompt,{request=fetch,env=process.env,delay=ms=>new Promise(r=>setTimeout(r,ms)),maxAttempts=3,timeoutMs=120000}={}){
 const project=env.GOOGLE_CLOUD_PROJECT??env.GCP_PROJECT_ID??'elegant-racer-299721';
 const region=env.ULTIMATE_PHOTO_REGION??'us';
 const model=env.ULTIMATE_PHOTO_MODEL??'gemini-3.1-flash-image';
 if(!/^[a-z][a-z0-9-]+$/.test(project)||!['us','global'].includes(region)||!['gemini-3.1-flash-image','gemini-3.1-flash-lite-image'].includes(model)||(model==='gemini-3.1-flash-lite-image'&&region!=='global'))
  throw Error('GOOGLE_TEACHING_PHOTO_CONFIGURATION_INVALID');
 const identity=await request('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',{headers:{'Metadata-Flavor':'Google'},signal:AbortSignal.timeout(10000)});
 if(!identity.ok)throw Error('GOOGLE_TEACHING_PHOTO_IDENTITY_UNAVAILABLE');
 const token=await identity.json();
 if(!token.access_token)throw Error('GOOGLE_TEACHING_PHOTO_IDENTITY_UNAVAILABLE');
 let activeRegion=region;
 // On transient US capacity contention, use Google's pooled global endpoint.
 // Operators can enforce US-only processing with ULTIMATE_PHOTO_GLOBAL_FAILOVER=false.
 const globalFailover=env.ULTIMATE_PHOTO_GLOBAL_FAILOVER!=='false';
 const routeKey=project+':'+model;
 let requestModel=region==='global'?(successfulCapacityAlternates.get(routeKey)??model):model;
 if(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>3||!Number.isFinite(timeoutMs)||timeoutMs<1000||timeoutMs>120000)throw Error('GOOGLE_TEACHING_PHOTO_RETRY_CONFIGURATION_INVALID');
 for(let attempt=0;attempt<maxAttempts;attempt++){
  try {
  const host=activeRegion==='global'?'aiplatform.googleapis.com':'aiplatform.us.rep.googleapis.com';
  const response=await request('https://'+host+'/v1/projects/'+project+'/locations/'+activeRegion+'/publishers/google/models/'+requestModel+':generateContent',{ 
   method:'POST',headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'},
   body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{responseModalities:['TEXT','IMAGE'],imageConfig:{aspectRatio:'16:9',imageSize:'1K'}}}),
   signal:courseProgressSignal()?AbortSignal.any([courseProgressSignal(),AbortSignal.timeout(timeoutMs)]):AbortSignal.timeout(timeoutMs),
  });
  if([429,500,502,503,504].includes(response.status)&&attempt<maxAttempts-1){
   // A capacity rejection may use the supported alternate image model within
   // the same three-request budget and global processing location. Auth,
   // billing, malformed requests and safety rejections never trigger this.
   if(response.status===429 && activeRegion==='us' && globalFailover) activeRegion='global';
   else if(activeRegion==='global'&&[429,503].includes(response.status))requestModel=requestModel==='gemini-3.1-flash-image'?'gemini-3.1-flash-lite-image':'gemini-3.1-flash-image';
   const retryAfter=Number(response.headers?.get?.('retry-after'));await delay(Math.min(60000,Math.max(15000*2**attempt,Number.isFinite(retryAfter)?retryAfter*1000:0)));continue;
  }
  if(!response.ok){const failure=await response.json().catch(()=>({}));throw Error('GOOGLE_TEACHING_PHOTO_HTTP_'+response.status+':'+String(failure.error?.message??'').slice(0,500));}
  const result=await response.json();
  // The image model may return JPEG or WebP. A valid photograph must not be
  // misreported as a filtered/missing response just because it is not PNG.
  // Vertex can return image parts after a text part or in a later candidate.
  const image=result.candidates?.flatMap(c=>c.content?.parts??[]).find(p=>
   typeof p.inlineData?.data==='string' && String(p.inlineData?.mimeType).toLowerCase().startsWith('image/')
  )?.inlineData;
  if(!image?.data){
   const details=photoResponseDetails(result);
   console.warn('[TeachingPhoto] provider returned no image',details);
   // A successful response without an image can be transient. Never retry
   // safety-blocked responses; the approved asset-selection repair owns those.
   if(!details.blocked && attempt<maxAttempts-1){
    await delay(Math.min(60000,15000*2**attempt));
    continue;
   }
   throw Object.assign(new Error('GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED'),{details});
  }
  const normalized=await normalizeTeachingPhoto(Buffer.from(image.data,'base64'),image.mimeType);
  if(region==='global')successfulCapacityAlternates.set(routeKey,requestModel);
  return {...normalized,provider:'google',model:requestModel};
  } catch(error) {
   if(courseProgressSignal()?.aborted)throw courseProgressSignal().reason;
   const transient=error?.name==='TimeoutError'||error?.name==='AbortError'||(error instanceof TypeError&&/fetch failed/i.test(error.message));
   if(!transient||attempt===maxAttempts-1)throw error;
   if(activeRegion==='global')requestModel=requestModel==='gemini-3.1-flash-image'?'gemini-3.1-flash-lite-image':'gemini-3.1-flash-image';
   await delay(Math.min(60000,15000*2**attempt));
  }
 }
 throw Error('GOOGLE_TEACHING_PHOTO_RETRY_EXHAUSTED');
}

