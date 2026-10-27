/**
 * Original, provider-neutral instructional contract used by the AI course builder.
 * It describes the learning experience, not any publisher's protected content.
 */

export type LearningExperienceProfile = 'concept' | 'hands_on_procedure' | 'review_exam';

export type LearningPhase =
  | 'objectives'
  | 'why_it_matters'
  | 'pre_assessment'
  | 'instruction'
  | 'knowledge_check'
  | 'full_demonstration'
  | 'step_microvideos'
  | 'guided_practice'
  | 'rubric'
  | 'evidence_submission'
  | 'discussion'
  | 'review'
  | 'flashcards'
  | 'assessment';

export type MediaEvidencePolicy = {
  /** Stock media may establish setting or context, but cannot prove a physical technique. */
  stockFootageContextOnly: boolean;
  criticalProcedureMedia: Array<'original_capture' | 'licensed_demonstration'>;
  requireHumanTechnicalReview: boolean;
};

export type LearningExperienceContract = {
  profile: LearningExperienceProfile;
  requiredPhases: LearningPhase[];
  mediaPolicy: MediaEvidencePolicy;
  requireStepLevelObjectives: boolean;
  requireCorrectVsIncorrect: boolean;
};

const SAFE_MEDIA_POLICY: MediaEvidencePolicy = {
  stockFootageContextOnly: true,
  criticalProcedureMedia: ['original_capture', 'licensed_demonstration'],
  requireHumanTechnicalReview: true,
};

export const LEARNING_EXPERIENCE_CONTRACTS: Record<
  LearningExperienceProfile,
  LearningExperienceContract
> = {
  concept: {
    profile: 'concept',
    requiredPhases: [
      'objectives',
      'why_it_matters',
      'pre_assessment',
      'instruction',
      'knowledge_check',
      'discussion',
      'review',
      'flashcards',
      'assessment',
    ],
    mediaPolicy: SAFE_MEDIA_POLICY,
    requireStepLevelObjectives: false,
    requireCorrectVsIncorrect: true,
  },
  hands_on_procedure: {
    profile: 'hands_on_procedure',
    requiredPhases: [
      'objectives',
      'why_it_matters',
      'pre_assessment',
      'instruction',
      'knowledge_check',
      'full_demonstration',
      'step_microvideos',
      'guided_practice',
      'rubric',
      'evidence_submission',
      'discussion',
      'review',
      'flashcards',
      'assessment',
    ],
    mediaPolicy: SAFE_MEDIA_POLICY,
    requireStepLevelObjectives: true,
    requireCorrectVsIncorrect: true,
  },
  review_exam: {
    profile: 'review_exam',
    requiredPhases: ['objectives', 'pre_assessment', 'review', 'flashcards', 'assessment'],
    mediaPolicy: SAFE_MEDIA_POLICY,
    requireStepLevelObjectives: false,
    requireCorrectVsIncorrect: false,
  },
};

export function missingLearningPhases(
  profile: LearningExperienceProfile,
  present: readonly string[],
): LearningPhase[] {
  const actual = new Set(present);
  return LEARNING_EXPERIENCE_CONTRACTS[profile].requiredPhases.filter(
    (phase) => !actual.has(phase),
  );
}

/** Selects the universal experience without tying the engine to one occupation. */
export function resolveLearningExperienceProfile(input: {
  lessonType?: string | null;
  practicalRequired?: boolean | null;
}): LearningExperienceProfile {
  const lessonType = input.lessonType?.toLowerCase() ?? '';
  if (['quiz', 'exam', 'checkpoint', 'review', 'final_exam'].includes(lessonType)) {
    return 'review_exam';
  }
  if (
    input.practicalRequired ||
    ['practical', 'procedure', 'lab', 'fieldwork', 'observation', 'skill'].includes(lessonType)
  ) {
    return 'hands_on_procedure';
  }
  return 'concept';
}

export type GeneratedLearningExperience = {
  profile: LearningExperienceProfile;
  phases: Array<{ phase: LearningPhase; order: number; required: true }>;
  mediaPolicy: MediaEvidencePolicy;
};

/** Deterministic skeleton filled with original content by the AI generation stages. */
export function buildLearningExperience(input: {
  lessonType?: string | null;
  practicalRequired?: boolean | null;
}): GeneratedLearningExperience {
  const profile = resolveLearningExperienceProfile(input);
  const contract = LEARNING_EXPERIENCE_CONTRACTS[profile];
  return {
    profile,
    phases: contract.requiredPhases.map((phase, index) => ({
      phase,
      order: index + 1,
      required: true,
    })),
    mediaPolicy: contract.mediaPolicy,
  };
}
