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
- Do not reproduce proprietary textbook language, images, diagrams, videos, or test questions.
- AI may create original scripts, narration, diagrams, scenarios, and storyboards. It must never imply that generated or stock imagery demonstrates an exact regulated hand technique.
- Tag every scene with assetRequirement. Use stock_context only for environment/context, generated_diagram for explanatory graphics, and original_capture or licensed_demonstration for procedure_step and critical_closeup scenes.
- Build one memorable teaching model for the lesson. Give it a short name, a plain-language map, a memory anchor, one misconception to correct, and a transfer question.
- For an eight-scene lesson use this instructional sequence: problem_hook, mental_model, system_diagram, equipment_closeup or field_scenario, worked_example, common_mistake or safety_warning, memory_recap, knowledge_check.
- A knowledge_check must ask the learner to apply the model to a new situation; it must not merely repeat a definition.
- Use deterministic diagrams for invisible systems, pressure/temperature relationships, refrigerant flow, electrical paths, or regulatory decision rules.`;

export function buildSceneGenerationUserPrompt(opts: {
  lessonId: string;
  title: string;
  content: string;
  seed: string;
  profile: InstructionalDomainProfile;
  lessonType?: string;
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
  const isProcedure =
    opts.lessonType === 'procedure' ||
    opts.lessonType === 'skill' ||
    opts.requiresPracticalEvidence;
  const arc = isIntro
    ? opts.profile.introductionArc.map((item, index) => `Scene ${index + 1}: ${item}`).join('\n')
    : isProcedure
      ? `Create ${sceneCount} scenes covering service setup; sanitation/PPE check; numbered procedure steps; critical close-ups; correct-versus-incorrect technique; quality check; cleanup/aftercare; learner evidence capture. The plan is both a full demonstration and a source for one microvideo per numbered procedure step.`
      : `Create ${sceneCount} scenes in this arc: problem hook; memorable mental model; exact system diagram; equipment close-up or field scenario; worked example; common mistake or safety warning; memory recap; application-based knowledge check.`;

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
{"lessonId":"${opts.lessonId}","title":"${opts.title}","voice":"onyx","videoStyle":"${opts.profile.videoStyle}","targetResolution":"1920x1080","teachingModel":{"name":"Short memorable model name","memoryAnchor":"A concise memory anchor","plainLanguageMap":"How the parts and relationships work in plain language","misconception":"A likely misconception and its correction","transferQuestion":"A new situation where the learner applies the model"},"scenes":[{"id":"scene-1","order":1,"sceneType":"problem_hook","instructionalObjective":"Observable learner outcome","dolCompetencyId":"${opts.dolCompetencyId ?? 'not-applicable'}","stateRequirement":"${opts.stateRequirement ?? 'not-supplied'}","examDomain":"${opts.examDomain ?? 'not-supplied'}","demonstrationStep":"Exact action or diagram","evidenceExpectation":"Required learner or verifier evidence","narration":"Two to four original instructional sentences.","caption":"Concrete on-screen instruction","subcaption":"One supporting line","videoQuery":"Specific obtainable footage or diagram","visualFocus":"Exact visible action","assetRequirement":"stock_context","procedureStepNumber":1,"layout":"lower_third","minClipSeconds":6,"maxClipSeconds":12,"transitionIn":"fade","transitionOut":"cut"}]}`;
}
