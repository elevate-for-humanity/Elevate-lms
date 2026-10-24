export function photoResponseDetails(result){
 const candidates=Array.isArray(result?.candidates)?result.candidates:[];
 return {blockReason:result?.promptFeedback?.blockReason??null,finishReasons:candidates.map(c=>c.finishReason??null),candidateCount:candidates.length,partTypes:candidates.flatMap(c=>(c.content?.parts??[]).map(p=>p.inlineData?.mimeType??(p.text?'text':'unknown'))),blocked:candidates.some(c=>(c.safetyRatings??[]).some(r=>r.blocked===true))||Boolean(result?.promptFeedback?.blockReason)};
}
export async function recoverTeachingPhoto({primaryPrompt,courseTitle,scene,step,index,generate,selectedReplacement=null,persistFailure=async(_detail)=>{}}){
 // Three two-minute attempts plus backoff fit inside the ten-minute progress
 // deadline, leaving time for cache readback and persistence.
 const options={maxAttempts:3,timeoutMs:120000};
 try{return await generate(primaryPrompt,options);}
 catch(error){
  const detail={sceneId:scene.id,cueIndex:index,narrationQuote:step.narrationQuote,code:String(error.message).split(':')[0],provider:error.details??null};
  await persistFailure(detail);
  if(error.details?.blocked && !selectedReplacement)throw Object.assign(new Error('TEACHING_PHOTO_REPLACEMENT_REQUIRED:'+scene.id+':cue-'+index),{details:detail,cause:error});
  if(detail.code!=='GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED' && !error.details?.blocked)throw Object.assign(new Error(detail.code+':'+scene.id+':cue-'+index),{details:detail,cause:error});
  const replacement=selectedReplacement?await selectedReplacement(detail):null;
  if(!replacement?.bytes||!replacement?.selectedSourceAssetId||replacement.repair?.method==='lesson-conceptual-card-v1'||String(replacement.selectedSourceAssetId).startsWith('generated-training-diagram:'))throw Object.assign(new Error('TEACHING_PHOTO_REPLACEMENT_REQUIRED:'+scene.id+':cue-'+index),{details:detail,cause:error});
  return {...replacement,repair:{method:'selected-course-asset-v1',sceneId:scene.id,cueIndex:index,sourceAssetId:replacement.selectedSourceAssetId}};
 }
}
