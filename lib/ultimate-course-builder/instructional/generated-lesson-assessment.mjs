// Applies to newly authored lessons; saved approved checkpoints remain unchanged.
export function assertGeneratedLessonAssessment(assessment) {
  if (!Array.isArray(assessment?.questions) || assessment.questions.length !== 5)
    throw new Error('BLUEPRINT_FIVE_QUESTION_RECAP_REQUIRED');
  if (!Array.isArray(assessment?.reassessment) || assessment.reassessment.length < 2)
    throw new Error('BLUEPRINT_DISTINCT_REASSESSMENT_REQUIRED');
}
