export function photoResponseDetails(result){
 const candidates=Array.isArray(result?.candidates)?result.candidates:[];
 return {blockReason:result?.promptFeedback?.blockReason??null,finishReasons:candidates.map(c=>c.finishReason??null),candidateCount:candidates.length,partTypes:candidates.flatMap(c=>(c.content?.parts??[]).map(p=>p.inlineData?.mimeType??(p.text?'text':'unknown'))),blocked:candidates.some(c=>(c.safetyRatings??[]).some(r=>r.blocked===true))||Boolean(result?.promptFeedback?.blockReason)};
}
export function alternativePhotoPrompt({courseTitle,scene,step}){
 const assessment=/knowledge_check|assessment|reassessment/.test(scene.stage??'');
 const observable=assessment?('An adult career learner at a professional training station relevant to '+String(courseTitle)+', reviewing an unbranded assessment sheet, with appropriate clean tools visible. No legible writing.'):String(scene.visualRequirement);
 return ['Create one photographic illustration. Return image output. Adult professional career-training context.','Illustration only; no claim that a procedure or assessment was actually performed.','Show the full subject and tools in a wide uncropped view. No logos, readable text, invented measurements, unsafe actions, or extraneous objects.',String(courseTitle),'Teaching action: '+observable,'Instructional context (do not print these words): '+String(step.narrationQuote),'View: '+String(step.view)].join('\n');
}
export async function recoverTeachingPhoto({primaryPrompt,courseTitle,scene,step,index,generate,persistFailure=async()=>{}}){
 const options={maxAttempts:2,timeoutMs:90000};
 try{return await generate(primaryPrompt,options);}
 catch(error){
  const detail={sceneId:scene.id,cueIndex:index,narrationQuote:step.narrationQuote,code:String(error.message).split(':')[0],provider:error.details??null};
  await persistFailure(detail);
  if(error.details?.blocked)throw Object.assign(new Error('TEACHING_PHOTO_REPLACEMENT_REQUIRED:'+scene.id+':cue-'+index),{details:detail,cause:error});
  if(detail.code!=='GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED')throw Object.assign(new Error(detail.code+':'+scene.id+':cue-'+index),{details:detail,cause:error});
  const replacement=alternativePhotoPrompt({courseTitle,scene,step});
  if(replacement===primaryPrompt)throw Error('TEACHING_PHOTO_REPAIR_UNCHANGED');
  try{return {...await generate(replacement,options),repair:{method:'observable-illustration-request-v1',sceneId:scene.id,cueIndex:index}};}
  catch(second){
   const final={...detail,replacementCode:String(second.message).split(':')[0],replacementProvider:second.details??null};
   await persistFailure(final);
   throw Object.assign(new Error('TEACHING_PHOTO_REPLACEMENT_REQUIRED:'+scene.id+':cue-'+index),{details:final,cause:second});
  }
 }
}
