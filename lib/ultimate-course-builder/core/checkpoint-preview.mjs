/** Reconstruct only the fields lessonPreview consumes. Never load producer
 * certificates, narration timings, or encoded media in the polling query. */
export function checkpointPreviewArtifacts(row) {
  return {
    learning_objectives: {objectives: row.preview_objectives ?? []},
    assessment_alignment: {assessment: row.preview_assessment},
    instructor_script: {script: row.preview_script},
    storyboard: {storyboard: {scenes: row.preview_scenes ?? []}},
    lesson_film_render: {render: {
      mediaUrl: row.preview_media_url,
      videoUrl: row.preview_video_url,
      playbackUrl: row.preview_playback_url,
    }},
    finished_media_qa: {mediaQA: {pass: row.preview_media_approved === true}},
  };
}
