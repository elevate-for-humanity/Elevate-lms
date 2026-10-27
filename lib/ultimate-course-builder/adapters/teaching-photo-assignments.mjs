/** Bind real prepared photographs to saved scene requests. No text-card image
 * generation, SVG rasterization, or invented licensing is permitted here. */
export function bindTeachingPhotoAssignments(input) {
  const media = input.artifacts?.visual_assignment?.media;
  if (!media?.assignments) return input;
  const readyAssets = [...(media.readyAssets ?? [])].filter(a => !a.owned_instructional_visual);
  const assignments = media.assignments.map(assignment => {
    if (!['instructional-render','teaching-photograph-request'].includes(assignment.assignmentMethod))
      return assignment;
    const photo = input.teachingPhotos?.[assignment.sceneId]?.[0];
    if (!photo) return assignment;
    if (!photo.imageUrl?.startsWith('https:') || !/^[a-f0-9]{64}$/i.test(photo.sha256 ?? '') ||
        !photo.storagePath || !photo.narrationQuote?.trim())
      throw new Error('TEACHING_PHOTO_EVIDENCE_REQUIRED:' + assignment.sceneId);
    const assetId = 'teaching-photo:' + assignment.sceneId + ':' + photo.sha256;
    readyAssets.push({id:assetId, public_url:photo.imageUrl, mime_type:'image/png',
      provider:photo.provider, content_sha256:photo.sha256, storage_path:photo.storagePath,
      teaching_photo:true, instructional_scene_id:assignment.sceneId,
      narration_quote:photo.narrationQuote, license_evidence_url:photo.licenseEvidenceUrl,
      provider_item_id:photo.providerItemId});
    return {sceneId:assignment.sceneId,assetId,assignmentMethod:'teaching-photograph',
      relevanceReason:photo.narrationQuote,licenseEvidenceUrl:photo.licenseEvidenceUrl};
  });
  return {...input,artifacts:{...input.artifacts,visual_assignment:{
    ...input.artifacts.visual_assignment,media:{...media,assignments,readyAssets}}}};
}
