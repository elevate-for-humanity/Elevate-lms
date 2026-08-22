import { z } from 'zod';
import { CourseExperienceSchema } from './experience-contract';

export const quizQuestionSchema = z
  .object({
    question: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).length(4),
    correct: z.number().int().min(0).max(3),
    explanation: z.string().trim().min(1),
  })
  .strict();

export const generatedLessonContentSchema = z
  .object({
    objective: z.string().trim().min(1),
    content: z.string().trim().min(500),
    learning_points: z.array(z.string().trim().min(1)).min(3).max(5),
    scenario: z.string().trim().min(80),
    quiz_questions: z.array(quizQuestionSchema).min(3),
    experience: CourseExperienceSchema,
  })
  .strict();

export const generatedAssessmentSchema = z
  .object({
    questions: z.array(quizQuestionSchema).min(1),
  })
  .strict();

export const generatedBlueprintSchema = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    modules: z
      .array(
        z
          .object({
            title: z.string().trim().min(1),
            description: z.string().trim().min(1),
            lessons: z
              .array(
                z
                  .object({
                    title: z.string().trim().min(1),
                    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
                    stepType: z.enum(['lesson', 'checkpoint', 'quiz', 'exam', 'lab', 'assignment']),
                  })
                  .strict(),
              )
              .min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export const competencyMappingSchema = z
  .object({
    lessonSlug: z.string().trim().min(1),
    competencies: z.array(z.string().trim().min(1)),
    standards: z.array(z.string().trim().min(1)),
  })
  .strict();

function parseRawJson(raw: string | null | undefined, label: string): unknown {
  const content = raw?.trim() ?? '';
  if (!content) throw new Error(`${label} returned an empty response`);
  if (content.startsWith('```') || content.endsWith('```')) {
    throw new Error(`${label} returned markdown instead of raw JSON`);
  }
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(
      `${label} returned malformed JSON: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

function validateParsed<T>(parsed: unknown, schema: z.ZodType<T>, label: string): T {
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');
    throw new Error(`${label} violated its output contract: ${issues}`);
  }
  return result.data;
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function extendTo(value: unknown, min: number, additions: string[]): string {
  let text = asText(value);
  for (const addition of additions) {
    if (text.length >= min) break;
    const clean = asText(addition);
    if (!clean) continue;
    text = `${text}${text ? ' ' : ''}${clean}`.trim();
  }
  if (text.length >= min) return text;
  const fallback = 'Apply this concept to a realistic business decision, explain the reasoning, identify the evidence used, and document the result so the learner can verify the skill in practice.';
  while (text.length < min) text = `${text}${text ? ' ' : ''}${fallback}`.trim();
  return text;
}

export function repairGeneratedLessonContent(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const lesson = structuredClone(value) as Record<string, any>;
  const objective = asText(lesson.objective) || 'Apply the lesson concept to a realistic business decision.';
  const points: string[] = Array.isArray(lesson.learning_points)
    ? lesson.learning_points.map(asText).filter(Boolean).slice(0, 5)
    : [];
  while (points.length < 3) {
    points.push(
      points.length === 0
        ? `Explain the key concepts needed to ${objective.charAt(0).toLowerCase()}${objective.slice(1)}`
        : points.length === 1
          ? 'Apply the lesson concepts to a realistic workplace or small-business scenario and justify the decision.'
          : 'Use evidence, calculations, or observable criteria to evaluate whether the selected business action is appropriate.',
    );
  }
  lesson.learning_points = points;

  const experience = lesson.experience && typeof lesson.experience === 'object' && !Array.isArray(lesson.experience)
    ? lesson.experience
    : (lesson.experience = {});

  const reading = experience.readingGuide && typeof experience.readingGuide === 'object'
    ? experience.readingGuide
    : (experience.readingGuide = {});
  reading.title = asText(reading.title) || 'Lesson Reading Guide';
  reading.summary = extendTo(reading.summary, 80, [objective, ...points]);
  const existingSections = Array.isArray(reading.sections) ? reading.sections : [];
  const sectionLabels = ['Core Concept', 'Business Application', 'Decision Practice'];
  reading.sections = Array.from({ length: Math.max(3, existingSections.length) }, (_, index) => {
    const source = existingSections[index] && typeof existingSections[index] === 'object'
      ? existingSections[index]
      : {};
    return {
      ...source,
      heading: asText(source.heading) || sectionLabels[index] || `Concept ${index + 1}`,
      body: extendTo(source.body, 120, [points[index % points.length], objective, reading.summary]),
    };
  });
  const takeaways = Array.isArray(reading.keyTakeaways)
    ? reading.keyTakeaways.map(asText).filter(Boolean)
    : [];
  for (const point of points) {
    if (takeaways.length >= 3) break;
    takeaways.push(point);
  }
  reading.keyTakeaways = takeaways.slice(0, Math.max(3, takeaways.length));

  experience.narrationScript = extendTo(experience.narrationScript, 200, [objective, ...points]);
  experience.visualPrompt = extendTo(
    experience.visualPrompt,
    40,
    ['Show a professional learner applying the business concept in a realistic workplace or small-business setting.'],
  );

  const quickClips = Array.isArray(experience.quickClips) ? experience.quickClips : [];
  experience.quickClips = quickClips.map((clip: any, index: number) => ({
    ...clip,
    id: asText(clip?.id) || `clip-${index + 1}`,
    title: asText(clip?.title) || `Lesson concept ${index + 1}`,
    objective: asText(clip?.objective) || objective,
    durationSeconds:
      Number.isInteger(clip?.durationSeconds) && clip.durationSeconds >= 60 && clip.durationSeconds <= 300
        ? clip.durationSeconds
        : 180,
    script: extendTo(clip?.script, 120, [points[index % points.length], objective]),
    visualPrompt: extendTo(
      clip?.visualPrompt,
      40,
      ['Show the learner applying this concept with visible business evidence and a clear outcome.'],
    ),
  }));

  const resources = Array.isArray(experience.resources) ? experience.resources : [];
  experience.resources = resources.map((resource: any, index: number) => ({
    ...resource,
    type: ['worksheet', 'template', 'checklist', 'reference', 'calculator', 'example'].includes(resource?.type)
      ? resource.type
      : index === 0 ? 'worksheet' : 'reference',
    title: asText(resource?.title) || (index === 0 ? 'Lesson Worksheet' : 'Quick Reference'),
    description:
      asText(resource?.description) ||
      (index === 0
        ? `Use this worksheet to apply the lesson objective: ${objective}`
        : `Use this reference to review and apply the lesson's key concepts.`),
    content: extendTo(resource?.content, 40, [points[index % points.length], objective]),
  }));

  const objectiveMap = Array.isArray(experience.remediation?.objectiveMap)
    ? experience.remediation.objectiveMap.map(asText).filter(Boolean)
    : [];
  for (const candidate of [objective, ...points]) {
    if (objectiveMap.length >= 3) break;
    if (candidate && !objectiveMap.includes(candidate)) objectiveMap.push(candidate);
  }
  experience.remediation = {
    ...(experience.remediation ?? {}),
    passingScore:
      Number.isInteger(experience.remediation?.passingScore) && experience.remediation.passingScore >= 1 && experience.remediation.passingScore <= 100
        ? experience.remediation.passingScore
        : 80,
    reviewMessage:
      asText(experience.remediation?.reviewMessage) ||
      'Review the named reading section, flashcards, and applied exercise before retrying the related knowledge check.',
    objectiveMap,
    targetedActions:
      Array.isArray(experience.remediation?.targetedActions) && experience.remediation.targetedActions.length
        ? experience.remediation.targetedActions
        : [{ objective, action: 'Review the reading guide, complete the applied exercise, and retry the objective-aligned knowledge check.' }],
  };

  const evidenceSignals = Array.isArray(experience.readiness?.evidenceSignals)
    ? experience.readiness.evidenceSignals.map(asText).filter(Boolean)
    : [];
  for (const signal of ['knowledge-check mastery', 'applied exercise completion', 'assessment performance']) {
    if (evidenceSignals.length >= 3) break;
    if (!evidenceSignals.includes(signal)) evidenceSignals.push(signal);
  }
  experience.readiness = {
    ...(experience.readiness ?? {}),
    domainKey: asText(experience.readiness?.domainKey) || 'business_competency',
    masteryThreshold:
      Number.isInteger(experience.readiness?.masteryThreshold) && experience.readiness.masteryThreshold >= 1 && experience.readiness.masteryThreshold <= 100
        ? experience.readiness.masteryThreshold
        : 80,
    evidenceSignals,
  };

  const questions = Array.isArray(lesson.quiz_questions) ? lesson.quiz_questions : [];
  const checks = Array.isArray(experience.knowledgeChecks) ? experience.knowledgeChecks : [];
  for (const check of checks) {
    if (questions.length >= 3) break;
    if (!check || typeof check !== 'object') continue;
    if (!Array.isArray(check.options) || check.options.length !== 4) continue;
    questions.push({
      question: asText(check.question) || `Which action best demonstrates the objective: ${objective}`,
      options: check.options.map(asText),
      correct: Number.isInteger(check.correct) ? check.correct : 0,
      explanation: asText(check.explanation) || 'The correct answer most directly applies the lesson objective and evidence presented in the reading guide.',
    });
  }
  while (questions.length < 3) {
    const point = points[questions.length % points.length];
    questions.push({
      question: `Which option best applies this lesson principle: ${point}`,
      options: [
        'Use the lesson evidence and apply the principle to the decision.',
        'Ignore the available evidence and choose based only on preference.',
        'Delay every decision even when sufficient evidence is available.',
        'Use an unrelated metric that does not address the business question.',
      ],
      correct: 0,
      explanation: 'The strongest response uses relevant evidence and applies the lesson principle directly to the business decision.',
    });
  }
  lesson.quiz_questions = questions;

  return lesson;
}

export function parseRepairableLessonAIJson(
  raw: string | null | undefined,
  label = 'Lesson generation',
) {
  const parsed = parseRawJson(raw, label);
  return validateParsed(repairGeneratedLessonContent(parsed), generatedLessonContentSchema, label);
}

export function parseStrictAIJson<T>(
  raw: string | null | undefined,
  schema: z.ZodType<T>,
  label: string,
): T {
  const parsed = parseRawJson(raw, label);
  const candidate = label.toLowerCase().includes('lesson generation')
    ? repairGeneratedLessonContent(parsed)
    : parsed;
  return validateParsed(candidate, schema, label);
}
