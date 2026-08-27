import type { InstructionalDomainProfile } from './domain-profiles';

export const SCENE_GENERATION_SYSTEM_PROMPT = `You create original, standards-governed career and technical education video plans.

HARD RULES:
- Return valid JSON only. No markdown or commentary.
- Every scene must teach a stated lesson objective. Never use decorative filler.
- Treat the supplied source-authority block as binding. Never invent laws, standards, required hours, passing scores, funding eligibility, approval, licensure, or employment claims.
- Keep DOL apprenticeship requirements, state practice rules, certification exams, Credential Engine metadata, and institution requirements separate.
- A video is instruction, not proof of competency or authorization to practice.
- Practical instruction must include preparation/PPE, safety and sanitation, a complete procedure, critical close-ups, correct-versus-incorrect technique, learner practice, evidence capture, and verifier expectations when supported by the source authority.
- Narration must be natural, specific, concise, and free of motivational filler.
- visualFocus and videoQuery must describe the exact physical action or diagram required by the narration.
- Do not repeat visualFocus or videoQuery within one lesson.
- Do not reproduce proprietary textbook language, images, diagrams, videos, or test questions.`;

export function buildSceneGenerationUserPrompt(opts: {
  lessonId: string;
  title: string;
  content: string;
  seed: string;
  profile: InstructionalDomainProfile;
  lessonType?: 'intro' | 'skill' | 'theory' | 'review';
  sceneCount?: number;
  occupationTitle?: string;
  dolCompetencyId?: string | null;
  dolCompetencyDescription?: string | null;
  rtiRequirement?: string | null;
  rtiHours?: number | null;
  stateAuthority?: string | null;
  stateStandardVersion?: string | null;
  stateRequirement?: string | null;
  examDomain?: string | null;
  passingScore?: number | null;
  requiresPracticalEvidence?: boolean;
}): string {
  const sceneCount = opts.sceneCount ?? 8;
  const isIntro = opts.lessonType === 'intro';
  const arc = isIntro
    ? opts.profile.introductionArc.map((item, index) => `Scene ${index + 1}: ${item}`).join('\n')
    : `Create ${sceneCount} scenes in this arc: establish context; teach the concept; demonstrate or visualize it; show correct application; check understanding; recap.`;

  return `Create an original ${opts.profile.label} instructional video plan.

DOMAIN PROFILE:
KEY: ${opts.profile.key}
STYLE: ${opts.profile.videoStyle}
VISUAL VOCABULARY: ${opts.profile.visualVocabulary.join('; ')}
SAFETY FOCUS: ${opts.profile.safetyFocus.join('; ')}
PROHIBITED CLAIMS: ${opts.profile.prohibitedClaims.join('; ')}

SOURCE AUTHORITY:
OCCUPATION: ${opts.occupationTitle ?? opts.profile.label}
DOL APPENDIX A COMPETENCY: ${opts.dolCompetencyId ?? 'Not applicable'} — ${opts.dolCompetencyDescription ?? 'Not supplied'}
RELATED TECHNICAL INSTRUCTION: ${opts.rtiRequirement ?? 'Not supplied'}${opts.rtiHours ? ` (${opts.rtiHours} governed hours)` : ''}
STATE AUTHORITY: ${opts.stateAuthority ?? 'Not supplied'}
STATE STANDARD VERSION: ${opts.stateStandardVersion ?? 'Not supplied'}
STATE REQUIREMENT: ${opts.stateRequirement ?? 'Not supplied'}
EXAM DOMAIN: ${opts.examDomain ?? 'Not supplied'}
PASSING SCORE: ${opts.passingScore ?? 'Do not state a score'}
PRACTICAL EVIDENCE REQUIRED: ${opts.requiresPracticalEvidence ? 'Yes' : 'Not supplied'}

LESSON ID: ${opts.lessonId}
TITLE: ${opts.title}
SEED: ${opts.seed}
CONTENT:
${opts.content.slice(0, 3000)}

SCENE ARC:
${arc}

Return exactly ${sceneCount} scenes using this JSON shape:
{"lessonId":"${opts.lessonId}","title":"${opts.title}","voice":"onyx","videoStyle":"${opts.profile.videoStyle}","targetResolution":"1920x1080","scenes":[{"id":"scene-1","order":1,"instructionalObjective":"Observable learner outcome","dolCompetencyId":"${opts.dolCompetencyId ?? 'not-applicable'}","stateRequirement":"${opts.stateRequirement ?? 'not-supplied'}","examDomain":"${opts.examDomain ?? 'not-supplied'}","demonstrationStep":"Exact action or diagram","evidenceExpectation":"Required learner or verifier evidence","narration":"Two to four original instructional sentences.","caption":"Concrete on-screen instruction","subcaption":"One supporting line","videoQuery":"Specific obtainable footage or diagram","visualFocus":"Exact visible action","layout":"lower_third","minClipSeconds":6,"maxClipSeconds":12,"transitionIn":"fade","transitionOut":"cut"}]}`;
}
