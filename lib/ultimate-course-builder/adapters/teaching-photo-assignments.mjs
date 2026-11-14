/** Bind a prepared visual to a saved conceptual-scene request. New requests are
 * visual-neutral: they may resolve to a licensed picture, inspected still, or
 * clearly labelled instructional graphic. Legacy photo requests are accepted
 * only so saved checkpoints can resume. */
export function bindTeachingPhotoAssignments(input) {
  const media = input.artifacts?.visual_assignment?.media;
  if (!media?.assignments) return input;
  const readyAssets = [...(media.readyAssets ?? [])].filter(a => !a.owned_instructional_visual);
  const assignments = media.assignments.map(assignment => {
    if (!['instructional-render','instructional-visual-request','teaching-photograph-request'].includes(assignment.assignmentMethod))
      return assignment;
    const photo = input.teachingPhotos?.[assignment.sceneId]?.[0];
    if (!photo) return assignment;
    if (!photo.imageUrl?.startsWith('https:') || !/^[a-f0-9]{64}$/i.test(photo.sha256 ?? '') ||
        !photo.storagePath || !photo.narrationQuote?.trim())
      throw new Error('INSTRUCTIONAL_VISUAL_EVIDENCE_REQUIRED:' + assignment.sceneId);
    const isInstructionalGraphic=photo.repair?.method==='lesson-conceptual-card-v1';
    const assetId = (isInstructionalGraphic?'instructional-visual:':'teaching-photo:') + assignment.sceneId + ':' + photo.sha256;
    readyAssets.push({id:assetId, public_url:photo.imageUrl, mime_type:'image/png',
      provider:photo.provider, content_sha256:photo.sha256, storage_path:photo.storagePath,
      teaching_photo:!isInstructionalGraphic, owned_instructional_visual:isInstructionalGraphic,
      instructional_scene_id:assignment.sceneId,
      narration_quote:photo.narrationQuote, license_evidence_url:photo.licenseEvidenceUrl,
      provider_item_id:photo.providerItemId});
    return {sceneId:assignment.sceneId,assetId,
      assignmentMethod:isInstructionalGraphic?'instructional-visual':'teaching-photograph',
      ...(isInstructionalGraphic?{generatedInstructionalVisual:true}:{}),
      relevanceReason:photo.narrationQuote,licenseEvidenceUrl:photo.licenseEvidenceUrl};
  });
  return {...input,artifacts:{...input.artifacts,visual_assignment:{
    ...input.artifacts.visual_assignment,media:{...media,assignments,readyAssets}}}};
}
