/** Never mix fingerprints, skip gaps, or expose checkpoints from older renders. */
export function contiguousRenderSegments(objects, {lessonId, startedAt}) {
 const since=Date.parse(startedAt);
 if(!/^[a-f0-9-]{36}$/i.test(lessonId??'')||!Number.isFinite(since))return [];
 const prefix=`course-render-checkpoints/${lessonId}/`,groups=new Map();
 for(const object of objects){
  if(!object.key?.startsWith(prefix)||!(object.bytes>0)||(!Number.isFinite(Date.parse(object.updatedAt))||Date.parse(object.updatedAt)<since))continue;
  const match=object.key.slice(prefix.length).match(/^([a-f0-9]{24})\/(\d+)-(\d+)\.mp4$/);
  if(!match)continue;
  const start=Number(match[2]),end=Number(match[3]);
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start%900!==0||end<start||end-start>=900)continue;
  const rows=groups.get(match[1])??[];rows.push({...object,start,end,fingerprint:match[1]});groups.set(match[1],rows);
 }
 const candidates=[...groups.values()].filter(rows=>rows.some(r=>r.start===0));
 candidates.sort((a,b)=>Math.max(...b.map(r=>Date.parse(r.updatedAt)))-Math.max(...a.map(r=>Date.parse(r.updatedAt))));
 const rows=(candidates[0]??[]).sort((a,b)=>a.start-b.start),result=[];let next=0;
 for(const row of rows){if(row.start<next)continue;if(row.start!==next)break;result.push(row);next=row.end+1;}
 return result;
}
