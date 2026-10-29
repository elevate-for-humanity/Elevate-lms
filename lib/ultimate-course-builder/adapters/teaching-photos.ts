import {approvedReferencePhotoPicker} from './approved-reference-photos.mjs';
import {courseSelectedStill} from './selected-course-stills.mjs';
import {recoverTeachingPhoto} from './photo-repair.mjs';
import {generateTeachingPhoto} from './google-teaching-photo.mjs';
import {reportCourseProgress,courseProgressSignal} from '../worker/progress-watch.mjs';
import { selectReviewedTeachingPhoto } from './reviewed-photo-selection.mjs';
import { compatibleVisualTask } from '../instructional/reviewed-scene-evidence';
import { conceptualTeachingCard } from './conceptual-teaching-card.mjs';
import { createHash } from 'node:crypto';
import { describeWorkerError, optionalStorageCacheMiss } from '../core/worker-error.mjs';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Private, reusable photographs tied to exact spoken teaching points.
 * These are illustrations, never evidence of a performed practical skill. */
export async function prepareTeachingPhotos(input: any, db: SupabaseClient) {
  const premium = input.lessonPresentation === 'approved-premium-v1';
  const requestedScenes = new Set<string>((input.artifacts?.visual_assignment?.media?.assignments ?? [])
    .filter((assignment: {requestedInstructionalVisual?: boolean; assignmentMethod?: string}) =>
      assignment.requestedInstructionalVisual === true && assignment.assignmentMethod === 'instructional-visual-request')
    .map((assignment: {sceneId: string}) => assignment.sceneId));
  // Shared conceptual scene requests need real persisted image bytes too.
  // Existing licensed assignments and physical-skill acceptance stay unchanged.
  if (!premium && requestedScenes.size === 0) return input;
  const scenes = input.artifacts?.storyboard?.storyboard?.scenes;
  if (!Array.isArray(scenes)) throw new Error('TEACHING_PHOTO_STORYBOARD_REQUIRED');
  const photos: Record<string, any[]> = {};
  const approvedReference=premium ? await approvedReferencePhotoPicker(input,db) : null;
  let placedPhotos: any[] | undefined;
  const usedPhotoHashes=new Set<string>();
  const usedSelections=new Set<string>();
  const assignPhoto=(sceneId:string,photo:any)=>{
    if(!photo.sha256||usedPhotoHashes.has(photo.sha256))return false;
    usedPhotoHashes.add(photo.sha256);
    photos[sceneId].push(photo);
    return true;
  };

  for (const scene of scenes) {
    if (!premium && !requestedScenes.has(scene.id)) continue;
    const steps = scene.teachingVisual?.steps;
    if (!steps?.length) throw new Error('TEACHING_PHOTO_SCRIPT_CUES_REQUIRED');
    const requests = steps.length === 1 ? [
      {...steps[0], view:'full workstation view'}, {...steps[0], view:'close detail view with complete hands and tools'},
    ] : steps.map((step: any) => ({...step,view:'complete action view'}));
    if(premium && !scene.recapText?.trim()) throw new Error('TEACHING_MOMENT_RECAP_REQUIRED');
    const recapIndex = scene.recapText?.trim() ? requests.length : -1;
    if (recapIndex !== -1) requests.push({label:'Recap',value:scene.recapText,narrationQuote:scene.recapText,view:'fresh summary illustration'});
    photos[scene.id] = [];
    for (const [index, step] of requests.entries()) {
     try {
      courseProgressSignal()?.throwIfAborted();
      if(approvedReference){
        try {
          const photo=await approvedReference(scene,index,step,index===recapIndex);
          if(!assignPhoto(scene.id,{...photo,stepIndex:Math.min(index,steps.length-1),isRecap:index===recapIndex}))throw new Error('COURSE_PHOTO_ALREADY_USED');
          reportCourseProgress('teaching-photos:'+scene.id,index+1,requests.length);
          continue;
        } catch(error) {
          // A previous approved lesson may not contain the current scene or
          // picture cue. Reuse an eligible saved/selected/licensed asset instead.
          // Storage hashes, auth, provenance and licensing failures still fail.
          if(!/^OWNER_REFERENCE_(?:STAGE|PICTURE)_REQUIRED$/.test(String((error as Error)?.message))) throw error;
        }
      }
      if (!placedPhotos) {
        const {data,error}=await db.from('media_assets').select('id,storage_path,metadata').eq('lesson_id',input.lessonId).eq('asset_type','image').eq('storage_bucket','course_videos').eq('status','active');
        if(error) throw error;
        placedPhotos=data ?? [];
      }
      const eligiblePlaced=placedPhotos.filter(p=>p.metadata?.source==='openai-generated-illustration' && p.metadata?.reviewedIllustration===true && /^[a-f0-9]{64}$/i.test(p.metadata?.sha256??'') && !usedPhotoHashes.has(p.metadata.sha256) && String(p.storage_path).startsWith('approved-teaching-photos/'));
      const placed=eligiblePlaced.find(p=>p.metadata.sceneId===scene.id && p.metadata.cueIndex===index && p.metadata.narrationQuote===step.narrationQuote)
        ?? eligiblePlaced.find(p=>p.metadata.sceneId===scene.id) ?? eligiblePlaced[0];
      if(placed){
        const downloaded=await db.storage.from('course_videos').download(placed.storage_path);
        if(downloaded.error||!downloaded.data) throw new Error('PLACED_TEACHING_PHOTO_READBACK_FAILED');
        const sha256=createHash('sha256').update(Buffer.from(await downloaded.data.arrayBuffer())).digest('hex');
        if(sha256!==placed.metadata.sha256) throw new Error('PLACED_TEACHING_PHOTO_HASH_MISMATCH');
        const signed=await db.storage.from('course_videos').createSignedUrl(placed.storage_path,3600);
        if(signed.error||!signed.data?.signedUrl) throw new Error('TEACHING_PHOTO_SIGNING_FAILED');
        if(!assignPhoto(scene.id,{imageUrl:signed.data.signedUrl,storagePath:placed.storage_path,sha256,narrationQuote:step.narrationQuote,stepIndex:Math.min(index,steps.length-1),isRecap:index===recapIndex,illustration:true,provider:'openai'}))throw new Error('COURSE_PHOTO_ALREADY_USED');
        reportCourseProgress('teaching-photos:'+scene.id,index+1,requests.length);
        continue;
      }
      const selected=await courseSelectedStill(input,db,scene,index,step,{allowRelatedCoursePhoto:true,usedSelections});
      if(selected){
        if(!assignPhoto(scene.id,{...selected,stepIndex:Math.min(index,steps.length-1),isRecap:index===recapIndex}))throw new Error('COURSE_PHOTO_ALREADY_USED');
        reportCourseProgress('teaching-photos:'+scene.id,index+1,requests.length);
        continue;
      }
      const licensed = selectReviewedTeachingPhoto(input.artifacts?.visual_assignment?.media?.readyAssets ?? [], step.narrationQuote, usedPhotoHashes, compatibleVisualTask, {allowRelatedCoursePhoto:true});
      if (licensed) {
        const downloaded = await db.storage.from('course_videos').download(licensed.storage_path);
        if(downloaded.error || !downloaded.data) throw new Error('LICENSED_TEACHING_PHOTO_READBACK_FAILED');
        const sha256=createHash('sha256').update(Buffer.from(await downloaded.data.arrayBuffer())).digest('hex');
        if(sha256!==licensed.content_sha256) throw new Error('LICENSED_TEACHING_PHOTO_HASH_MISMATCH');
        const signed=await db.storage.from('course_videos').createSignedUrl(licensed.storage_path,3600);
        if(signed.error || !signed.data?.signedUrl) throw new Error('TEACHING_PHOTO_SIGNING_FAILED');
        if(!assignPhoto(scene.id,{imageUrl:signed.data.signedUrl,storagePath:licensed.storage_path,sha256,narrationQuote:step.narrationQuote,stepIndex:Math.min(index,steps.length-1),isRecap:index===recapIndex,illustration:true,provider:licensed.provider,providerItemId:licensed.provider_item_id,licenseEvidenceUrl:licensed.license_evidence_url}))continue;
        reportCourseProgress('teaching-photos:'+scene.id,index+1,requests.length);
        continue;
      }
      const prompt = [
        'Generate a camera-realistic professional training photograph with natural skin texture, lifelike materials and photographic lighting. No cartoons, anime, drawings, vector art, clip art or 3D-rendered characters.',
        'This synthetic photograph is an educational illustration, not evidence of a performed practical procedure.',
        'Show complete hands, tools and relevant subject, uncropped, no printed text, no logos, no invented measurements.',
        'Use a realistic professional training setting. No unsafe actions or invented numbered guards.',
        String(input.courseTitle), String(scene.visualRequirement), String(step.narrationQuote), step.view,
      ].join('\n');
      // Keep content-addressed images while recording a durable cue-to-image
      // index. A resumed worker must reuse the saved asset before paid inference.
      const requestHash=createHash('sha256').update(JSON.stringify({
        version:'storage-first-photo-cues-v3',lesson:input.lessonId,scene:scene.id,index,prompt,
      })).digest('hex');
      const legacyRequestHash=createHash('sha256').update(JSON.stringify({
        version:'approved-picture-cues-photos-v2',lesson:input.lessonId,scene:scene.id,index,prompt,
      })).digest('hex');
      const indexPath='approved-teaching-photo-index/'+requestHash+'.json';
      const bucket=db.storage.from('course_videos');
      const cached=await bucket.download(indexPath);
      if(cached.error && !optionalStorageCacheMiss(cached.error)) throw cached.error;
      let saved:any;
      if(cached.data){
        try{saved=JSON.parse(await cached.data.text());}catch{throw new Error('TEACHING_PHOTO_INDEX_INVALID');}
        if(!/^[a-f0-9]{64}$/.test(saved.sha256??'') ||
          !new RegExp('^approved-teaching-photos/(?:'+saved.sha256+'|'+legacyRequestHash+')\\.(png|jpg|webp)$').test(saved.storagePath??''))
          throw new Error('TEACHING_PHOTO_INDEX_INVALID');
      }
      if(!saved){
        // Keep previously generated v2 cue assets reachable without new inference.
        const variants=await Promise.all(['png','jpg','webp'].map(async extension=>{
          const path='approved-teaching-photos/'+legacyRequestHash+'.'+extension;
          const result=await bucket.download(path);
          if(result.error && !optionalStorageCacheMiss(result.error)) throw result.error;
          return {path,data:result.data};
        }));
        const hit=variants.find(variant=>variant.data);
        if(hit?.data) saved={storagePath:hit.path,sha256:createHash('sha256')
          .update(Buffer.from(await hit.data.arrayBuffer())).digest('hex')};
      }
      if(!saved){
        // A missing photograph is not a course blocker. Conceptual scenes use
        // a deterministic, clearly labelled instructional visual. Licensed
        // photographs and inspected course stills above remain preferred, and
        // practical scenes still require real observable footage separately.
        const generated=await conceptualTeachingCard({scene,step,courseTitle:input.courseTitle,index,supplemental:true}) ??
          await recoverTeachingPhoto({primaryPrompt:prompt,courseTitle:input.courseTitle,scene,step,index,generate:generateTeachingPhoto,
          persistFailure:async(detail:any)=>{
            const result=await bucket.upload('approved-teaching-photo-diagnostics/'+input.lessonId+'/'+requestHash+'.json',
              Buffer.from(JSON.stringify({...detail,at:new Date().toISOString()})),{contentType:'application/json',upsert:true});
            if(result.error)throw new Error('TEACHING_PHOTO_DIAGNOSTIC_SAVE_FAILED:'+scene.id);
          }});
        if(!generated?.bytes || !Buffer.isBuffer(generated.bytes) || !generated.bytes.length)throw new Error('TEACHING_PHOTO_BYTES_REQUIRED');
        const sha256=createHash('sha256').update(generated.bytes).digest('hex');
        if(usedPhotoHashes.has(sha256))throw new Error('COURSE_PHOTO_ALREADY_USED');
        const mimeType=generated.mimeType;
        if(!['image/png','image/jpeg','image/webp'].includes(mimeType))throw new Error('TEACHING_PHOTO_MIME_INVALID');
        const extension=mimeType==='image/jpeg'?'jpg':mimeType==='image/webp'?'webp':'png';
        saved={storagePath:'approved-teaching-photos/'+sha256+'.'+extension,sha256,repair:generated.repair,
          provider:generated.repair?.method==='lesson-conceptual-card-v1'?'elevate-instructional':generated.provider};
        const uploaded=await bucket.upload(saved.storagePath,generated.bytes,{contentType:mimeType,upsert:false});
        if(uploaded.error&&!/already exists|duplicate/i.test(uploaded.error.message))throw uploaded.error;
      }
      const {storagePath,sha256}=saved;
      const downloaded=await bucket.download(storagePath);
      if(downloaded.error||!downloaded.data)throw new Error('TEACHING_PHOTO_READBACK_FAILED');
      const verified=createHash('sha256').update(Buffer.from(await downloaded.data.arrayBuffer())).digest('hex');
      if(verified!==sha256)throw new Error('TEACHING_PHOTO_HASH_MISMATCH');
      if(!cached.data){
        if(saved.repair){
          const proof=await bucket.upload('approved-teaching-photo-diagnostics/'+input.lessonId+'/'+requestHash+'.json',
            Buffer.from(JSON.stringify({status:'ready',sceneId:scene.id,cueIndex:index,narrationQuote:step.narrationQuote,
              storagePath,sha256,repair:saved.repair,verifiedAt:new Date().toISOString()})),{contentType:'application/json',upsert:true});
          if(proof.error)throw new Error('TEACHING_PHOTO_REPAIR_PROOF_SAVE_FAILED:'+scene.id);
        }
        const indexed=await bucket.upload(indexPath,Buffer.from(JSON.stringify(saved)),{contentType:'application/json',upsert:true});
        if(indexed.error)throw new Error('TEACHING_PHOTO_INDEX_SAVE_FAILED');
      }
      const signed=await bucket.createSignedUrl(storagePath,3600);
      if(signed.error||!signed.data?.signedUrl)throw new Error('TEACHING_PHOTO_SIGNING_FAILED');
      if(!assignPhoto(scene.id,{imageUrl:signed.data.signedUrl,storagePath,sha256,narrationQuote:step.narrationQuote,
        stepIndex:Math.min(index,steps.length-1),isRecap:index===recapIndex,illustration:true,
        provider:saved.provider??(saved.repair?.method==='lesson-conceptual-card-v1'?'elevate-instructional':'google-generated'),repair:saved.repair}))
        throw new Error('COURSE_PHOTO_ALREADY_USED');
      reportCourseProgress('teaching-photos:'+scene.id,index+1,requests.length);
     } catch (error) {
       const detail = describeWorkerError(error);
       const code = detail.match(/^[A-Z][A-Z0-9_]+(?=:|$)/)?.[0] ?? 'TEACHING_PHOTO_PREPARATION_FAILED';
       throw new Error(code+':scene='+scene.id+':cue='+index+':'+detail, {cause:error});
     }
    }
    if(new Set(photos[scene.id].map(p=>p.sha256)).size<2) throw new Error('TEACHING_PHOTOS_MUST_BE_DISTINCT');
  }
  return {...input,teachingPhotos:photos};
}

