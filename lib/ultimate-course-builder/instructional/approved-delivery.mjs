// Check the owner's presentation against the actual renderer delivery data.
// Encoded-media inspection and authenticated learner testing remain separate gates.
const words = value => String(value ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];
const hash = value => /^[a-f0-9]{64}$/i.test(String(value ?? ''));
const finite = value => Number.isFinite(value);
const close = (a,b) => finite(a) && finite(b) && Math.abs(a-b)<=0.05;
const ownedInstructionalProviders = new Set(['google','google-generated','openai','elevate-instructional']);
export function generatedTeachingPhoto(scene) {
  return scene.physicalDemonstration !== true &&
    ownedInstructionalProviders.has(scene.resolvedProvider) &&
    scene.resolvedModel === 'generated-teaching-photograph' &&
    Array.isArray(scene.pictureCues) && scene.pictureCues.length >= 2 &&
    scene.pictureCues.every(cue => cue.illustration === true && hash(cue.sha256) &&
      String(cue.storagePath ?? '').startsWith('approved-teaching-photos/') &&
      ownedInstructionalProviders.has(cue.provider ?? 'google'));
}

/** A narrated illustration can mix generated photographs and reviewed licensed
 * frame samples. Verify every cue; the first picture cannot describe the
 * provenance of the entire scene. This never certifies a practical demo. */
export function verifiedTeachingPhotoScene(scene) {
  const cues=scene.pictureCues;
  if(scene.physicalDemonstration===true ||
    ![...ownedInstructionalProviders,'envato'].includes(scene.resolvedProvider) ||
    !['generated-teaching-photograph','licensed-teaching-photograph'].includes(scene.resolvedModel) ||
    !Array.isArray(cues) || cues.length<2) return false;
  return cues.every(cue=>{
    if(cue.illustration!==true || !hash(cue.sha256) || !cue.imageUrl) return false;
    if(ownedInstructionalProviders.has(cue.provider))
      return String(cue.storagePath??'').startsWith('approved-teaching-photos/');
    return cue.provider==='envato' && Boolean(cue.providerItemId && cue.selectedSourceAssetId) &&
      hash(cue.selectedSourceSha256) &&
      finite(cue.sampleFraction) && cue.sampleFraction>=0 && cue.sampleFraction<=1 &&
      String(cue.storagePath??'').startsWith('selected-course-stills/') &&
      String(cue.storagePath).includes('/'+cue.selectedSourceSha256+'-') &&
      /^https:\/\//.test(String(cue.licenseEvidenceUrl??''));
  });
}

export function approvedDeliveryFailures(render, narration, presentation) {
  const errors=[];
  const require=(ok,code)=>{if(!ok)errors.push(code);};
  require(render?.presentationVersion === 'approved-moment-cues-v2','APPROVED_MOMENT_PRESENTATION_REQUIRED');
  const reference=presentation?.approvedReferenceVideo;
  require(reference?.assetId && hash(reference.sha256) &&
    render?.approvedReferenceAssetId === reference.assetId &&
    render?.approvedReferenceSha256 === reference.sha256,'APPROVED_REFERENCE_DELIVERY_MISMATCH');
  require(render?.requestedVisualStyle?.cropMode === 'contain' &&
    render?.requestedVisualStyle?.transition === 'crossfade','APPROVED_WHOLE_PICTURE_STYLE_REQUIRED');
  const scenes=render?.sceneData?.scenes;
  require(Array.isArray(scenes) && scenes.length>0,'APPROVED_DELIVERY_SCENES_REQUIRED');
  require(Array.isArray(narration?.segments) && narration.segments.length===scenes?.length,'APPROVED_NARRATION_SCENE_COVERAGE_REQUIRED');
  let duration=0;
  for(const [index,scene] of (Array.isArray(scenes)?scenes:[]).entries()) {
    const suffix=':'+String(scene.id??index);
    // directMedia assigns its own scene IDs; the strict renderer consumes the
    // already source-locked narration in the same ordered scene sequence.
    const audio=narration?.segments?.[index];
    require(audio && finite(audio.durationSeconds) && audio.durationSeconds>0 &&
      close(scene.durationSeconds,Math.ceil(audio.durationSeconds*30)/30),'APPROVED_SPEECH_TIMELINE_MISMATCH'+suffix);
    const parts=audio?.parts;
    const recap=Array.isArray(parts)?parts.find(p=>p.isRecap===true):null;
    require(Array.isArray(parts) && parts.length>=2 && parts.filter(p=>p.isRecap===true).length===1 &&
      recap===parts[parts.length-1] && recap?.text?.trim()===scene.recapText?.trim() &&
      close(recap?.startSeconds,scene.recapStartSeconds) && recap?.audioUrl &&
      words(recap.text).length>=6,'APPROVED_SEPARATE_FRESH_RECAP_REQUIRED'+suffix);
    let cursor=0;
    for(const part of (Array.isArray(parts)?parts:[])) {
      require(part.text?.trim() && part.audioUrl && finite(part.durationSeconds) && part.durationSeconds>0 &&
        close(part.startSeconds,cursor),'APPROVED_AUDIO_PART_GAP_OR_OVERLAP'+suffix);
      cursor+=part.durationSeconds;
    }
    require(close(cursor,audio?.durationSeconds),'APPROVED_AUDIO_PART_DURATION_MISMATCH'+suffix);
    const cues=scene.pictureCues;
    const teaching=Array.isArray(cues)?cues.filter(c=>c.startSeconds<scene.recapStartSeconds):[];
    require(new Set(teaching.map(c=>c.sha256)).size>=2,'APPROVED_MULTIPLE_TEACHING_PICTURES_REQUIRED'+suffix);
    require(Array.isArray(cues) && cues.length>=3 && cues.every((cue,i)=>
      cue.imageUrl && hash(cue.sha256) && finite(cue.startSeconds) && finite(cue.endSeconds) &&
      cue.endSeconds>cue.startSeconds && close(cue.startSeconds,i?cues[i-1].endSeconds:0)) &&
      close(cues[cues.length-1].endSeconds,scene.durationSeconds),'APPROVED_PICTURE_TIMELINE_GAP_OR_OVERLAP'+suffix);
    require(Array.isArray(cues) && cues.some(c=>close(c.startSeconds,scene.recapStartSeconds)),
      'APPROVED_RECAP_PICTURE_REQUIRED'+suffix);
    const alignment=scene.wordAlignment;
    require(Array.isArray(alignment) && alignment.length>0 && alignment.every((w,i)=>
      w.word?.trim() && finite(w.start) && finite(w.end) && w.start>=0 && w.end>w.start &&
      w.end<=scene.durationSeconds+0.2 && (!i || w.start>=alignment[i-1].end-0.02)),
      'APPROVED_WORD_ALIGNMENT_REQUIRED'+suffix);
    require(words(scene.dialogue??scene.action).join(' ')===words(audio?.text).join(' '),
      'APPROVED_NARRATION_TEXT_MISMATCH'+suffix);
    duration+=scene.durationSeconds;
  }
  require(close(duration,render?.duration),'APPROVED_SILENT_BOOKEND_OR_DURATION_MISMATCH');
  return [...new Set(errors)];
}

/** Approved delivery independently verifies source audio, durations and measured
 * word timings. ASR lexical overlap is diagnostic, not proof of missing speech.
 * Substantial mismatch (under 75%) still fails; ordinary delivery stays strict. */
export function narrationCoverageSeverity(coverage, approvedDelivery = false) {
  if (!Number.isFinite(coverage) || coverage < 0.75) return 'error';
  if (coverage >= 0.9) return null;
  return approvedDelivery ? 'warning' : 'error';
}
