const normalized=value=>String(value??'').replace(/\s+/g,' ').trim();
export function sourceGroundingFailures(segments,sources,grounding){
 if(!Array.isArray(segments)||!Array.isArray(grounding)||grounding.length!==segments.length||new Set(grounding.map(c=>c?.segmentId)).size!==segments.length)
  return [{code:'ULTIMATE_SEGMENT_GROUNDING_REQUIRED',reason:'One unique citation is required for every segment'}];
 const sourceById=new Map(sources.map(source=>[source.id,normalized(source.text)]));
 return segments.flatMap(segment=>{
  const citation=grounding.find(c=>c?.segmentId===segment.id);
  let reason;
  if(!citation)reason='missing citation';
  else if(!sourceById.has(citation.sourceId))reason='unknown source ID';
  else if(typeof citation.excerpt!=='string'||citation.excerpt.trim().split(/\s+/).length<8)reason='citation must contain at least eight source words';
  else if(!sourceById.get(citation.sourceId).includes(normalized(citation.excerpt)))reason='excerpt is not an exact passage from that source';
  return reason?[{code:'ULTIMATE_SOURCE_CITATION_INVALID',segmentId:segment.id,sourceId:citation?.sourceId,excerpt:citation?.excerpt,reason}]:[];
 });
}
export function assertSourceGrounding(segments,sources,grounding){
 const failures=sourceGroundingFailures(segments,sources,grounding);
 if(failures.length)throw new Error(failures[0].code+(failures[0].segmentId?':'+failures[0].segmentId:''));
}
