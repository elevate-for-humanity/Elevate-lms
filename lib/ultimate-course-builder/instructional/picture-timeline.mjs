const words = value => String(value ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];
export function quoteStartSeconds(quote, cues) {
 const transcript=cues.flatMap(c=>words(c.text).map(word=>({word,start:c.startSeconds})));
 const target=words(quote);
 const index=transcript.findIndex((_,i)=>target.length&&target.every((w,j)=>transcript[i+j]?.word===w));
 if(index<0)throw Error('PICTURE_CUE_NOT_ALIGNED_TO_SPEECH');
 return transcript[index].start;
}
export function pictureTimeline(photos,cues,durationSeconds,recapStartSeconds) {
 if(!Array.isArray(photos)||photos.length<2||new Set(photos.map(p=>p.sha256)).size<2)
  throw Error('MULTIPLE_DISTINCT_TEACHING_PHOTOS_REQUIRED');
 if(!(recapStartSeconds>0&&recapStartSeconds<durationSeconds))throw Error('FRESH_NARRATED_RECAP_TIMING_REQUIRED');
 const starts=photos.map(p=>quoteStartSeconds(p.narrationQuote,cues));
 const result=photos.map((photo,i)=>{
  const same=starts.filter(s=>s===starts[i]).length;
  const ordinal=starts.slice(0,i).filter(s=>s===starts[i]).length;
  const next=starts.find(s=>s>starts[i])??recapStartSeconds;
  return {...photo,startSeconds:starts[i]+(next-starts[i])*ordinal/same};
 }).sort((a,b)=>a.startSeconds-b.startSeconds);
 result[0].startSeconds=0;
 return result.map((p,i)=>({...p,endSeconds:result[i+1]?.startSeconds??durationSeconds}));
}
export function activePictureCue(cues,seconds){
 const cue=cues.find(c=>seconds>=c.startSeconds&&seconds<c.endSeconds);
 if(!cue)throw Error('TEACHING_PICTURE_TIMELINE_GAP');
 return cue;
}
