// Compare substantive words across transport markup, typographic punctuation and case.
// Word order, negations and numeric values remain mandatory.
const normalized=value=>String(value??'').normalize('NFKC')
 .replace(/\\[nrt]/g,' ')
 .replace(/<[^>]*>/g,' ')
 .replace(/&(?:nbsp|amp|quot|apos|lt|gt);|&#(?:39|x27);/gi,' ')
 .replace(/(\d),(?=\d{3}\b)/g,'$1')
 .toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
export function sourceGroundingFailures(segments,sources,grounding){
 if(!Array.isArray(segments)||!Array.isArray(grounding)||grounding.length!==segments.length||new Set(grounding.map(c=>c?.segmentId)).size!==segments.length)
  return [{code:'ULTIMATE_SEGMENT_GROUNDING_REQUIRED',reason:'One unique citation is required for every segment'}];
 const sourceById=new Map(sources.map(source=>[source.id,' '+normalized(source.text)+' ']));
 return segments.flatMap(segment=>{
  const citation=grounding.find(c=>c?.segmentId===segment.id);
  let reason;
  if(!citation)reason='missing citation';
  else if(!sourceById.has(citation.sourceId))reason='unknown source ID';
  else if(typeof citation.excerpt!=='string'||citation.excerpt.trim().split(/\s+/).length<8)reason='citation must contain at least eight source words';
  else if(!sourceById.get(citation.sourceId).includes(' '+normalized(citation.excerpt)+' '))reason='excerpt is not an exact passage from that source';
  return reason?[{code:'ULTIMATE_SOURCE_CITATION_INVALID',segmentId:segment.id,sourceId:citation?.sourceId,excerpt:citation?.excerpt,reason}]:[];
 });
}
export function assertSourceGrounding(segments,sources,grounding){
 const failures=sourceGroundingFailures(segments,sources,grounding);
 if(failures.length)throw new Error(failures[0].code+(failures[0].segmentId?':'+failures[0].segmentId:''));
}
