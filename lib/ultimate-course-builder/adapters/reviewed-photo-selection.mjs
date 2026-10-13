export function selectReviewedTeachingPhoto(assets, quote, used, compatible) {
 return assets.find(asset => {
  const observation=asset.visual_observation;
  return String(asset.mime_type??'').startsWith('image/') && asset.lesson_match_verified===true &&
   asset.entitlement_id && asset.license_evidence_url && asset.storage_path &&
   /^[a-f0-9]{64}$/i.test(String(asset.content_sha256??'')) &&
   observation?.method==='sampled-frame-inspection' && observation.contentSha256===asset.content_sha256 &&
   Number.isFinite(Date.parse(observation.reviewedAt)) && !used.has(asset.content_sha256) &&
   Array.isArray(observation.visibleActions) && observation.visibleActions.some(action=>compatible(quote,action));
 });
}
