import {createHash} from 'node:crypto';
import {ULTIMATE_TEACHING_SEQUENCE} from '../instructional/teaching-sequence.ts';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const stage=scene=>{
 const numbered=Number(String(scene.id).match(/(?:^|:)seg[_-](\d+)(?:[_-]|$)/)?.[1]);
 if(scene.stage===undefined)return numbered;
 const named=ULTIMATE_TEACHING_SEQUENCE.indexOf(scene.stage)+1;
 return !named||(Number.isInteger(numbered)&&numbered!==named)?NaN:named;
};

/** Reuse the actual photographs of the owner's already-published SAME lesson.
 * A presentation reference for another lesson never authorizes arbitrary image
 * substitution. This path cannot certify a physical practical demonstration. */
export async function approvedReferencePhotoPicker(input,db,{storageOrigin=process.env.NEXT_PUBLIC_SUPABASE_URL}={}){
 const ref=input.presentationContract?.approvedReferenceVideo;
 if(input.requiresPhysicalDemonstration||!ref?.permittedUses?.includes('presentation-reference')||
    typeof ref.storagePath!=='string'||!ref.storagePath.startsWith('generated-lessons/lesson-'+input.lessonId+'-'))return null;
 const base=storageOrigin?.replace(/\/$/,'');
 if(!base||!ref.assetId||!/^[a-f0-9]{64}$/i.test(ref.sha256??''))throw Error('OWNER_REFERENCE_IDENTITY_REQUIRED');
 const {data:lesson,error:lessonError}=await db.from('course_lessons').select('id,approved,is_published,video_url').eq('id',input.lessonId).single();
 if(lessonError||!lesson?.approved||!lesson.is_published)throw Error('OWNER_REFERENCE_PUBLISHED_APPROVAL_REQUIRED');
 let video;try{video=new URL(lesson.video_url);}catch{throw Error('OWNER_REFERENCE_VIDEO_REQUIRED');}
 const match=video.pathname.match(/^\/storage\/v1\/object\/public\/(course-videos|course_videos)\/(.+)$/);
 if(video.origin!==base||!match||decodeURIComponent(match[2])!==ref.storagePath||
    !ref.storagePath.startsWith('generated-lessons/lesson-'+input.lessonId+'-'))return null;
 const {data:version,error:versionError}=await db.from('ultimate_artifact_versions').select('id,content').eq('id',ref.assetId).single();
 const render=version?.content?.render,scenes=render?.sceneData?.scenes;
 if(versionError||!render?.success||render.videoUrl!==lesson.video_url||!Array.isArray(scenes)||scenes.length!==13)
  throw Error('OWNER_REFERENCE_IMMUTABLE_ARTIFACT_REQUIRED');
 // A presentation reference is not evidence for newly authored spoken cues.
 // If its photographs do not cover the current narration exactly, let the
 // normal cue-matched, licensed/generated illustration pipeline do its work.
 const current=input.artifacts?.storyboard?.storyboard?.scenes;
 if(Array.isArray(current))for(const scene of current){
  const number=stage(scene),matches=scenes.filter(s=>stage(s)===number&&Number(s.order)===number);
  if(matches.length!==1)return null;
  const steps=scene.teachingVisual?.steps;
  if(!steps?.length||!scene.recapText?.trim())return null;
  const requests=steps.length===1?[steps[0],steps[0]]:[...steps];
  const pictures=(matches[0].pictureCues??[]).filter(p=>!p.isRecap),recap=(matches[0].pictureCues??[]).find(p=>p.isRecap);
  const normalize=value=>String(value??'').trim().replace(/\s+/g,' ').toLowerCase();
  // Missing, malformed, or mismatched reference photos must fall back to the\n  // normal cue-matched media pipeline, rather than repeatedly fail rendering.\n  const complete=p=>p && /^[a-f0-9]{64}$/i.test(String(p.sha256??'')) && typeof p.imageUrl==='string' && p.imageUrl.length>0;\n  if(requests.some((step,index)=>!complete(pictures[index])||!normalize(step.narrationQuote)||normalize(step.narrationQuote)!==normalize(pictures[index].narrationQuote))||\n     !complete(recap)||normalize(scene.recapText)!==normalize(recap.narrationQuote))return null;
 }
 const original=await db.storage.from(match[1]).download(ref.storagePath);
 if(original.error||!original.data||hash(Buffer.from(await original.data.arrayBuffer()))!==ref.sha256)
  throw Error('OWNER_REFERENCE_FILM_HASH_MISMATCH');
 return async(scene,index,step,isRecap)=>{
  const number=stage(scene),matches=scenes.filter(s=>stage(s)===number&&Number(s.order)===number),source=matches[0];
  if(!Number.isInteger(number)||number<1||number>13||matches.length!==1)throw Error('OWNER_REFERENCE_STAGE_REQUIRED');
  const pictures=(source.pictureCues??[]).filter(p=>Boolean(p.isRecap)===isRecap);
  const picture=isRecap?pictures[0]:pictures[index];
  if(!picture||!step.narrationQuote?.trim()||!/^[a-f0-9]{64}$/i.test(picture.sha256??''))throw Error('OWNER_REFERENCE_PICTURE_REQUIRED');
  let url;try{url=new URL(picture.imageUrl);}catch{throw Error('OWNER_REFERENCE_IMAGE_ORIGIN_REQUIRED');}
  const prefix='/storage/v1/object/sign/course_videos/';
  if(url.origin!==base||!url.pathname.startsWith(prefix))throw Error('OWNER_REFERENCE_IMAGE_ORIGIN_REQUIRED');
  const storagePath=decodeURIComponent(url.pathname.slice(prefix.length));
  if(!/^(approved-teaching-photos|selected-course-stills)\//.test(storagePath)||storagePath.split('/').some(p=>p==='..'||p==='.')||[...storagePath].some(c=>c==='\\'||c.charCodeAt(0)<32))
   throw Error('OWNER_REFERENCE_IMAGE_PATH_REQUIRED');
  const downloaded=await db.storage.from('course_videos').download(storagePath);
  if(downloaded.error||!downloaded.data||hash(Buffer.from(await downloaded.data.arrayBuffer()))!==picture.sha256)
   throw Error('OWNER_REFERENCE_PHOTO_HASH_MISMATCH');
  const signed=await db.storage.from('course_videos').createSignedUrl(storagePath,3600);
  if(signed.error||!signed.data?.signedUrl)throw Error('OWNER_REFERENCE_PHOTO_SIGNING_FAILED');
  return {imageUrl:signed.data.signedUrl,storagePath,sha256:picture.sha256,narrationQuote:step.narrationQuote,
   illustration:true,provider:picture.provider??'owner-approved-reference',providerItemId:picture.providerItemId,
   licenseEvidenceUrl:picture.licenseEvidenceUrl,ownerReferenceArtifactId:ref.assetId,ownerReferenceVideoSha256:ref.sha256,
   referenceSceneId:source.id,referenceNarrationQuote:picture.narrationQuote};
 };
}
