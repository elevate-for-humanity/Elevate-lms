import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {measuredCaptions} from './repair-preserved-cosmetology-captions.mjs';
import {ASSETS,SOURCE_SHA,validateAsset} from './repair-preserved-cosmetology-motion.mjs';
const run=promisify(execFile);
const ORIGIN='https://cuxzzpsyufcewtmicszk.supabase.co';
const COURSE='a6b0b712-1cf0-475a-ba79-ee2023dea8ec',LESSON='0811f5b7-eeff-428e-bad1-bfa78a791998';
export const sha=b=>createHash('sha256').update(b).digest('hex');
export function stable(value){return JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);}
export function validateReview(review,report,speech,lesson){
 if(review.sourceMediaSha256!==SOURCE_SHA||!/^([a-f0-9]{64})$/.test(review.candidateMediaSha256||'')||!/^([a-f0-9]{64})$/.test(review.audioSha256||''))throw Error('REVIEWED_HASHES_REQUIRED');
 if(review.courseId!==COURSE||review.lessonId!==LESSON||review.pass!==true||review.learnerPlaybackVerified!==false||review.reviewMode!=='measured-bounded-manual-repair')throw Error('EXACT_MEASURED_REVIEW_REQUIRED');
 if(review.candidateMediaSha256!==report.candidateMediaSha256||review.sourceMediaSha256!==report.sourceMediaSha256||speech.mediaSha256!==review.sourceMediaSha256||!report.identicalNarrationBytes||report.originalAudioSha!==report.candidateAudioSha)throw Error('EXACT_RECORDING_AND_CANDIDATE_REQUIRED');
 if(lesson.id!==LESSON||lesson.course_id!==COURSE||lesson.status!=='published'||lesson.is_published!==true||lesson.video_status!=='complete'||lesson.media_quality_status!=='unverified'||lesson.video_url!==review.sourceUrl||lesson.content_json?.film?.url!==review.sourceUrl||lesson.content_json?.manualProduction!==true)throw Error('UNCHANGED_PUBLISHED_MANUAL_LESSON_REQUIRED');
 if(sha(stable(lesson.quiz_questions))!==review.assessmentSha256||sha(stable(lesson.learning_objectives))!==review.objectivesSha256||sha(lesson.script_text)!==review.canonicalScriptSha256)throw Error('UNCHANGED_INSTRUCTION_AND_ASSESSMENTS_REQUIRED');
 return true;
}
async function audioSha(file){return sha((await run('ffmpeg',['-v','error','-i',file,'-map','0:a:0','-c:a','copy','-f','adts','pipe:1'],{encoding:'buffer',timeout:120000,maxBuffer:32*1024*1024})).stdout);}
export async function main(){
 const dir=resolve(process.env.AUDIT_OUTPUT_DIR||'reviewed-repair'),review=JSON.parse(await readFile('scripts/gcp/reviewed-cosmetology-repair.json','utf8'));
 const report=JSON.parse(await readFile(dir+'/motion-repair-evidence.json','utf8')),speech=JSON.parse(await readFile(dir+'/narration-evidence.json','utf8'));
 const file=dir+'/motion-repair-candidate.mp4',candidate=await readFile(file);
 if(sha(candidate)!==review.candidateMediaSha256)throw Error('REVIEWED_CANDIDATE_HASH_REQUIRED');
 const token=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!token)throw Error('DATABASE_AUTH_REQUIRED');
 const headers={apikey:token,Authorization:'Bearer '+token};
 async function request(path,options={}){
 const response=await fetch(ORIGIN+path,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(120000)});
 if(!response.ok)throw Error('REVIEWED_REPAIR_HTTP_'+response.status);
 return response;
 }
 async function signedBytes(key){
 const signed=await (await request('/storage/v1/object/sign/course_videos/'+key,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expiresIn:900})})).json();
 if(!signed.signedURL?.startsWith('/object/sign/course_videos/'+key+'?'))throw Error('EXACT_SIGNED_OBJECT_REQUIRED');
 return Buffer.from(await (await request('/storage/v1'+signed.signedURL)).arrayBuffer());
 }
 const endpoint='/rest/v1/course_lessons?id=eq.'+LESSON+'&course_id=eq.'+COURSE;
 const lesson=(await (await request(endpoint+'&select=id,course_id,status,is_published,video_status,media_quality_status,video_url,content_json,quiz_questions,learning_objectives,script_text,media_quality_evidence,updated_at')).json())[0];
 validateReview(review,report,speech,lesson);
 const sourceKey=new URL(review.sourceUrl).pathname.split('/object/public/course_videos/')[1];
 if(!sourceKey?.startsWith(COURSE+'/')||sha(await signedBytes(sourceKey))!==review.sourceMediaSha256)throw Error('PRESERVED_REMOTE_SOURCE_CHANGED');
 for(const a of ASSETS){
 const row=(await (await request('/rest/v1/course_videos?id=eq.'+a.id+'&select=id,course_id,storage_path,asset_role,entitlement_id')).json())[0];
 const entitlement=(await (await request('/rest/v1/licensed_media_entitlements?id=eq.'+a.entitlementId+'&select=id,provider,metadata')).json())[0];
 validateAsset(row,a,entitlement);
 }
 const probe=JSON.parse((await run('ffprobe',['-v','error','-show_format','-show_streams','-of','json',file],{timeout:60000})).stdout);
 const duration=Number(probe.format.duration);
 if(!probe.streams.some(s=>s.codec_type==='video'&&s.width>=1280&&s.height>=720)||!probe.streams.some(s=>s.codec_type==='audio')||Math.abs(duration-292.048665)>0.05)throw Error('REVIEWED_MEDIA_STREAMS_REQUIRED');
 await run('ffmpeg',['-v','error','-xerror','-i',file,'-map','0:v:0','-map','0:a:0','-f','null','-'],{timeout:180000});
 const scan=await run('ffmpeg',['-hide_banner','-i',file,'-vf','freezedetect=n=-45dB:d=2,blackdetect=d=0.3:pix_th=0.10','-af','silencedetect=noise=-40dB:d=1','-f','null','-'],{timeout:180000,maxBuffer:4*1024*1024});
 // This reviewed candidate had no such events. Any new event fails promotion.
 if(/freeze_start|black_start|silence_start/.test(scan.stderr))throw Error('REVIEWED_ZERO_DEFECT_SCAN_CHANGED');
 const audio=await audioSha(file);
 if(audio!==review.audioSha256||audio!==report.originalAudioSha)throw Error('PRESERVED_NARRATION_CHANGED');
 const cues=measuredCaptions(speech.words,duration);
 const key=COURSE+'/repairs/'+LESSON+'/'+review.candidateMediaSha256+'.mp4';
 const uploaded=await fetch(ORIGIN+'/storage/v1/object/course_videos/'+key,{method:'POST',headers:{...headers,'Content-Type':'video/mp4','x-upsert':'false'},body:candidate,signal:AbortSignal.timeout(120000)});
 if(!uploaded.ok&&uploaded.status!==409)throw Error('IMMUTABLE_REPAIR_UPLOAD_HTTP_'+uploaded.status);
 if(sha(await signedBytes(key))!==review.candidateMediaSha256)throw Error('UPLOADED_REPAIR_READBACK_MISMATCH');
 const url=ORIGIN+'/storage/v1/object/public/course_videos/'+key;
 const materialBase='https://app.elevateforhumanity.org/api/courses/'+COURSE+'/lessons/'+LESSON+'/playback';
 const accepted={...review,acceptedAt:new Date().toISOString(),durationSeconds:duration,bytes:candidate.length,decodePassed:true,currentGateFreezeFilter:'freezedetect=n=-45dB:d=2',freezeEvents:0,blackEvents:0,silenceEvents:0,captionCues:cues.length,licensedSourceCount:ASSETS.length,sourceRemoteHashRechecked:true,candidateRemoteHashRechecked:true,canonicalSourcePreserved:true,automatedBuildStagesManufactured:0,learnerPlaybackVerified:false};
 const body={video_url:url,content_json:{...lesson.content_json,film:{...lesson.content_json.film,url,durationSeconds:duration,captionCues:cues,measuredTranscript:speech.actualTranscript,captionsUrl:materialBase+'?asset=captions',transcriptUrl:materialBase+'?asset=transcript',repair:{sourceUrl:review.sourceUrl,sourceSha256:review.sourceMediaSha256,scope:report.scope}}},media_quality_status:'approved',media_quality_evidence:{...lesson.media_quality_evidence,currentMediaInspection:accepted}};
 // Exact row-version CAS preserves concurrent updates and all historical failed inspections.
 const changed=await (await request(endpoint+'&updated_at=eq.'+encodeURIComponent(lesson.updated_at)+'&video_url=eq.'+encodeURIComponent(review.sourceUrl)+'&media_quality_status=eq.unverified',{method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(body)})).json();
 if(changed.length!==1||changed[0].video_url!==url||changed[0].media_quality_status!=='approved'||changed[0].status!=='published'||!changed[0].is_published)throw Error('CANONICAL_REPAIR_COMPARE_AND_SET_FAILED');
 const receipt={courseId:COURSE,lessonId:LESSON,candidateMediaSha256:review.candidateMediaSha256,canonicalVideoUrl:url,mediaQualityStatus:changed[0].media_quality_status,status:changed[0].status,isPublished:changed[0].is_published,originalMediaPreserved:true,learnerPlaybackVerified:false};
 await writeFile(dir+'/promotion-receipt.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
