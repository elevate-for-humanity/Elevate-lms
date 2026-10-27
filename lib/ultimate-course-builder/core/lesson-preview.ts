import { renderMediaUrl, renderPlaybackUrl } from '../media/playback-source.mjs';
/** Only instructional content and media intended for Admin preview. */
export function lessonPreview(artifacts: any = {}) {
  const script = artifacts.instructor_script?.script;
  const scenes = artifacts.storyboard?.storyboard?.scenes ?? [];
  const assessment = artifacts.assessment_alignment?.assessment;
  const render = artifacts.lesson_film_render?.render;
  return {
    videoUrl: renderMediaUrl(render) ?? renderPlaybackUrl(render),
    mediaApproved: artifacts.finished_media_qa?.mediaQA?.pass === true,
    objectives: (artifacts.learning_objectives?.objectives ?? []).map((o: any) => typeof o === 'string' ? o : o.text).filter(Boolean),
    assessment: assessment ? {questions: assessment.questions ?? [], passingScore: assessment.passingScore, reassessment: assessment.reassessment ?? []} : null,
    script: typeof script?.script === 'string' ? script.script : '',
    segments: (script?.segments ?? []).map((s: any) => ({ title: s.title ?? s.stage ?? s.id, text: s.text ?? s.narration ?? s.script ?? '' })),
    scenes: scenes.map((s: any) => ({ title: s.title ?? s.stage ?? s.id, narration: s.dialogue ?? s.narrationText ?? s.narration ?? '',
      visual: s.visualRequirement ?? s.description ?? '', recap: s.recapText ?? '' })),
  };
}
