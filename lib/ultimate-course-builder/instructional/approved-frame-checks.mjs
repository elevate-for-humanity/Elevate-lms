const words=value=>String(value??'').toLowerCase().match(/[a-z0-9]+/g)??[];
export function captionSampleGroups(alignment,recapStartSeconds,captionCues){
 if(captionCues?.length){
  // Inspect exactly the phrase displayed by the compositor. Recap recordings
  // restart phrase grouping; regrouping the concatenated words crosses that
  // boundary and asks OCR to find words never displayed together.
  for(const cue of captionCues){
   if(!Number.isFinite(cue.startSeconds)||!Number.isFinite(cue.endSeconds)||cue.endSeconds<=cue.startSeconds)
    throw Error('APPROVED_CAPTION_TIMING_INVALID');
   const aligned=(alignment??[]).filter(w=>w.start>=cue.startSeconds-0.05&&w.end<=cue.endSeconds+0.05).map(w=>w.word).join(' ');
   if(captionWordCoverage(cue.text,aligned)<0.85)throw Error('APPROVED_CAPTION_ALIGNMENT_MISMATCH');
  }
  const first=captionCues[0],recap=captionCues.find(c=>c.startSeconds>=recapStartSeconds)??captionCues.at(-1);
  return [...new Set([first,recap])];
 }
 const groups=[];
 for(let i=0;i<(alignment?.length??0);i+=8){
  const group=alignment.slice(i,i+8);
  groups.push({startSeconds:group[0].start,endSeconds:group.at(-1).end,text:group.map(w=>w.word).join(' ')});
 }
 const first=groups[0],recap=groups.find(g=>g.startSeconds>=recapStartSeconds)??groups.at(-1);
 return [...new Set([first,recap])].filter(Boolean);
}
export function captionWordCoverage(expected,observed){
 const target=[...new Set(words(expected))],seen=new Set(words(observed));
 return target.length?target.filter(word=>seen.has(word)).length/target.length:0;
}
export function charcoalPixelsMatch(bytes){
 return bytes?.length>=12 && [...bytes].every(channel=>Math.abs(channel-23)<=3);
}
