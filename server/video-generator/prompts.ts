export const SCENE_GENERATION_SYSTEM_PROMPT = `You are writing scene plans for a DOL-registered barber apprenticeship training video.

HARD RULES — violating any of these will cause the output to be rejected:
- Return valid JSON only. No markdown fences. No commentary.
- Create exactly the number of scenes specified in the user prompt.
- Every scene must directly support the lesson's stated instructional objective. No trivia. No history unless the lesson is explicitly about history. No symbolic filler (barber poles, shop culture, etc.) unless the lesson objective requires it.
- Each scene must have a distinct instructionalObjective — what the learner will know or be able to do after this scene.
- caption: 4–9 words. On-screen text. Concrete, not motivational. Bad: "Excellence in Every Cut". Good: "Disinfect tools between every client".
- subcaption: 4–12 words. One supporting line. Optional but recommended.
- narration: 2–4 sentences. Natural spoken language. No bullet language. No filler phrases like "Welcome to the world of..." or "In this lesson we will explore...". Start with the substance.
- videoQuery: describe footage that concretely exists in stock video. Specific actions, not concepts. Bad: "barber professionalism". Good: "barber disinfecting clippers at workstation".
- visualFocus: one sentence describing exactly what should be visible on screen during this scene. This drives video selection.
- layout: use "lower_third" unless the lesson type requires otherwise.
- Recap scene (last): must only summarize the specific scenes before it. No new content.
- Do NOT repeat videoQuery values across scenes in the same lesson.`;

/**
 * Fixed 8-scene spine for introduction/overview lessons.
 * Prevents GPT from free-associating "barber topics" instead of following a lesson arc.
 */
const INTRO_LESSON_SCENE_SPINE = `
You must follow this exact 8-scene structure. Do not add scenes. Do not remove scenes. Do not reorder them.

Scene 1 — What barbers do every day
  Services performed. Who they serve. Why it matters as a career. No history. No culture. Just the job.

Scene 2 — Barbering as a licensed profession
  Licensing requirement in Indiana. Why licensure exists. What it protects (client safety, professional standards).

Scene 3 — How the apprenticeship works
  DOL-registered apprenticeship model. On-the-job learning + related technical instruction. Hours requirement.

Scene 4 — Professional standards from day one
  What is expected of an apprentice immediately: sanitation, punctuality, dress, conduct, client safety mindset.

Scene 5 — Tools and their purpose
  Core tools: clippers, guards, combs, shears, razor. What each is used for. Why tool knowledge comes before client work.

Scene 6 — Client communication is a technical skill
  Consultation before every service. Listening, confirming, managing expectations. Why this is not optional.

Scene 7 — What success looks like in this program
  Concrete milestones: competency sign-offs, checkpoint quizzes, hours logged, state board prep. What "done" means.

Scene 8 — Recap and what comes next
  Summarize scenes 1–7 in one sentence each. Preview the next lesson topic. No new content.`;

export function buildSceneGenerationUserPrompt(opts: {
  lessonId: string;
  title: string;
  content: string;
  seed: string;
  lessonType?: 'intro' | 'skill' | 'theory' | 'review';
  sceneCount?: number;
}): string {
  const isIntro = opts.lessonType === 'intro' || opts.lessonId.endsWith('-1') || opts.lessonId.endsWith('lesson-1');
  const sceneCount = opts.sceneCount ?? 8;

  const spineBlock = isIntro
    ? INTRO_LESSON_SCENE_SPINE
    : `\nGenerate ${sceneCount} scenes that follow a clear instructional arc: establish context → teach core concept → show application → recap. Every scene must map directly to the lesson objective.`;

  return `Generate a scene plan for this barber apprenticeship lesson.

LESSON ID: ${opts.lessonId}
TITLE: ${opts.title}
SEED: ${opts.seed}
CONTENT:
${opts.content.slice(0, 3000)}
${spineBlock}

Return JSON matching this exact shape — one object per scene, no extras:
{
  "lessonId": "${opts.lessonId}",
  "title": "${opts.title}",
  "voice": "onyx",
  "videoStyle": "barber_broll",
  "targetResolution": "1920x1080",
  "scenes": [
    {
      "id": "scene-1",
      "order": 1,
      "instructionalObjective": "Learner can describe what a barber does and why licensure matters",
      "narration": "Barbering is a licensed trade. Every day, barbers perform haircuts, fades, shaves, and beard trims for paying clients. In Indiana, doing that work legally requires a state-issued license — and this apprenticeship is how you earn it.",
      "caption": "What barbers do every day",
      "subcaption": "Licensed trade. Real clients. Real skills.",
      "videoQuery": "barber cutting hair with clippers client chair",
      "visualFocus": "Barber actively cutting a client's hair with clippers, client seated in barber chair",
      "layout": "lower_third",
      "minClipSeconds": 6,
      "maxClipSeconds": 12,
      "transitionIn": "fade",
      "transitionOut": "cut"
    }
  ]
}`;
}
