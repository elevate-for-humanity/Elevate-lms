export function selectReviewedTeachingPhoto(assets, quote, used, compatible, {allowRelatedCoursePhoto=false}={}) {
 const eligible=assets.filter(asset => {
  const observation=asset.visual_observation;
  return String(asset.mime_type??'').startsWith('image/') && (allowRelatedCoursePhoto || asset.lesson_match_verified===true) &&
   asset.entitlement_id && asset.license_evidence_url && asset.storage_path &&
   /^[a-f0-9]{64}$/i.test(String(asset.content_sha256??'')) &&
   observation?.method==='sampled-frame-inspection' && observation.contentSha256===asset.content_sha256 &&
   Number.isFinite(Date.parse(observation.reviewedAt)) && !used.has(asset.content_sha256) &&
   Array.isArray(observation.visibleActions) && observation.visibleActions.some(action=>typeof action==='string' && action.trim());
 });
 const exact=eligible.find(asset=>asset.visual_observation.visibleActions.some(action=>compatible(quote,action)));
 if(exact || !allowRelatedCoursePhoto)return exact;
 // These assets already passed the course/lesson relevance review. Use their
 // best available contextual image when an exact action photo is absent.
 const terms=new Set(String(quote).toLowerCase().match(/[a-z0-9]{3,}/g)??[]);
 const score=asset=>(asset.visual_observation.visibleActions.join(' ').toLowerCase().match(/[a-z0-9]{3,}/g)??[]).filter(word=>terms.has(word)).length;
 return eligible.reduce((best,asset)=>!best||score(asset)>score(best)?asset:best,undefined);
}
