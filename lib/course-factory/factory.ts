/**
 * Canonical Course Factory.
 *
 * This is the single course-creation orchestration boundary. Authoring surfaces,
 * automatic program provisioning, and scripts call this module instead of
 * assembling courses with independent generation/publish pipelines.
 *
 * Flow:
 * 1. Resolve program + registered blueprint, or generate a free-form blueprint
 * 2. Enrich every learner-facing lesson
 * 3. Generate checkpoint/final assessment banks
 * 4. Validate the complete course package
 * 5. Persist courses -> modules -> lessons through the canonical publisher
 * 6. Queue missing media when requested
 */

import { isAIAvailable } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';
import { queueCourseLessonVideos } from './media-service';
import { requireAdminClient } from '@/lib/supabase/admin';
import type { CredentialBlueprint } from '@/lib/curriculum/blueprints/types';
import { loadBlueprintWithProgram } from './blueprint-loader';
import {
  generateAssessment,
  generateBlueprintFromAI,
  generateFinalExam,
  generateLessonContent,
} from './content-generator';
import { publishCourse } from './publisher';
import { buildCourseEvidenceContext } from './evidence-context';
import { compileLearningIntelligence } from './learning-intelligence';
import { inferStepType, validateBlueprint } from './validator';
import type { FactoryInput, FactoryOutput, FactoryStage, ProgressCallback } from './types';

class ProgressTracker {
  private callbacks: ProgressCallback[] = [];

  addCallback(cb: ProgressCallback) {
    this.callbacks.push(cb);
  }

  emit(stage: FactoryStage, message: string, progress?: number) {
    for (const cb of this.callbacks) cb(stage, message, progress);
    logger.info(`[course-factory] ${stage}: ${message}`);
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90);
}

function cloneBlueprint(blueprint: CredentialBlueprint): CredentialBlueprint {
  return {
    ...blueprint,
    modules: blueprint.modules.map((courseModule) => ({
      ...courseModule,
      lessons: (courseModule.lessons ?? []).map((lesson) => ({ ...lesson })),
    })),
  };
}

function normalizeGeneratedSlug(slug: string, stepType: string, fallback: string): string {
  const base = slugify(slug || fallback);
  if (stepType === 'checkpoint' && !base.includes('checkpoint')) return `${base}-checkpoint`;
  if (stepType === 'quiz' && !base.includes('quiz')) return `${base}-quiz`;
  if (stepType === 'exam' && !base.includes('exam') && !base.includes('final'))
    return `${base}-exam`;
  if (stepType === 'lab' && !base.includes('lab')) return `${base}-lab`;
  if (stepType === 'assignment' && !base.includes('assignment')) return `${base}-assignment`;
  return base;
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
  content.experience.intelligence = compileLearningIntelligence({
    lessonSlug: String(lesson.slug),
    lessonTitle: String(lesson.title),
    domainKey: String(lesson.domainKey || courseModule.domainKey || courseModule.slug),
    competencyKeys: Array.isArray(lesson.competencyKeys) && lesson.competencyKeys.length
      ? lesson.competencyKeys
      : moduleCompetencyKeys,
    objectives,
    masteryThreshold: lesson.passingScore ?? content.experience.remediation.passingScore,
    assessment: isAssessmentStep(stepType),
    practical: ['lab', 'assignment'].includes(stepType) || Boolean(lesson.practicalRequired),
  });
  lesson.content = JSON.stringify(content);
}

async function generateFreeFormBlueprint(
  input: FactoryInput,
  programSlug: string,
): Promise<CredentialBlueprint> {
  if (!input.title || !input.topic) {
    throw new Error('title and topic are required when no registered blueprint exists');
  }

  const topic = [
    input.topic,
    input.hours ? `Target training hours: ${input.hours}.` : '',
    input.deliveryFormat ? `Delivery format: ${input.deliveryFormat}.` : '',
    input.additionalRequirements ? `Additional requirements: ${input.additionalRequirements}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const raw = await generateBlueprintFromAI({
    title: input.title,
    topic,
    audience: input.audience ?? `${input.difficulty ?? 'intermediate'} workforce learner`,
    hours: input.hours,
    state: input.state,
    credential: input.credential,
    moduleCount: input.moduleCount,
    lessonsPerModule: input.lessonsPerModule,
  });

  const modules = (raw.modules ?? []).map((courseModule, moduleIndex) => {
    const lessons = (courseModule.lessons ?? []).map((lesson, lessonIndex) => {
      const stepType = lesson.stepType || 'lesson';
      return {
        slug: normalizeGeneratedSlug(
          lesson.slug,
          stepType,
          `${courseModule.title}-${lesson.title || lessonIndex + 1}`,
        ),
        title: lesson.title || `Lesson ${lessonIndex + 1}`,
        order: lessonIndex + 1,
        domainKey: slugify(courseModule.title),
      };
    });

    const typeCounts = lessons.reduce<Record<string, number>>((counts, lesson) => {
      const type = inferStepType(lesson.slug);
      counts[type] = (counts[type] ?? 0) + 1;
      return counts;
    }, {});

    return {
      slug: slugify(courseModule.title || `module-${moduleIndex + 1}`),
      title: courseModule.title || `Module ${moduleIndex + 1}`,
      description: courseModule.description,
      orderIndex: moduleIndex + 1,
      minLessons: lessons.length,
      maxLessons: lessons.length,
      quizRequired: Boolean(typeCounts.checkpoint || typeCounts.quiz),
      practicalRequired: Boolean(typeCounts.lab || typeCounts.assignment),
      isCritical: true,
      requiredLessonTypes: Object.entries(typeCounts).map(([lessonType, requiredCount]) => ({
        lessonType,
        requiredCount,
      })),
      competencies: [],
      domainKey: slugify(courseModule.title),
      lessons,
    };
  });

  const expectedLessonCount = modules.reduce(
    (count, courseModule) => count + courseModule.lessons.length,
    0,
  );
  const credentialTitle = input.credential || raw.title || input.title;
  const credentialCode = slugify(input.credential || input.title)
    .toUpperCase()
    .slice(0, 24);

  return {
    id: `generated-${programSlug}-${Date.now().toString(36)}`,
    programSlug,
    credentialSlug: slugify(credentialTitle),
    credentialTitle,
    credentialCode,
    state: input.state ?? 'federal',
    status: 'draft',
    version: '1.0.0',
    title: raw.title || input.title,
    description: raw.description,
    expectedModuleCount: modules.length,
    expectedLessonCount,
    modules,
    assessmentRules: [
      {
        assessmentType: 'module',
        scope: 'all',
        minQuestions: 8,
        maxQuestions: 10,
        passingThreshold: 0.7,
      },
      {
        assessmentType: 'final',
        scope: 'all',
        minQuestions: 25,
        maxQuestions: 40,
        passingThreshold: 0.75,
      },
    ],
    generationRules: {
      provider: 'ai',
      temperature: 0.5,
      originalContentRequired: true,
    },
  } as CredentialBlueprint;
}

function isAssessmentStep(stepType: string): boolean {
  return stepType === 'checkpoint' || stepType === 'quiz' || stepType === 'exam';
}

export function hasGovernedBlueprintLessonFallback(lesson: {
  content?: unknown;
  quizQuestions?: unknown;
}): boolean {
  const raw = typeof lesson.content === 'string'
    ? lesson.content
    : lesson.content && typeof lesson.content === 'object'
      ? JSON.stringify(lesson.content)
      : '';
  const instructionalWords = raw
    .replace(/<[^>]+>/g, ' ')
    .match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0;
  return instructionalWords >= 180 &&
    Array.isArray(lesson.quizQuestions) && lesson.quizQuestions.length >= 3;
}

async function enrichBlueprint(
  blueprint: CredentialBlueprint,
  courseTitle: string,
  input: FactoryInput,
  progress: ProgressTracker,
): Promise<{ blueprint: CredentialBlueprint; assessmentsGenerated: number }> {
  const enriched = cloneBlueprint(blueprint);
  const totalLessons = enriched.modules.reduce(
    (sum, courseModule) => sum + (courseModule.lessons ?? []).length,
    0,
  );
  let lessonCounter = 0;
  let assessmentsGenerated = 0;

  for (const courseModule of enriched.modules) {
    const lessons = courseModule.lessons ?? [];
    for (const lesson of lessons) {
      lessonCounter += 1;
      const stepType = inferStepType(lesson.slug);
      progress.emit(
        isAssessmentStep(stepType) ? 'assess' : 'enrich',
        `Building ${lesson.title}`,
        Math.max(5, Math.min(75, Math.round((lessonCounter / Math.max(totalLessons, 1)) * 70))),
      );

      if (stepType === 'exam') {
        const finalExam = await generateFinalExam(
          courseTitle,
          enriched.modules.length,
          25,
          enriched.modules
            .filter((module) => inferStepType(module.slug) !== 'exam')
            .map(
              (module) =>
                `${module.title}: ${(module.competencies ?? []).map((competency) => competency.competencyKey).join(', ') || module.domainKey || module.slug}`,
            ),
          lesson.slug,
        );
        lesson.objective =
          lesson.objective || `Demonstrate cumulative readiness for ${courseTitle}.`;
        lesson.content = JSON.stringify({
          html: `<h2>${lesson.title}</h2><p>This cumulative assessment measures readiness across the complete course.</p>`,
          learning_points: [],
          scenario: '',
          experience: {
            readingGuide: {
              title: lesson.title,
              summary:
                'Complete this cumulative readiness assessment after reviewing all instructional modules and remediation guidance.',
              sections: [
                {
                  heading: 'Readiness',
                  body: 'Use your lesson notes, practice activities, and remediation feedback to prepare for this cumulative assessment and demonstrate course-wide competency.',
                },
                {
                  heading: 'Assessment Strategy',
                  body: 'Read every question carefully, apply the evidence and decision rules taught in the course, and select the response best supported by the instructional material.',
                },
                {
                  heading: 'After the Exam',
                  body: 'Review any missed objectives, complete the targeted remediation actions, and retry only after you can explain why the corrected answer is supported.',
                },
              ],
              keyTakeaways: [
                'Apply course-wide evidence.',
                'Use targeted remediation after missed objectives.',
                'Demonstrate mastery before completion.',
              ],
            },
            narrationScript:
              'You have reached the cumulative readiness assessment. Use the concepts, calculations, scenarios, and practical decisions you practiced throughout the course. Read each item carefully and rely on evidence rather than guessing.',
            visualPrompt:
              'Professional learner completing a cumulative workforce readiness assessment at a modern computer workstation with organized notes and progress evidence visible.',
            flashcards: [
              {
                id: 'exam-1',
                front: 'Readiness',
                back: 'Demonstrated ability to apply course competencies accurately and consistently.',
                tags: ['final'],
              },
              {
                id: 'exam-2',
                front: 'Evidence',
                back: 'Information used to support a correct workplace or business decision.',
                tags: ['final'],
              },
              {
                id: 'exam-3',
                front: 'Remediation',
                back: 'Targeted review and practice used to correct a weak objective.',
                tags: ['final'],
              },
              {
                id: 'exam-4',
                front: 'Mastery',
                back: 'Performance at or above the required competency threshold.',
                tags: ['final'],
              },
              {
                id: 'exam-5',
                front: 'Application',
                back: 'Using learned knowledge in a realistic decision or task.',
                tags: ['final'],
              },
              {
                id: 'exam-6',
                front: 'Completion',
                back: 'Meeting all required instructional, assessment, and practical requirements.',
                tags: ['final'],
              },
            ],
            quickClips: [
              {
                id: 'final-review',
                title: 'Final readiness review',
                objective: 'Prepare for the cumulative assessment',
                durationSeconds: 120,
                script:
                  'Review the key objectives, calculations, scenarios, and practical decisions from every module. Focus additional time on any domain where your knowledge checks or practice assessments showed weakness.',
                visualPrompt:
                  'Instructor reviewing a concise course readiness checklist with a learner before a cumulative assessment.',
              },
              {
                id: 'final-strategy',
                title: 'Assessment strategy',
                objective: 'Apply evidence-based test strategy',
                durationSeconds: 120,
                script:
                  'For each question, identify what competency is being measured, eliminate choices that conflict with course evidence, and select the response that best applies the standard or decision rule taught in the lessons.',
                visualPrompt:
                  'Learner applying a structured evidence-based assessment strategy at a computer.',
              },
            ],
            knowledgeChecks: finalExam.questions
              .slice(0, 3)
              .map((question) => ({
                question: question.question,
                options: question.options,
                correct: question.correct,
                explanation: question.explanation,
              })),
            scenario: {
              title: 'Readiness decision',
              context:
                'A learner has completed all modules and practice activities but still has one weak domain.',
              question: 'What should the learner do before the final attempt?',
              options: [
                {
                  text: 'Complete targeted remediation for the weak domain.',
                  isCorrect: true,
                  feedback: 'Targeted remediation addresses the identified competency gap.',
                },
                {
                  text: 'Ignore the weak domain and guess.',
                  isCorrect: false,
                  feedback: 'Ignoring evidence does not demonstrate readiness.',
                },
              ],
            },
            caseStudy: {
              title: 'Evidence review',
              context:
                'Practice results show strong performance in most domains and repeated errors in one objective.',
              question: 'Which conclusion is best supported?',
              options: [
                {
                  text: 'The learner needs focused review on the repeated weak objective.',
                  isCorrect: true,
                  feedback: 'Repeated errors are evidence for targeted remediation.',
                },
                {
                  text: 'The learner should skip all further review.',
                  isCorrect: false,
                  feedback: 'The evidence indicates a specific remaining gap.',
                },
              ],
            },
            exercises: [
              {
                id: 'final-plan',
                title: 'Build a final review plan',
                instructions: [
                  'List weak objectives from practice results.',
                  'Assign a specific review and retry action to each objective.',
                ],
                expectedArtifact: 'A targeted final review plan.',
                autoGrade: {
                  type: 'checklist',
                  criteria: ['Weak objectives identified', 'Specific remediation actions assigned'],
                },
              },
            ],
            practicalTask: {
              title: 'Readiness evidence check',
              description:
                'Verify that required course evidence is complete before the final attempt.',
              instructions: [
                'Review module completion.',
                'Review practice assessment results.',
                'Confirm practical evidence and remediation are complete.',
              ],
              evidence: 'Completed readiness evidence checklist.',
            },
            resources: [
              {
                type: 'checklist',
                title: 'Final readiness checklist',
                description: 'Use this checklist before beginning the final assessment.',
                content:
                  'Confirm all modules, knowledge checks, exercises, practical evidence, and remediation actions are complete before starting the final assessment.',
              },
              {
                type: 'reference',
                title: 'Assessment strategy reference',
                description:
                  'Use this reference to apply evidence-based decision making during the final assessment.',
                content:
                  'Identify the tested objective, recall the relevant evidence or rule, eliminate unsupported options, and select the strongest supported answer.',
              },
            ],
            glossary: [
              {
                term: 'Readiness',
                definition: 'Demonstrated preparation to perform the required course competencies.',
              },
              {
                term: 'Mastery',
                definition: 'Performance meeting or exceeding the required threshold.',
              },
              {
                term: 'Evidence',
                definition: 'Observable information supporting a competency decision.',
              },
              {
                term: 'Remediation',
                definition: 'Targeted corrective learning after a demonstrated gap.',
              },
            ],
            remediation: {
              passingScore: 80,
              reviewMessage:
                'Review missed domains and complete targeted remediation before retrying.',
              objectiveMap: [
                'Course-wide knowledge',
                'Applied decision making',
                'Readiness evidence',
              ],
              targetedActions: [
                {
                  objective: 'Missed final-exam objective',
                  action:
                    'Return to the mapped lesson, review its reading and flashcards, complete the exercise, then retry the related practice check.',
                },
              ],
            },
            readiness: {
              domainKey: 'final_readiness',
              masteryThreshold: 80,
              evidenceSignals: [
                'module completion',
                'practice assessment performance',
                'practical evidence',
              ],
            },
          },
        });
        lesson.quizQuestions = finalExam.questions.map((question, questionIndex) => ({
          id: `${lesson.slug}-q-${questionIndex + 1}`,
          question: question.question,
          options: question.options,
          correctAnswer: question.correct,
          explanation: question.explanation,
        }));
        assessmentsGenerated += 1;
        synchronizeLessonExperience(lesson as unknown as Record<string, any>, courseModule);
        continue;
      }

      if (stepType === 'checkpoint' || stepType === 'quiz') {
        const assessment = await generateAssessment({
          lessonSlug: lesson.slug,
          lessonTitle: lesson.title,
          moduleTitle: courseModule.title,
          courseTitle,
          questionCount: 10,
        });
        lesson.objective = lesson.objective || `Demonstrate mastery of ${courseModule.title}.`;
        lesson.content = JSON.stringify({
          html: `<h2>${lesson.title}</h2><p>Use this assessment to verify your understanding before continuing.</p>`,
          learning_points: [],
          scenario: '',
          experience: {
            readingGuide: {
              title: lesson.title,
              summary: `Use this checkpoint to confirm mastery of the key concepts and applied decisions from ${courseModule.title} before continuing.`,
              sections: [
                {
                  heading: 'Review the Module',
                  body: `Review the objectives, examples, flashcards, and applied exercises from ${courseModule.title}. Focus on concepts you cannot yet explain or apply without assistance.`,
                },
                {
                  heading: 'Use Evidence',
                  body: 'For each checkpoint question, connect the answer to a specific concept, rule, calculation, or decision method from the module rather than relying on guessing.',
                },
                {
                  heading: 'Remediate Gaps',
                  body: 'When an answer is missed, identify the underlying objective, return to the named learning material, complete targeted practice, and retry after you can explain the correct reasoning.',
                },
              ],
              keyTakeaways: [
                'Verify module mastery.',
                'Use evidence to answer questions.',
                'Remediate weak objectives before continuing.',
              ],
            },
            narrationScript: `This checkpoint measures your readiness to continue after ${courseModule.title}. Use the concepts and applied practice from the module. If you miss an objective, complete the targeted review before retrying.`,
            visualPrompt: `Professional learner completing a module checkpoint for ${courseModule.title} using organized notes and evidence at a modern workstation.`,
            flashcards: [
              {
                id: 'check-1',
                front: 'Checkpoint',
                back: 'A formative assessment used to verify readiness before progressing.',
                tags: ['checkpoint'],
              },
              {
                id: 'check-2',
                front: 'Evidence',
                back: 'Information from instruction or practice that supports a decision.',
                tags: ['checkpoint'],
              },
              {
                id: 'check-3',
                front: 'Mastery',
                back: 'Performance at or above the required learning threshold.',
                tags: ['checkpoint'],
              },
              {
                id: 'check-4',
                front: 'Objective',
                back: 'A measurable skill or knowledge target for the module.',
                tags: ['checkpoint'],
              },
              {
                id: 'check-5',
                front: 'Remediation',
                back: 'Focused review and practice used to correct a weak objective.',
                tags: ['checkpoint'],
              },
              {
                id: 'check-6',
                front: 'Retry',
                back: 'A new attempt completed after targeted remediation.',
                tags: ['checkpoint'],
              },
            ],
            quickClips: [
              {
                id: 'checkpoint-review',
                title: 'Checkpoint review',
                objective: 'Prepare for the module checkpoint',
                durationSeconds: 120,
                script: `Review the most important objectives from ${courseModule.title}. Use your lesson evidence to identify any concept you cannot yet explain, calculate, or apply confidently before beginning the checkpoint.`,
                visualPrompt: `Instructor reviewing key ${courseModule.title} objectives with a learner before a checkpoint.`,
              },
              {
                id: 'checkpoint-remediation',
                title: 'How to remediate a missed objective',
                objective: 'Use targeted remediation after a missed question',
                durationSeconds: 120,
                script:
                  'When you miss a checkpoint item, identify the mapped objective, return to the relevant reading and example, review the related flashcards, complete the applied exercise, and retry only when you can explain the reasoning.',
                visualPrompt:
                  'Learner following a targeted remediation checklist after a missed checkpoint objective.',
              },
            ],
            knowledgeChecks: assessment.questions
              .slice(0, 3)
              .map((question) => ({
                question: question.question,
                options: question.options,
                correct: question.correct,
                explanation: question.explanation,
              })),
            scenario: {
              title: 'Progression decision',
              context:
                'A learner finishes the module but misses several questions tied to the same objective.',
              question: 'What is the correct next step?',
              options: [
                {
                  text: 'Complete targeted remediation for that objective before retrying.',
                  isCorrect: true,
                  feedback: 'Focused remediation addresses the demonstrated gap.',
                },
                {
                  text: 'Skip the objective and continue without review.',
                  isCorrect: false,
                  feedback: 'Progression should follow demonstrated mastery.',
                },
              ],
            },
            caseStudy: {
              title: 'Checkpoint evidence',
              context:
                'A learner has strong practice results except for one repeated error pattern.',
              question: 'What does the evidence indicate?',
              options: [
                {
                  text: 'One objective needs additional focused practice.',
                  isCorrect: true,
                  feedback: 'Repeated errors identify a targeted gap.',
                },
                {
                  text: 'All learning should be restarted from the beginning.',
                  isCorrect: false,
                  feedback: 'The evidence supports targeted rather than blanket remediation.',
                },
              ],
            },
            exercises: [
              {
                id: 'checkpoint-plan',
                title: 'Map missed objectives',
                instructions: [
                  'Review practice evidence from the module.',
                  'Map each weak objective to a specific lesson and review action.',
                ],
                expectedArtifact: 'A targeted module remediation plan.',
                autoGrade: {
                  type: 'checklist',
                  criteria: ['Weak objectives identified', 'Review actions mapped'],
                },
              },
            ],
            practicalTask: {
              title: 'Module readiness verification',
              description: 'Confirm required module evidence before progression.',
              instructions: [
                'Verify lesson completion.',
                'Verify applied exercises.',
                'Verify remediation for weak objectives.',
              ],
              evidence: 'Completed module readiness checklist.',
            },
            resources: [
              {
                type: 'checklist',
                title: 'Module checkpoint checklist',
                description: 'Use before attempting the checkpoint.',
                content: `Confirm you can explain and apply the key objectives from ${courseModule.title}, then identify any objective needing additional review.`,
              },
              {
                type: 'reference',
                title: 'Targeted remediation guide',
                description: 'Use after a missed checkpoint objective.',
                content:
                  'Identify the objective, return to the mapped lesson, review the relevant reading and flashcards, complete the exercise, and retry the knowledge check.',
              },
            ],
            glossary: [
              {
                term: 'Checkpoint',
                definition: 'A formative assessment used to verify readiness.',
              },
              { term: 'Objective', definition: 'A measurable learning target.' },
              { term: 'Mastery', definition: 'Performance at or above the required threshold.' },
              {
                term: 'Remediation',
                definition: 'Targeted corrective learning for a demonstrated gap.',
              },
            ],
            remediation: {
              passingScore: 80,
              reviewMessage:
                'Review weak objectives and complete targeted practice before retrying.',
              objectiveMap: [
                'Module knowledge',
                'Applied decision making',
                'Progression readiness',
              ],
              targetedActions: [
                {
                  objective: 'Missed checkpoint objective',
                  action:
                    'Return to the mapped lesson, review its reading and flashcards, complete the exercise, then retry the objective-aligned check.',
                },
              ],
            },
            readiness: {
              domainKey: lesson.domainKey || courseModule.domainKey || slugify(courseModule.title),
              masteryThreshold: 80,
              evidenceSignals: [
                'lesson completion',
                'applied exercise completion',
                'checkpoint performance',
              ],
            },
          },
        });
        lesson.quizQuestions = assessment.questions.map((question, questionIndex) => ({
          id: `${lesson.slug}-q-${questionIndex + 1}`,
          question: question.question,
          options: question.options,
          correctAnswer: question.correct,
          explanation: question.explanation,
        }));
        assessmentsGenerated += 1;
        synchronizeLessonExperience(lesson as unknown as Record<string, any>, courseModule);
        continue;
      }

      let generated: Awaited<ReturnType<typeof generateLessonContent>>;
      try {
        generated = await generateLessonContent({
          lesson,
          moduleTitle: courseModule.title,
          courseTitle,
          state: input.state ?? enriched.state,
          standardsBlock: [
            `Required domain: ${lesson.domainKey || courseModule.domainKey || courseModule.slug}`,
            `Required module competencies: ${(courseModule.competencies ?? []).map((competency) => competency.competencyKey).join(', ') || 'Apply the module objective'}`,
            `Blueprint lesson identity: ${lesson.slug} — ${lesson.title}`,
          ].join('\n'),
        });
      } catch (generationError) {
        // Registered blueprints already contain governed, reviewed instruction.
        // A malformed optional AI enrichment must not erase or block that
        // canonical content during a production refresh.
        if (!hasGovernedBlueprintLessonFallback(lesson)) throw generationError;
        logger.warn('[course-factory] AI enrichment failed; preserving governed blueprint lesson', {
          lessonSlug: lesson.slug,
          error: generationError instanceof Error
            ? generationError.message
            : String(generationError),
        });
        synchronizeLessonExperience(lesson as unknown as Record<string, any>, courseModule);
        continue;
      }
      lesson.objective = generated.objective;
      lesson.content = generated.content;
      lesson.learningPoints = generated.learning_points;
      lesson.scenario = generated.scenario;
      lesson.quizQuestions = generated.quiz_questions.map((question, questionIndex) => ({
        id: `${lesson.slug}-q-${questionIndex + 1}`,
        question: question.question,
        options: question.options,
        correctAnswer: question.correct,
        explanation: question.explanation,
      }));
      synchronizeLessonExperience(lesson as unknown as Record<string, any>, courseModule);
    }
  }

  return { blueprint: enriched, assessmentsGenerated };
}

async function resolveProgramSlug(input: FactoryInput): Promise<string> {
  if (input.programSlug?.trim()) return input.programSlug.trim();
  if (input.blueprint?.programSlug) return input.blueprint.programSlug;
  if (!input.programId) return slugify(input.title || 'generated-course');

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('programs')
    .select('slug')
    .eq('id', input.programId)
    .maybeSingle();
  if (error) throw new Error(`Unable to resolve program slug: ${error.message}`);
  return data?.slug || slugify(input.title || 'generated-course');
}

export async function courseFactory(
  input: FactoryInput,
  onProgress?: ProgressCallback,
): Promise<FactoryOutput> {
  const tracker = new ProgressTracker();
  if (onProgress) tracker.addCallback(onProgress);

  try {
    tracker.emit('init', 'Initializing canonical Course Factory.', 1);
    const programSlug = await resolveProgramSlug(input);

    tracker.emit('resolve', 'Resolving program and curriculum source.', 3);
    let blueprint = input.blueprint ? cloneBlueprint(input.blueprint) : null;
    let program: Record<string, any> | null = null;

    if (!blueprint) {
      const db = await requireAdminClient();
      const loaded = await loadBlueprintWithProgram(db, {
        programId: input.programId,
        programSlug,
      });
      blueprint = loaded?.blueprint ? cloneBlueprint(loaded.blueprint) : null;
      program = loaded?.program ?? null;
    }

    if (!blueprint) {
      if (!isAIAvailable()) {
        throw new Error(
          `No registered blueprint found for ${programSlug}, and no AI provider is available.`,
        );
      }
      tracker.emit('blueprint', `Generating a new blueprint for ${programSlug}.`, 5);
      blueprint = await generateFreeFormBlueprint(input, programSlug);
    } else {
      tracker.emit('blueprint', `Blueprint ready: ${blueprint.credentialTitle}`, 5);
    }

    if (!program && input.programId) {
      const db = await requireAdminClient();
      const { data } = await db
        .from('programs')
        .select('*')
        .eq('id', input.programId)
        .maybeSingle();
      program = data;
    }

    tracker.emit('resolve', 'Assembling credential and workforce evidence.', 7);
    const evidence = await buildCourseEvidenceContext({
      programSlug,
      blueprint,
      state: input.state,
    });
    tracker.emit(
      'resolve',
      `Evidence ready from ${evidence.sources.join(', ') || 'registered blueprint'}.`,
      9,
    );

    const audit = validateBlueprint(blueprint, { requireGeneratedContent: false });
    if (!audit.valid) {
      return {
        ok: false,
        errors: audit.errors.map(
          (error) =>
            `${error.module ?? 'course'}/${error.lesson ?? 'package'} [${error.field}]: ${error.message}`,
        ),
        moduleCount: blueprint.modules.length,
        lessonCount: blueprint.modules.reduce(
          (sum, courseModule) => sum + (courseModule.lessons?.length ?? 0),
          0,
        ),
        assessmentsGenerated: 0,
        videosQueued: 0,
      };
    }

    const courseTitle = input.title || blueprint.title || blueprint.credentialTitle;
    if (!isAIAvailable() && input.contentSource !== 'blueprint') {
      throw new Error('AI service is required to generate complete lesson and assessment content.');
    }

    const enriched =
      input.contentSource === 'blueprint'
        ? { blueprint, assessmentsGenerated: 0 }
        : await enrichBlueprint(blueprint, courseTitle, input, tracker);

    tracker.emit('validate', 'Validating the complete generated course package.', 80);
    const packageAudit = validateBlueprint(enriched.blueprint, { requireGeneratedContent: true });
    if (!packageAudit.valid) {
      return {
        ok: false,
        errors: packageAudit.errors.map(
          (error) =>
            `${error.module ?? 'course'}/${error.lesson ?? 'package'} [${error.field}]: ${error.message}`,
        ),
        moduleCount: enriched.blueprint.modules.length,
        lessonCount: enriched.blueprint.modules.reduce(
          (sum, courseModule) => sum + (courseModule.lessons?.length ?? 0),
          0,
        ),
        assessmentsGenerated: enriched.assessmentsGenerated,
        videosQueued: 0,
      };
    }

    if (input.dryRun) {
      tracker.emit('complete', 'Dry run complete; nothing persisted.', 100);
      return {
        ok: true,
        title: courseTitle,
        moduleCount: enriched.blueprint.modules.length,
        lessonCount: enriched.blueprint.modules.reduce(
          (sum, courseModule) => sum + (courseModule.lessons?.length ?? 0),
          0,
        ),
        assessmentsGenerated: enriched.assessmentsGenerated,
        videosQueued: 0,
        dryRun: true,
      };
    }

    tracker.emit('publish', 'Persisting the validated course package.', 85);
    const published = await publishCourse({
      blueprint: enriched.blueprint,
      courseTitle,
      programId: input.programId,
      contentSource: input.contentSource ?? 'ai',
      mode: input.mode ?? 'refresh',
      evidence,
    });

    if (!published.success || !published.courseId) {
      const errors = published.errors?.length
        ? published.errors
        : ['Canonical course persistence did not report success or a course ID.'];
      tracker.emit('error', errors.join('; '), 100);
      return {
        ok: false,
        courseId: published.courseId || undefined,
        moduleCount: published.moduleCount,
        lessonCount: published.lessonCount,
        assessmentsGenerated: enriched.assessmentsGenerated,
        videosQueued: 0,
        errors,
      };
    }

    let videosQueued = 0;
    if (input.videoMode !== 'off' && published.courseId) {
      tracker.emit('media', 'Queueing missing lesson videos and microclips.', 93);
      const media = await queueCourseLessonVideos({
        courseId: published.courseId,
        onlyMissing: input.mode !== 'replace',
        force: input.mode === 'replace',
        limit: input.videoQueueLimit ?? null,
      });
      videosQueued = media.queued + media.microclipsQueued;
      if (media.failed > 0) {
        logger.warn('[course-factory] Some media jobs failed to enqueue', media);
      }
    }

    tracker.emit('complete', 'Canonical Course Factory completed successfully.', 100);
    return {
      ok: true,
      courseId: published.courseId,
      title: courseTitle,
      moduleCount: published.moduleCount,
      lessonCount: published.lessonCount,
      assessmentsGenerated: enriched.assessmentsGenerated,
      videosQueued,
      errors: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    tracker.emit('error', message, 100);
    logger.error('[course-factory] generation failed', error);
    return {
      ok: false,
      errors: [message],
      moduleCount: 0,
      lessonCount: 0,
      assessmentsGenerated: 0,
      videosQueued: 0,
    };
  }
}
