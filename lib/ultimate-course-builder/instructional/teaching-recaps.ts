import { subjectTeachingRequirements, assertRtiSubjectTeaching } from './rti-teaching-policy.mjs';
import {reportCourseProgress} from '../worker/progress-watch.mjs';
import { generateVertexLessonJson } from './google-lesson-author';
import { repeatedTeachingSegments } from '@/lib/video/instructional-quality-gate';
import { contractHash } from '../core/lesson-contract';
export async function addFreshTeachingRecaps(blueprint:any,profile:any,sources:any[],generate=generateVertexLessonJson){
 // Recap rewrites cannot repair repetition in the original teaching script.
 // Diagnose its actual producer before spending another generation attempt.
 if(repeatedTeachingSegments(blueprint.segments.map((s:any)=>s.text).join('\n\n')))
  throw Error('NARRATION_DUPLICATION');
 let lastFailure:any;
 for(let attempt=0;attempt<3;attempt++) {
 try {
 const result=await generate(profile.instructionalAuthoring?.model??'gemini-3.8-flash',
  'Return JSON {recaps:[{segmentId,text}]}. Write one fresh concise 1-2 sentence recap of at most twenty-four words and 140 characters for EVERY supplied teaching moment. Ground it only in that moment and the authorized sources. Paraphrase the lesson conclusion; do not repeat any original sentence. Preserve safety negations, guard manufacturer and lengths, and all standards. Never invent facts, measurements or approvals.',
  {segments:blueprint.segments,sources,...(subjectTeachingRequirements(profile)?{rtiRequirements:subjectTeachingRequirements(profile)}:{}),...(lastFailure?{repair:lastFailure}: {})},profile.instructionalAuthoring?.location??'us');
 reportCourseProgress('authoring:'+blueprint.competencyId+':recaps',attempt+1);
 if(!Array.isArray(result.recaps)||result.recaps.length!==blueprint.segments.length)throw Error('EVERY_TEACHING_MOMENT_RECAP_REQUIRED');
 const segments=blueprint.segments.map((s:any)=>{
  const matches=result.recaps.filter((r:any)=>r.segmentId===s.id);
  if(matches.length!==1||typeof matches[0].text!=='string'||matches[0].text.trim().split(/\s+/).length<6||matches[0].text.length>140)
   throw Error('FRESH_TEACHING_RECAP_REQUIRED');
  return {...s,recapText:matches[0].text.trim()};
 });
 assertRtiSubjectTeaching({...blueprint,segments},profile);
 if(repeatedTeachingSegments(segments.flatMap((s:any)=>[s.text,s.recapText]).join('\n\n')))
  throw Error('TEACHING_RECAP_REPEATS_NARRATION');
 const {authoringEvidence:previousEvidence,...base}=blueprint;
 const payload={...base,segments,presentationEvidence:{version:'approved-moment-cues-v2',recapHash:contractHash(segments)}};
 const hash=contractHash(payload);
 const review=await generate(profile.instructionalAuthoring?.model??'gemini-3.8-flash',
  'Return JSON {pass,findings,hash,competencyId,blueprintHash}. Independently review the complete blueprint, its instruction and assessments against the sources; check that every recap is supported by its teaching moment and the authorized sources, preserves safety and technical conditions, is freshly worded, and introduces no facts or measurements. Any failure means pass:false. Echo hash, blueprintHash and competencyId exactly.',
  {blueprint:payload,segments,sources,hash,blueprintHash:hash,competencyId:blueprint.competencyId,presentationContract:profile.presentationContract},profile.instructionalAuthoring?.location??'us');
 reportCourseProgress('authoring:'+blueprint.competencyId+':recap-evidence',attempt+1);
 if(review.pass!==true||review.hash!==hash||review.blueprintHash!==hash||review.competencyId!==blueprint.competencyId||!Array.isArray(review.findings)||review.findings.length)
  throw Error('TEACHING_RECAP_SOURCE_REVIEW_REQUIRED:'+JSON.stringify(review.findings??[]).slice(0,1500));
 return {...payload,authoringEvidence:{version:'source-grounded-teaching-1',sourceHash:contractHash(sources),blueprintHash:hash,grounding:previousEvidence?.grounding??[],review}};
 } catch(error) {
  const message=(error as Error).message;
  if(attempt===2||!['EVERY_TEACHING_MOMENT_RECAP_REQUIRED','FRESH_TEACHING_RECAP_REQUIRED','TEACHING_RECAP_REPEATS_NARRATION','TEACHING_RECAP_SOURCE_REVIEW_REQUIRED','BLUEPRINT_RTI_NAVIGATION_FILLER'].some(code=>message.startsWith(code)))throw error;
  lastFailure={error:message,instructions:'Rewrite all recaps to repair the reported failure. Keep each conclusion grounded only in its own teaching moment and the authorized sources, freshly worded and within 140 characters. Do not weaken the review or invent a fact.'};
 }
 }
 throw Error('TEACHING_RECAP_REPAIR_EXHAUSTED');
}
