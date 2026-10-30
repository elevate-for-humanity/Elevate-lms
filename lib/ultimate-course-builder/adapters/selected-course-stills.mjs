import {createHash} from 'node:crypto';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {courseProgressSignal} from '../worker/progress-watch.mjs';
const exec=promisify(execFile),sources=new Map(),catalogs=new WeakMap(),unusableSourceHashes=new Set();
export function selectedSourceDuration(probe) {
 const values=[probe?.format?.duration,...(Array.isArray(probe?.streams)?probe.streams.filter(stream=>stream.codec_type==='video').map(stream=>stream.duration):[])];
 for(const value of values){const seconds=Number(value);if(Number.isFinite(seconds)&&seconds>0)return seconds;}
 return null;
}

/** Photographs have no video duration. Their first decoded image is the
 * inspected source; only motion footage needs a duration-based seek. */
export function selectedStillPosition(probe,mimeType,sampleFraction) {
 if(String(mimeType??'').toLowerCase().startsWith('image/'))return 0;
 const duration=selectedSourceDuration(probe);
 return duration===null?null:duration*sampleFraction;
}

export function selectedStillBinding(rows,{courseId,lessonId,sceneId,cueIndex,narrationQuote}){
 for(const row of rows??[]){
  const e=Array.isArray(row.licensed_media_entitlements)?row.licensed_media_entitlements[0]:row.licensed_media_entitlements,m=e?.metadata,obs=m?.visual_observation;
  const choice=(Array.isArray(m?.teachingCueSelections)?m.teachingCueSelections:[]).find(c=>c.courseId===courseId&&c.lessonId===lessonId&&c.sceneId===sceneId&&c.cueIndex===cueIndex&&c.narrationQuote===narrationQuote);
  if(row.course_id!==courseId||!choice||choice.selectedSourceAssetId!==row.id||!row.storage_path||!e?.license_document_url&&!m?.license_evidence_url)continue;
  if(obs?.method!=='sampled-frame-inspection'||!Number.isFinite(Date.parse(obs.reviewedAt))||!Array.isArray(obs.visibleActions)||!obs.visibleActions.length||!obs.sampleFractions?.includes(choice.sampleFraction)||!/^[a-f0-9]{64}$/.test(obs.contentSha256??''))continue;
  return {row,entitlement:e,choice,sourceSha:obs.contentSha256};
 }return null;
}
export function relatedCourseStillBinding(rows,{courseId,lessonId,sceneId,cueIndex,narrationQuote},used=new Set()){
 const terms=new Set(String(narrationQuote).toLowerCase().match(/[a-z0-9]{3,}/g)??[]);
 const candidates=[];
 for(const row of rows??[]){
  const e=Array.isArray(row.licensed_media_entitlements)?row.licensed_media_entitlements[0]:row.licensed_media_entitlements,obs=e?.metadata?.visual_observation;
  if(row.course_id!==courseId||row.status!=='ready'||row.asset_role!=='source_broll'||!row.storage_path||!row.entitlement_id||(!e?.license_document_url&&!e?.metadata?.license_evidence_url))continue;
  if(obs?.method!=='sampled-frame-inspection'||!Number.isFinite(Date.parse(obs.reviewedAt))||!/^[a-f0-9]{64}$/.test(obs.contentSha256??''))continue;
  const actions=Array.isArray(obs.visibleActions)?obs.visibleActions.filter(a=>typeof a==='string'&&a.trim()):[];
  if(!actions.length)continue;
  const score=(actions.join(' ').toLowerCase().match(/[a-z0-9]{3,}/g)??[]).filter(word=>terms.has(word)).length;
  for(const fraction of Array.isArray(obs.sampleFractions)?obs.sampleFractions:[]){
   if(!Number.isFinite(fraction)||fraction<0||fraction>1||used.has(obs.contentSha256+':'+fraction))continue;
   candidates.push({row,entitlement:e,sourceSha:obs.contentSha256,score,choice:{courseId,lessonId,sceneId,cueIndex,narrationQuote,selectedSourceAssetId:row.id,sampleFraction:fraction}});
  }
 }
 return candidates.sort((a,b)=>b.score-a.score)[0]??null;
}
export async function courseSelectedStill(input,db,scene,cueIndex,step,{allowRelatedCoursePhoto=false,usedSelections=new Set()}={}){
 if(!input.courseId)return null;
 let catalog=catalogs.get(db);if(!catalog){catalog=new Map();catalogs.set(db,catalog);}
 let entry=catalog.get(input.courseId);
 if(!entry||Date.now()-entry.at>60000){entry={at:Date.now(),promise:db.from('course_videos').select('id,course_id,title,status,asset_role,storage_path,entitlement_id,licensed_media_entitlements(provider,provider_item_id,license_document_url,metadata)').eq('course_id',input.courseId).eq('status','ready').eq('asset_role','source_broll')};catalog.set(input.courseId,entry);}
 const {data,error}=await entry.promise;if(error)throw error;
 const context={courseId:input.courseId,lessonId:input.lessonId,sceneId:scene.id,cueIndex,narrationQuote:step.narrationQuote};
 const eligible=(data??[]).filter(row=>{
  const e=Array.isArray(row.licensed_media_entitlements)?row.licensed_media_entitlements[0]:row.licensed_media_entitlements;
  return !unusableSourceHashes.has(e?.metadata?.visual_observation?.contentSha256);
 });
 let bound=selectedStillBinding(eligible,context);
 if(bound&&usedSelections.has(bound.sourceSha+':'+bound.choice.sampleFraction))bound=null;
 if(!bound&&allowRelatedCoursePhoto)bound=relatedCourseStillBinding(eligible,context,usedSelections);
 if(!bound)return null;
 const {row,entitlement:e,choice,sourceSha}=bound;
 const path='selected-course-stills/'+input.lessonId+'/'+sourceSha+'-'+choice.sampleFraction+'.jpg';
 let {data:file}=await db.storage.from('course_videos').download(path);
 if(!file){
  if(!sources.has(sourceSha))sources.set(sourceSha,(async()=>{
   const download=await db.storage.from('course_videos').download(row.storage_path);
   if(download.error||!download.data)throw Error('SELECTED_COURSE_SOURCE_READ_FAILED:'+row.id);
   const bytes=Buffer.from(await download.data.arrayBuffer());
   if(createHash('sha256').update(bytes).digest('hex')!==sourceSha)throw Error('SELECTED_COURSE_SOURCE_HASH_MISMATCH:'+row.id);
   const sourcePath=join(tmpdir(),'selected-source-'+sourceSha+'.mp4');await writeFile(sourcePath,bytes);return sourcePath;
  })());
  let source;try{source=await sources.get(sourceSha);}catch(error){sources.delete(sourceSha);throw error;}
  const directory=await mkdtemp(join(tmpdir(),'selected-course-still-'));
  try{
   const probe=await exec('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,duration','-of','json',source],{timeout:30000,signal:courseProgressSignal()});
   const position=selectedStillPosition(JSON.parse(probe.stdout),e.metadata?.mime_type,choice.sampleFraction);
   if(position===null){
    unusableSourceHashes.add(sourceSha);
    console.warn('SELECTED_COURSE_SOURCE_DURATION_UNAVAILABLE',{sourceAssetId:row.id});
    // This optional stock frame is unusable. Continue the existing reviewed
    // photo/generated-photo path; never invent a duration or mark a frame ready.
    return null;
   }
   const output=join(directory,'still.jpg');
   await exec('ffmpeg',['-v','error','-ss',String(position),'-i',source,'-frames:v','1','-q:v','2',output],{timeout:60000,signal:courseProgressSignal()});
   const bytes=await readFile(output);
   const uploaded=await db.storage.from('course_videos').upload(path,bytes,{contentType:'image/jpeg',upsert:false});
   if(uploaded.error&&!/already exists|duplicate/i.test(uploaded.error.message))throw uploaded.error;
   const readback=await db.storage.from('course_videos').download(path);
   if(readback.error||!readback.data)throw Error('SELECTED_COURSE_STILL_READBACK_FAILED');
   file=readback.data;
   if(!Buffer.from(await file.arrayBuffer()).equals(bytes))throw Error('SELECTED_COURSE_STILL_READBACK_MISMATCH');
  }finally{await rm(directory,{recursive:true,force:true});}
 }
 const sha256=createHash('sha256').update(Buffer.from(await file.arrayBuffer())).digest('hex');
 const signed=await db.storage.from('course_videos').createSignedUrl(path,3600);
 if(signed.error||!signed.data?.signedUrl)throw Error('SELECTED_COURSE_STILL_SIGNING_FAILED');
 usedSelections.add(sourceSha+':'+choice.sampleFraction);
 return {imageUrl:signed.data.signedUrl,storagePath:path,sha256,narrationQuote:step.narrationQuote,illustration:true,provider:e.provider,providerItemId:e.provider_item_id,licenseEvidenceUrl:e.license_document_url??e.metadata.license_evidence_url,selectedSourceAssetId:row.id,selectedSourceSha256:sourceSha,sampleFraction:choice.sampleFraction};
}
