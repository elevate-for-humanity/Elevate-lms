export function photoResponseDetails(result){
 const candidates=Array.isArray(result?.candidates)?result.candidates:[];
 return {blockReason:result?.promptFeedback?.blockReason??null,finishReasons:candidates.map(c=>c.finishReason??null),candidateCount:candidates.length,partTypes:candidates.flatMap(c=>(c.content?.parts??[]).map(p=>p.inlineData?.mimeType??(p.text?'text':'unknown'))),blocked:candidates.some(c=>(c.safetyRatings??[]).some(r=>r.blocked===true))||Boolean(result?.promptFeedback?.blockReason)};
}
export async function recoverTeachingPhoto({primaryPrompt,courseTitle,scene,step,index,generate,selectedReplacement=null,persistFailure=async(/** @type {Record<string, unknown>} */ _detail)=>{}}){
 const options={maxAttempts:3,timeoutMs:120000};
 try{return await generate(primaryPrompt,options);}
 catch(error){
  const detail={sceneId:scene.id,cueIndex:index,narrationQuote:step.narrationQuote,code:String(error.message).split(':')[0],provider:error.details??null};
  await persistFailure(detail);
  const missing=detail.code==='GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED';
  if(!missing&&!error.details?.blocked)throw Object.assign(new Error(detail.code+':'+scene.id+':cue-'+index),{details:detail,cause:error});
  // Use an already licensed, verified course asset if one is available.
  const replacement=selectedReplacement?await selectedReplacement(detail):null;
  if(replacement?.bytes&&replacement?.selectedSourceAssetId&&replacement.repair?.method!=='lesson-conceptual-card-v1'&&!String(replacement.selectedSourceAssetId).startsWith('generated-training-diagram:'))
   return {...replacement,repair:{method:'selected-course-asset-v1',sceneId:scene.id,cueIndex:index,sourceAssetId:replacement.selectedSourceAssetId}};
  // A provider safety block is never circumvented with a rewritten prompt.
  if(error.details?.blocked)throw Object.assign(new Error('INSTRUCTIONAL_VISUAL_REPLACEMENT_REQUIRED:'+scene.id+':cue-'+index),{details:detail,cause:error});
  // An image need only be relevant to the course, not an exact teaching cue.
  const relatedPrompt='Create a realistic, professional, general course-related photograph for '+String(courseTitle||'cosmetology')+'. Show the relevant equipment, tools, supplies, or professional workplace setting for this course. Avoid identifiable brands or people. No text overlays.';
  try{
   const related=await generate(relatedPrompt,{maxAttempts:1,timeoutMs:120000});
   if(related?.bytes)return {...related,repair:{method:'course-related-photo-v1',sceneId:scene.id,cueIndex:index}};
  }catch(relatedError){await persistFailure({...detail,code:'COURSE_RELATED_PHOTO_UNAVAILABLE',fallbackError:String(relatedError.message).slice(0,200)});}
  throw Object.assign(new Error('INSTRUCTIONAL_VISUAL_REPLACEMENT_REQUIRED:'+scene.id+':cue-'+index),{details:detail,cause:error});
 }
}
