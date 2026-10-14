/** Only instructional content and media intended for Admin preview. */
export function lessonPreview(artifacts: any = {}) {
  const script = artifacts.instructor_script?.script;
  const scenes = artifacts.storyboard?.storyboard?.scenes ?? [];
  return {
    objectives: (artifacts.learning_objectives?.objectives ?? []).map((o: any) => typeof o === 'string' ? o : o.text).filter(Boolean),
    script: typeof script?.script === 'string' ? script.script : '',
    segments: (script?.segments ?? []).map((s: any) => ({ title: s.title ?? s.stage ?? s.id, text: s.text ?? s.narration ?? s.script ?? '' })),
    scenes: scenes.map((s: any) => ({ title: s.title ?? s.stage ?? s.id, narration: s.dialogue ?? s.narrationText ?? s.narration ?? '',
      visual: s.visualRequirement ?? s.description ?? '', recap: s.recapText ?? '' })),
  };
}
