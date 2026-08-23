import type { CredentialBlueprint } from '@/lib/curriculum/blueprints/types';
import { buildDeterministicLessonBaseline } from './deterministic-content';
import { inferStepType } from './validator';

function deterministicAssessmentQuestions(input: {
  lessonSlug: string;
  lessonTitle: string;
  moduleTitle: string;
  objective: string;
  count: number;
}) {
  const { lessonSlug, lessonTitle, moduleTitle, objective, count } = input;
  const stems = [
    {
      question: `What is the best first step when applying ${lessonTitle}?`,
      options: ['Define the goal and gather relevant evidence', 'Choose the first familiar answer', 'Skip documentation', 'Assume missing facts'],
      correctAnswer: 0,
      explanation: 'A defensible decision starts by defining the goal and gathering evidence.',
    },
    {
      question: `Which approach best supports a decision about ${lessonTitle}?`,
      options: ['Compare reasonable options against current evidence', 'Rely on an unsupported assumption', 'Ignore constraints', 'Avoid reviewing results'],
      correctAnswer: 0,
      explanation: 'Comparing options against evidence produces an explainable decision.',
    },
    {
      question: `What should happen after an action related to ${lessonTitle} is completed?`,
      options: ['Review the outcome and complete required follow-up', 'Delete the supporting evidence', 'Assume success', 'Restart unrelated work'],
      correctAnswer: 0,
      explanation: 'Review confirms whether the intended outcome was achieved and whether follow-up is required.',
    },
    {
      question: `If important information about ${lessonTitle} is missing, what is the strongest next action?`,
      options: ['Obtain the missing information before making an unsupported conclusion', 'Invent a value', 'Ignore the gap', 'Choose randomly'],
      correctAnswer: 0,
      explanation: 'Missing evidence should be resolved rather than replaced with an unsupported claim.',
    },
    {
      question: `Why should a ${lessonTitle} decision be documented?`,
      options: ['So another person can understand the evidence, action, and follow-up', 'To avoid accountability', 'To replace the objective', 'To remove the need for review'],
      correctAnswer: 0,
      explanation: 'Documentation preserves evidence and makes the reasoning reviewable.',
    },
    {
      question: `What should you do when conditions affecting ${lessonTitle} change?`,
      options: ['Revisit assumptions and update the plan using current evidence', 'Keep the old answer automatically', 'Ignore new facts', 'Remove the objective'],
      correctAnswer: 0,
      explanation: 'Changed conditions require reassessment using current evidence.',
    },
    {
      question: `Which result best demonstrates mastery of ${objective}?`,
      options: ['Explain and apply the objective using evidence in a realistic situation', 'Repeat a phrase without applying it', 'Skip the practice task', 'Guess until correct'],
      correctAnswer: 0,
      explanation: 'Mastery requires accurate explanation and application, not guessing.',
    },
    {
      question: `A learner repeatedly misses the same ${lessonTitle} objective. What is the appropriate response?`,
      options: ['Complete targeted remediation and retry the objective-aligned practice', 'Restart every completed module', 'Ignore the weak objective', 'Mark mastery anyway'],
      correctAnswer: 0,
      explanation: 'Targeted remediation addresses the demonstrated gap without discarding completed work.',
    },
    {
      question: `Which evidence is strongest when evaluating work in ${moduleTitle}?`,
      options: ['Current approved course/workplace evidence tied to the objective', 'An unsupported guess', 'An unrelated example', 'A stale assumption known to be wrong'],
      correctAnswer: 0,
      explanation: 'Evidence should be current, relevant, and tied to the learning objective.',
    },
    {
      question: `What makes a professional ${lessonTitle} decision explainable?`,
      options: ['A clear goal, verified facts, compared options, documented action, and reviewed result', 'Speed alone', 'Personal preference without evidence', 'Skipping constraints'],
      correctAnswer: 0,
      explanation: 'An explainable decision connects evidence and reasoning to the selected action.',
    },
  ];

  return Array.from({ length: count }, (_, index) => {
    const base = stems[index % stems.length];
    const cycle = Math.floor(index / stems.length) + 1;
    return {
      id: `${lessonSlug}-baseline-q${index + 1}`,
      ...base,
      question: cycle === 1 ? base.question : `${base.question} (Application set ${cycle})`,
    };
  });
}

/**
 * Assemble a complete, substantive registered-blueprint package without inference.
 * This is not a second Course Factory: it only fills the canonical blueprint
 * contract consumed by the existing private factory/publisher.
 */
export function buildDeterministicCoursePackage(
  blueprint: CredentialBlueprint,
  courseTitle: string,
): CredentialBlueprint {
  return {
    ...blueprint,
    modules: blueprint.modules.map((courseModule) => ({
      ...courseModule,
      lessons: (courseModule.lessons ?? []).map((lesson) => {
        const baseline = buildDeterministicLessonBaseline({
          courseTitle,
          module: courseModule,
          lesson,
        });
        const stepType = inferStepType(lesson.slug);
        const questionCount = stepType === 'exam' ? 25 : ['checkpoint', 'quiz'].includes(stepType) ? 10 : 3;
        const quizQuestions = deterministicAssessmentQuestions({
          lessonSlug: lesson.slug,
          lessonTitle: lesson.title,
          moduleTitle: courseModule.title,
          objective: baseline.objective,
          count: questionCount,
        });
        const content = {
          ...baseline.content,
          experience: {
            ...baseline.experience,
            knowledgeChecks: quizQuestions.slice(0, 3).map((question) => ({
              question: question.question,
              options: question.options,
              correct: question.correctAnswer,
              explanation: question.explanation,
            })),
          },
        };
        return {
          ...lesson,
          objective: baseline.objective,
          learningObjectives: baseline.learningObjectives,
          content: JSON.stringify(content),
          learningPoints: baseline.bulletPoints,
          scenario: baseline.content.scenario,
          quizQuestions,
          script: baseline.script,
          scriptText: baseline.script,
          bulletPoints: baseline.bulletPoints,
          aiGenerated: false,
        } as typeof lesson;
      }),
    })),
  };
}
