import {approvedReferencePhotoPicker} from './approved-reference-photos.mjs';
import {courseSelectedStill} from './selected-course-stills.mjs';
import {reportCourseProgress,courseProgressSignal} from '../worker/progress-watch.mjs';
import { selectReviewedTeachingPhoto } from './reviewed-photo-selection.mjs';
import { compatibleVisualTask } from '../instructional/reviewed-scene-evidence';
import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Private, reusable photographs tied to exact spoken teaching points.
 * These are illustrations, never evidence of a performed practical skill. */
export async function prepareTeachingPhotos(input: any, db: SupabaseClient) {
  if (input.lessonPresentation !== 'approved-premium-v1') return input;
  const scenes = input.artifacts?.storyboard?.storyboard?.scenes;
  if (!Array.isArray(scenes)) throw new Error('TEACHING_PHOTO_STORYBOARD_REQUIRED');
  const photos: Record<string, any[]> = {};
  const approvedReference=await approvedReferencePhotoPicker(input,db);
  let placedPhotos: any[] | undefined;
  const usedPhotoHashes=new Set<string>();
  const assignPhoto=(sceneId:string,photo:any)=>{
    if(!photo.sha256||usedPhotoHashes.has(photo.sha256))return false;
    usedPhotoHashes.add(photo.sha256);
    photos[sceneId].push(photo);
    return true;
  };

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
        try {
          const photo=await approvedReference(scene,index,step,index===requests.length-1);
          if(!assignPhoto(scene.id,{...photo,stepIndex:Math.min(index,steps.length-1),isRecap:index===requests.length-1}))throw new Error('COURSE_PHOTO_ALREADY_USED');
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
      const placed=placedPhotos.find((p:any)=>p.metadata?.source==='openai-generated-illustration' && p.metadata?.reviewedIllustration===true && p.metadata?.sceneId===scene.id && p.metadata?.cueIndex===index && p.metadata?.narrationQuote===step.narrationQuote && /^[a-f0-9]{64}$/i.test(p.metadata?.sha256??'') && String(p.storage_path).startsWith('approved-teaching-photos/'));
      if(placed){
        const downloaded=await db.storage.from('course_videos').download(placed.storage_path);
        if(downloaded.error||!downloaded.data) throw new Error('PLACED_TEACHING_PHOTO_READBACK_FAILED');
        const sha256=createHash('sha256').update(Buffer.from(await downloaded.data.arrayBuffer())).digest('hex');
        if(sha256!==placed.metadata.sha256) throw new Error('PLACED_TEACHING_PHOTO_HASH_MISMATCH');
        const signed=await db.storage.from('course_videos').createSignedUrl(placed.storage_path,3600);
        if(signed.error||!signed.data?.signedUrl) throw new Error('TEACHING_PHOTO_SIGNING_FAILED');
        if(!assignPhoto(scene.id,{imageUrl:signed.data.signedUrl,storagePath:placed.storage_path,sha256,narrationQuote:step.narrationQuote,stepIndex:Math.min(index,steps.length-1),isRecap:index===requests.length-1,illustration:true,provider:'openai'}))continue;
        reportCourseProgress('teaching-photos:'+scene.id,index+1,requests.length);
        continue;
      }
      const selected=await courseSelectedStill(input,db,scene,index,step);
      if(selected){
        if(!assignPhoto(scene.id,{...selected,stepIndex:Math.min(index,steps.length-1),isRecap:index===requests.length-1}))continue;
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
        if(!assignPhoto(scene.id,{imageUrl:signed.data.signedUrl,storagePath:licensed.storage_path,sha256,narrationQuote:step.narrationQuote,stepIndex:Math.min(index,steps.length-1),isRecap:index===requests.length-1,illustration:true,provider:licensed.provider,providerItemId:licensed.provider_item_id,licenseEvidenceUrl:licensed.license_evidence_url}))continue;
        reportCourseProgress('teaching-photos:'+scene.id,index+1,requests.length);
        continue;
      }
      // Storage-only express mode: never call a generative image provider.
      // Existing approved, selected and licensed assets above remain eligible.
      // Missing inventory is a distinct recoverable asset gap, not permission to
      // silently create a new picture or reuse a duplicate.
      throw new Error('COURSE_STORAGE_IMAGE_REQUIRED:'+scene.id+':cue-'+index);
    }
    if(new Set(photos[scene.id].map(p=>p.sha256)).size<2) throw new Error('TEACHING_PHOTOS_MUST_BE_DISTINCT');
  }
  return {...input,teachingPhotos:photos};
}

