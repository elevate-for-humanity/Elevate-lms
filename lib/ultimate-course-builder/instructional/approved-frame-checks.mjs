const words=value=>String(value??'').toLowerCase().match(/[a-z0-9]+/g)??[];
export function captionSampleGroups(alignment,recapStartSeconds){
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
