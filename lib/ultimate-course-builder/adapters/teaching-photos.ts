import {approvedReferencePhotoPicker} from './approved-reference-photos.mjs';
import {courseSelectedStill} from './selected-course-stills.mjs';
import {recoverTeachingPhoto} from './photo-repair.mjs';
import {conceptualTeachingCard} from './conceptual-teaching-card.mjs';
import {reportCourseProgress,courseProgressSignal} from '../worker/progress-watch.mjs';
import { selectReviewedTeachingPhoto } from './reviewed-photo-selection.mjs';
import { compatibleVisualTask } from '../instructional/reviewed-scene-evidence';
import { createHash } from 'node:crypto';
import { generateTeachingPhoto } from './google-teaching-photo.mjs';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Private, reusable photographs tied to exact spoken teaching points.
 * These are illustrations, never evidence of a performed practical skill. */
export async function prepareTeachingPhotos(input: any, db: SupabaseClient) {
  if (input.lessonPresentation !== 'approved-premium-v1') return input;
  const scenes = input.artifacts?.storyboard?.storyboard?.scenes;
  if (!Array.isArray(scenes)) throw new Error('TEACHING_PHOTO_STORYBOARD_REQUIRED');
  const photos: Record<string, any[]> = {};
  const approvedReference=await approvedReferencePhotoPicker(input,db);
  const {data:placedPhotos,error:placementError}=approvedReference?{data:[],error:null}:await db.from('media_assets').select('id,storage_path,metadata').eq('lesson_id',input.lessonId).eq('asset_type','image').eq('storage_bucket','course_videos').eq('status','active');
  if(placementError) throw placementError;

  for (const scene of scenes) {
    const steps = scene.teachingVisual?.steps;
    if (!steps?.length) throw new Error('TEACHING_PHOTO_SCRIPT_CUES_REQUIRED');
    const requests = steps.length === 1 ? [
      {...steps[0], view:'full workstation view'}, {...steps[0], view:'close detail view with complete hands and tools'},
    ] : steps.map((step: any) => ({...step,view:'complete action view'}));
    if(!scene.recapText?.trim()) throw new Error('TEACHING_MOMENT_RECAP_REQUIRED');
    requests.push({label:'Recap',value:scene.recapText,narrationQuote:scene.recapText,view:'fresh summary illustration'});
    photos[scene.id] = [];
    const usedLicensedPhotos = new Set<string>();
    for (const [index, step] of requests.entries()) {
      courseProgressSignal()?.throwIfAborted();
      if(approvedReference){
        const photo=await approvedReference(scene,index,step,index===requests.length-1);
        photos[scene.id].push({...photo,stepIndex:Math.min(index,steps.length-1),isRecap:index===requests.length-1});
        reportCourseProgress('teaching-photos:'+scene.id,index+1,requests.length);
        continue;
      }
      const placed=placedPhotos?.find((p:any)=>p.metadata?.source==='openai-generated-illustration' && p.metadata?.reviewedIllustration===true && p.metadata?.sceneId===scene.id && p.metadata?.cueIndex===index && p.metadata?.narrationQuote===step.narrationQuote && /^[a-f0-9]{64}$/i.test(p.metadata?.sha256??'') && String(p.storage_path).startsWith('approved-teaching-photos/'));
      if(placed){
        const downloaded=await db.storage.from('course_videos').download(placed.storage_path);
        if(downloaded.error||!downloaded.data) throw new Error('PLACED_TEACHING_PHOTO_READBACK_FAILED');
        const sha256=createHash('sha256').update(Buffer.from(await downloaded.data.arrayBuffer())).digest('hex');
        if(sha256!==placed.metadata.sha256) throw new Error('PLACED_TEACHING_PHOTO_HASH_MISMATCH');
        const signed=await db.storage.from('course_videos').createSignedUrl(placed.storage_path,3600);
        if(signed.error||!signed.data?.signedUrl) throw new Error('TEACHING_PHOTO_SIGNING_FAILED');
        photos[scene.id].push({imageUrl:signed.data.signedUrl,storagePath:placed.storage_path,sha256,narrationQuote:step.narrationQuote,stepIndex:Math.min(index,steps.length-1),isRecap:index===requests.length-1,illustration:true,provider:'openai'});
        reportCourseProgress('teaching-photos:'+scene.id,index+1,requests.length);
        continue;
      }
      const selected=await courseSelectedStill(input,db,scene,index,step);
      if(selected){
        photos[scene.id].push({...selected,stepIndex:Math.min(index,steps.length-1),isRecap:index===requests.length-1});
        reportCourseProgress('teaching-photos:'+scene.id,index+1,requests.length);
        continue;
      }
      const licensed = selectReviewedTeachingPhoto(input.artifacts?.visual_assignment?.media?.readyAssets ?? [], step.narrationQuote, usedLicensedPhotos, compatibleVisualTask);
      if (licensed) {
        const downloaded = await db.storage.from('course_videos').download(licensed.storage_path);
        if(downloaded.error || !downloaded.data) throw new Error('LICENSED_TEACHING_PHOTO_READBACK_FAILED');
        const sha256=createHash('sha256').update(Buffer.from(await downloaded.data.arrayBuffer())).digest('hex');
        if(sha256!==licensed.content_sha256) throw new Error('LICENSED_TEACHING_PHOTO_HASH_MISMATCH');
        const signed=await db.storage.from('course_videos').createSignedUrl(licensed.storage_path,3600);
        if(signed.error || !signed.data?.signedUrl) throw new Error('TEACHING_PHOTO_SIGNING_FAILED');
        usedLicensedPhotos.add(sha256);
        photos[scene.id].push({imageUrl:signed.data.signedUrl,storagePath:licensed.storage_path,sha256,narrationQuote:step.narrationQuote,stepIndex:Math.min(index,steps.length-1),isRecap:index===requests.length-1,illustration:true,provider:licensed.provider,providerItemId:licensed.provider_item_id,licenseEvidenceUrl:licensed.license_evidence_url});
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
      const requestHash = createHash('sha256').update(JSON.stringify({version:'approved-picture-cues-v1',lesson:input.lessonId,scene:scene.id,index,prompt})).digest('hex');
      let storagePath = 'approved-teaching-photos/'+requestHash+'.png';
      let {data:file} = await db.storage.from('course_videos').download(storagePath);
      if(!file) {
        // Independent cache probes can run together; preserve JPG-before-WebP
        // selection and the existing checksum/readback validation.
        const variants=await Promise.all(['jpg','webp'].map(async extension=>{
          const path='approved-teaching-photos/'+requestHash+'.'+extension;
          const cached=await db.storage.from('course_videos').download(path);
          return {path,data:cached.data};
        }));
        const hit=variants.find(variant=>variant.data);
        if(hit){file=hit.data;storagePath=hit.path;}
      }
      let repairProof:any;
      if (!file) {
        const generated = await recoverTeachingPhoto({primaryPrompt:prompt,courseTitle:input.courseTitle,scene,step,index,generate:generateTeachingPhoto,selectedReplacement:async()=>conceptualTeachingCard({scene,step,courseTitle:input.courseTitle,index}),persistFailure:async(detail:any)=>{
          const diagnosticPath='approved-teaching-photo-diagnostics/'+input.lessonId+'/'+requestHash+'.json';
          const {error}=await db.storage.from('course_videos').upload(diagnosticPath,Buffer.from(JSON.stringify({...detail,at:new Date().toISOString()})),{contentType:'application/json',upsert:true});
          if(error)throw Error('TEACHING_PHOTO_DIAGNOSTIC_SAVE_FAILED:'+scene.id);
        }});
        repairProof=generated.repair;
        const bytes = generated.bytes;
        const mimeType=generated.mimeType;
        const extension=mimeType==='image/jpeg'?'jpg':mimeType==='image/webp'?'webp':'png';
        storagePath='approved-teaching-photos/'+requestHash+'.'+extension;
        const {error} = await db.storage.from('course_videos').upload(storagePath,bytes,{contentType:mimeType,upsert:false});
        if(error && !/already exists|duplicate/i.test(error.message)) throw error;
        const downloaded=await db.storage.from('course_videos').download(storagePath);
        if(downloaded.error||!downloaded.data) throw new Error('TEACHING_PHOTO_READBACK_FAILED');
        file=downloaded.data;
      }
      const sha256=createHash('sha256').update(Buffer.from(await file.arrayBuffer())).digest('hex');
      if(repairProof){
        const {error:proofError}=await db.storage.from('course_videos').upload('approved-teaching-photo-diagnostics/'+input.lessonId+'/'+requestHash+'.json',Buffer.from(JSON.stringify({status:'ready',sceneId:scene.id,cueIndex:index,narrationQuote:step.narrationQuote,storagePath,sha256,repair:repairProof,verifiedAt:new Date().toISOString()})),{contentType:'application/json',upsert:true});
        if(proofError)throw Error('TEACHING_PHOTO_REPAIR_PROOF_SAVE_FAILED:'+scene.id);
      }
      const signed=await db.storage.from('course_videos').createSignedUrl(storagePath,3600);
      if(signed.error||!signed.data?.signedUrl) throw new Error('TEACHING_PHOTO_SIGNING_FAILED');
      photos[scene.id].push({imageUrl:signed.data.signedUrl,storagePath,sha256,narrationQuote:step.narrationQuote,stepIndex:steps.indexOf(step)>=0?steps.indexOf(step):Math.min(index,steps.length-1),isRecap:index===requests.length-1,illustration:true});
      reportCourseProgress('teaching-photos:'+scene.id,index+1,requests.length);
    }
    if(new Set(photos[scene.id].map(p=>p.sha256)).size<2) throw new Error('TEACHING_PHOTOS_MUST_BE_DISTINCT');
  }
  return {...input,teachingPhotos:photos};
}

