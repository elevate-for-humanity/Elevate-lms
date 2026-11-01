import type { CredentialBlueprint } from '@/lib/curriculum/blueprints/types';
import { compileLearningIntelligence } from '@/lib/course-factory/learning-intelligence';
import { CourseExperienceSchema } from '@/lib/course-factory/experience-contract';
import { inferStepType } from '@/lib/course-factory/validator';
function isAssessmentStep(stepType: string): boolean {
  return ['checkpoint', 'quiz', 'exam'].includes(stepType);
}

export function synchronizeLessonExperience(
  lesson: Record<string, any>,
  courseModule: CredentialBlueprint['modules'][number],
): void {
  if (typeof lesson.content !== 'string' || !lesson.content.trim()) return;
  let content: Record<string, any>;
  try {
    content = JSON.parse(lesson.content) as Record<string, any>;
  } catch {
    return;
  }
  if (!content.experience || typeof content.experience !== 'object') return;

  const questions = Array.isArray(lesson.quizQuestions) ? lesson.quizQuestions : [];
  content.experience.knowledgeChecks = questions.map((question: Record<string, any>) => ({
    question: question.question,
    options: question.options,
    correct: question.correctAnswer,
    explanation: question.explanation,
  }));

  const objectives = Array.from(
    new Set(
      [
        ...(Array.isArray(lesson.learningObjectives) ? lesson.learningObjectives : []),
        lesson.objective,
        ...(Array.isArray(lesson.learningPoints) ? lesson.learningPoints : []),
      ]
        .filter(
          (objective: unknown): objective is string =>
            typeof objective === 'string' && objective.trim().length > 0,
        )
        .map((objective) => objective.trim()),
    ),
  );
  content.experience.remediation = {
    ...(content.experience.remediation ?? {}),
    passingScore: lesson.passingScore ?? content.experience.remediation?.passingScore ?? 80,
    reviewMessage:
      content.experience.remediation?.reviewMessage ??
      'Review missed objectives, replay the relevant lesson section, and retry before continuing.',
    objectiveMap: questions.map(
      (_: unknown, index: number) =>
        objectives[index % objectives.length] ??
        `Demonstrate mastery of ${lesson.title || courseModule.title}.`,
    ),
  };
  const stepType = inferStepType(String(lesson.slug ?? ''));
  const moduleCompetencyKeys = (courseModule.competencies ?? [])
    .map((competency) => competency.competencyKey)
    .filter(Boolean);
  const selectedCompetencyKeys =
    Array.isArray(lesson.competencyKeys) && lesson.competencyKeys.length
      ? lesson.competencyKeys
      : moduleCompetencyKeys;
  const critical = (courseModule.competencies ?? []).some(
    (competency) =>
      competency.isCritical && selectedCompetencyKeys.includes(competency.competencyKey),
  );
  content.experience.intelligence = compileLearningIntelligence({
    lessonSlug: String(lesson.slug),
    lessonTitle: String(lesson.title),
    domainKey: String(lesson.domainKey || courseModule.domainKey || courseModule.slug),
    competencyKeys: selectedCompetencyKeys,
    objectives,
    masteryThreshold: lesson.passingScore ?? content.experience.remediation.passingScore,
    assessment: isAssessmentStep(stepType),
    practical: ['lab', 'assignment'].includes(stepType) || Boolean(lesson.practicalRequired),
    critical,
    criticalMasteryThreshold: 100,
  });
  lesson.content = JSON.stringify(content);
}

export function hasGovernedBlueprintLessonFallback(lesson: {
  content?: unknown;
  quizQuestions?: unknown;
}): boolean {
  const raw =
    typeof lesson.content === 'string'
      ? lesson.content
      : lesson.content && typeof lesson.content === 'object'
        ? JSON.stringify(lesson.content)
        : '';
  const instructionalWords =
    raw.replace(/<[^>]+>/g, ' ').match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0;
  let hasCompleteExperience = false;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    hasCompleteExperience = CourseExperienceSchema.safeParse(parsed.experience).success;
  } catch {
    hasCompleteExperience = false;
  }
  return (
    instructionalWords >= 180 &&
    Array.isArray(lesson.quizQuestions) &&
    lesson.quizQuestions.length >= 3 &&
    hasCompleteExperience
  );
}
