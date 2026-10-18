// Applies to newly authored lessons; saved approved checkpoints remain unchanged.
export function assertGeneratedLessonAssessment(assessment) {
  if (!Array.isArray(assessment?.questions) || assessment.questions.length < 2)
    throw new Error('BLUEPRINT_MULTIPLE_QUESTIONS_REQUIRED');
  if (!Array.isArray(assessment?.reassessment) || assessment.reassessment.length < 2)
    throw new Error('BLUEPRINT_DISTINCT_REASSESSMENT_REQUIRED');
}
