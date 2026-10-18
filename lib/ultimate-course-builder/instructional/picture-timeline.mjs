const words = value => String(value ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];
export function pictureSceneTiming(durationSeconds, fps = 30) {
 if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || !Number.isFinite(fps) || fps <= 0)
  throw Error('TEACHING_PICTURE_DURATION_REQUIRED');
 const durationFrames = Math.ceil(durationSeconds * fps);
 return {durationFrames, durationSeconds: durationFrames / fps};
}
export function quoteStartSeconds(quote, cues) {
 const transcript=cues.flatMap(c=>words(c.text).map(word=>({word,start:c.startSeconds})));
 const target=words(quote);
 const matches=pattern=>transcript.flatMap((_,i)=>pattern.every((w,j)=>transcript[i+j]?.word===w)?[i]:[]);
 const exact=matches(target);
 if(exact.length===1)return transcript[exact[0]].start;
 // Generated picture quotes can differ slightly from spoken narration. Resolve
 // a unique, long contiguous passage instead of restarting the completed film.
 // Ambiguous or unsupported matches must still fail rather than mis-time images.
 if(target.length>=5) {
  for(let size=target.length-1;size>=5;size--) {
   const positions=new Set();
   for(let offset=0;offset<=target.length-size;offset++)
    for(const i of matches(target.slice(offset,offset+size)))positions.add(i-offset);
   if(positions.size===1) {
    const start=[...positions][0];
    if(start>=0&&start<transcript.length)return transcript[start].start;
   }
   if(positions.size>1)break;
  }
 }
 throw Error('PICTURE_CUE_NOT_ALIGNED_TO_SPEECH');
}
export function pictureTimeline(photos,cues,durationSeconds,recapStartSeconds) {
 if(!Array.isArray(photos)||photos.length<2||new Set(photos.map(p=>p.sha256)).size<2)
  throw Error('MULTIPLE_DISTINCT_TEACHING_PHOTOS_REQUIRED');
 if(!(recapStartSeconds>0&&recapStartSeconds<durationSeconds))throw Error('FRESH_NARRATED_RECAP_TIMING_REQUIRED');
 // The recap illustration belongs to the recorded recap part's boundary,
 // including its brief leading breath. Word alignment starts later.
 const recapIndex=photos.findIndex(p=>p.isRecap===true);
 const selectedRecap=recapIndex>=0?recapIndex:photos.length-1;
 if(photos.filter(p=>p.isRecap===true).length>1)throw Error('ONE_RECAP_PICTURE_REQUIRED');
 const starts=photos.map((p,i)=>{
  const spoken=quoteStartSeconds(p.narrationQuote,cues);
  if(i===selectedRecap)return recapStartSeconds;
  if(spoken>=recapStartSeconds)throw Error('TEACHING_PICTURE_IN_RECAP_REQUIRED_REPAIR');
  return spoken;
 });
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
