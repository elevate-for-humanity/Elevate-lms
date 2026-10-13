import { generateVertexLessonJson } from './google-lesson-author';
import { repeatedTeachingSegments } from '@/lib/video/instructional-quality-gate';
import { contractHash } from '../core/lesson-contract';
export async function addFreshTeachingRecaps(blueprint:any,profile:any,sources:any[]){
 const result=await generateVertexLessonJson(profile.instructionalAuthoring?.model??'gemini-3.8-flash',
  'Return JSON {recaps:[{segmentId,text}]}. Write one fresh concise 1-2 sentence recap for EVERY supplied teaching moment. Ground it only in that moment and the authorized sources. Paraphrase the lesson conclusion; do not repeat any original sentence. Preserve safety negations, guard manufacturer and lengths, and all standards. Never invent facts, measurements or approvals.',
  {segments:blueprint.segments,sources});
 if(!Array.isArray(result.recaps)||result.recaps.length!==blueprint.segments.length)throw Error('EVERY_TEACHING_MOMENT_RECAP_REQUIRED');
 const segments=blueprint.segments.map((s:any)=>{
  const matches=result.recaps.filter((r:any)=>r.segmentId===s.id);
  if(matches.length!==1||typeof matches[0].text!=='string'||matches[0].text.trim().split(/\s+/).length<6||matches[0].text.length>650)
   throw Error('FRESH_TEACHING_RECAP_REQUIRED');
  return {...s,recapText:matches[0].text.trim()};
 });
 if(repeatedTeachingSegments(segments.flatMap((s:any)=>[s.text,s.recapText]).join('\n\n')))
  throw Error('TEACHING_RECAP_REPEATS_NARRATION');
 const hash=contractHash(segments);
 const review=await generateVertexLessonJson(profile.instructionalAuthoring?.model??'gemini-3.8-flash',
  'Return JSON {pass,findings,hash}. Independently check that every recap is supported by its teaching moment and the authorized sources, preserves safety and technical conditions, is freshly worded, and introduces no facts or measurements. Any failure means pass:false. Echo hash exactly.',
  {segments,sources,hash});
 if(review.pass!==true||review.hash!==hash||!Array.isArray(review.findings)||review.findings.length)
  throw Error('TEACHING_RECAP_SOURCE_REVIEW_REQUIRED');
 return {...blueprint,segments,presentationEvidence:{version:'approved-moment-cues-v2',recapHash:hash,review}};
}
