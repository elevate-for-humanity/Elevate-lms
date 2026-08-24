import { z } from 'zod';
import { CourseExperienceSchema } from './experience-contract';

export const quizQuestionSchema = z.object({
  question: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).length(4),
  correct: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(1),
}).strict();

export const generatedLessonContentSchema = z.object({
  objective: z.string().trim().min(1),
  content: z.string().trim().min(500),
  learning_points: z.array(z.string().trim().min(1)).min(3).max(5),
  scenario: z.string().trim().min(80),
  quiz_questions: z.array(quizQuestionSchema).min(3),
  experience: CourseExperienceSchema,
}).strict();

export const generatedAssessmentSchema = z.object({ questions: z.array(quizQuestionSchema).min(1) }).strict();

export const generatedBlueprintSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  modules: z.array(z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    lessons: z.array(z.object({
      title: z.string().trim().min(1),
      slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      stepType: z.enum(['lesson', 'checkpoint', 'quiz', 'exam', 'lab', 'assignment']),
    }).strict()).min(1),
  }).strict()).min(1),
}).strict();

export const competencyMappingSchema = z.object({
  lessonSlug: z.string().trim().min(1),
  competencies: z.array(z.string().trim().min(1)),
  standards: z.array(z.string().trim().min(1)),
}).strict();

function parseRawJson(raw: string | null | undefined, label: string): unknown {
  const content = raw?.trim() ?? '';
  if (!content) throw new Error(`${label} returned an empty response`);
  if (/^```/i.test(content) || /```$/.test(content)) {
    throw new Error(`${label} returned markdown-wrapped JSON; plain JSON is required`);
  }
  try { return JSON.parse(content); }
  catch (error) {
    throw new Error(`${label} returned malformed JSON: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
}

function validateParsed<T>(parsed: unknown, schema: z.ZodType<T>, label: string): T {
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`).join('; ');
    throw new Error(`${label} violated its output contract: ${issues}`);
  }
  return result.data;
}

function asText(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }

function extendTo(value: unknown, min: number, additions: string[]): string {
  let text = asText(value);
  for (const addition of additions) {
    if (text.length >= min) break;
    const clean = asText(addition);
    if (clean) text = `${text}${text ? ' ' : ''}${clean}`.trim();
  }
  const fallback = 'Apply this concept to a realistic business decision, explain the reasoning, identify the evidence used, and document the result so the learner can verify the skill in practice.';
  while (text.length < min) text = `${text}${text ? ' ' : ''}${fallback}`.trim();
  return text;
}

function optionSet(correctText: string) {
  return [
    { text: correctText, isCorrect: true, feedback: 'This choice applies the lesson evidence and directly supports the stated objective.' },
    { text: 'Choose an unrelated action without checking the available evidence.', isCorrect: false, feedback: 'This does not apply the lesson criteria or evidence to the decision.' },
  ];
}

export function repairGeneratedLessonContent(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const lesson = structuredClone(value) as Record<string, any>;
  const objective = asText(lesson.objective) || 'Apply the lesson concept to a realistic business decision.';
  lesson.objective = objective;

  const points: string[] = Array.isArray(lesson.learning_points)
    ? lesson.learning_points.map(asText).filter(Boolean).slice(0, 5)
    : [];
  while (points.length < 3) {
    points.push(points.length === 0
      ? `Explain the key concepts needed to ${objective.charAt(0).toLowerCase()}${objective.slice(1)}`
      : points.length === 1
        ? 'Apply the lesson concepts to a realistic workplace or small-business scenario and justify the decision.'
        : 'Use evidence, calculations, or observable criteria to evaluate whether the selected business action is appropriate.');
  }
  lesson.learning_points = points;
  lesson.content = extendTo(lesson.content, 500, [objective, ...points]);
  lesson.scenario = extendTo(lesson.scenario, 80, [objective, points[1], points[2]]);

  const experience = lesson.experience && typeof lesson.experience === 'object' && !Array.isArray(lesson.experience)
    ? lesson.experience : (lesson.experience = {});

  const reading = experience.readingGuide && typeof experience.readingGuide === 'object'
    ? experience.readingGuide : (experience.readingGuide = {});
  reading.title = asText(reading.title) || 'Lesson Reading Guide';
  reading.summary = extendTo(reading.summary, 80, [objective, ...points]);
  const existingSections = Array.isArray(reading.sections) ? reading.sections : [];
  const sectionLabels = ['Core Concept', 'Business Application', 'Decision Practice'];
  reading.sections = Array.from({ length: Math.max(3, existingSections.length) }, (_, index) => {
    const source = existingSections[index] && typeof existingSections[index] === 'object' ? existingSections[index] : {};
    return {
      ...source,
      heading: asText(source.heading) || sectionLabels[index] || `Concept ${index + 1}`,
      body: extendTo(source.body, 120, [points[index % points.length], objective, reading.summary]),
    };
  });
  const takeaways = Array.isArray(reading.keyTakeaways) ? reading.keyTakeaways.map(asText).filter(Boolean) : [];
  for (const point of points) if (takeaways.length < 3 && !takeaways.includes(point)) takeaways.push(point);
  reading.keyTakeaways = takeaways;

  experience.narrationScript = extendTo(experience.narrationScript, 200, [objective, ...points]);
  experience.visualPrompt = extendTo(experience.visualPrompt, 40, ['Show a professional learner applying this business concept in a realistic small-business or retail setting.']);

  const flashcards = Array.isArray(experience.flashcards) ? experience.flashcards.filter((card: any) => card && typeof card === 'object') : [];
  for (let i = flashcards.length; i < 6; i += 1) {
    const point = points[i % points.length];
    flashcards.push({ id: `term-${i + 1}`, front: `Key concept ${i + 1}`, back: point, tags: [asText(experience.readiness?.domainKey) || 'business'] });
  }
  experience.flashcards = flashcards.map((card: any, i: number) => ({
    ...card,
    id: asText(card.id) || `term-${i + 1}`,
    front: asText(card.front) || `Key concept ${i + 1}`,
    back: asText(card.back) || points[i % points.length],
    tags: Array.isArray(card.tags) ? card.tags.map(asText).filter(Boolean) : ['business'],
  }));

  const quickClips = Array.isArray(experience.quickClips) ? experience.quickClips.filter((clip: any) => clip && typeof clip === 'object') : [];
  while (quickClips.length < 2) quickClips.push({});
  experience.quickClips = quickClips.map((clip: any, index: number) => ({
    ...clip,
    id: asText(clip.id) || `clip-${index + 1}`,
    title: asText(clip.title) || (index === 0 ? 'Core concept in under five minutes' : 'Applied example in under five minutes'),
    objective: asText(clip.objective) || objective,
    durationSeconds: Number.isInteger(clip.durationSeconds) && clip.durationSeconds >= 60 && clip.durationSeconds <= 300 ? clip.durationSeconds : 180,
    script: extendTo(clip.script, 120, [points[index % points.length], objective]),
    visualPrompt: extendTo(clip.visualPrompt, 40, ['Show the learner applying this concept with visible business evidence and a clear outcome.']),
  }));

  const checks = Array.isArray(experience.knowledgeChecks) ? experience.knowledgeChecks.filter((check: any) => check && typeof check === 'object') : [];
  while (checks.length < 3) {
    const point = points[checks.length % points.length];
    checks.push({
      question: `Which action best applies this principle: ${point}`,
      options: ['Use relevant evidence and apply the principle directly.', 'Ignore the evidence.', 'Use an unrelated metric.', 'Delay the decision without reason.'],
      correct: 0,
      explanation: 'The correct response uses relevant evidence and directly applies the lesson principle.',
    });
  }
  experience.knowledgeChecks = checks.map((check: any, index: number) => ({
    question: asText(check.question) || `Which action best demonstrates learning point ${index + 1}?`,
    options: Array.isArray(check.options) && check.options.length === 4 ? check.options.map(asText) : ['Apply the lesson evidence.', 'Ignore the evidence.', 'Use unrelated information.', 'Avoid the decision.'],
    correct: Number.isInteger(check.correct) && check.correct >= 0 && check.correct <= 3 ? check.correct : 0,
    explanation: asText(check.explanation) || 'The correct choice directly applies the lesson objective and available evidence.',
  }));

  const normalizeDecisionActivity = (source: any, title: string) => ({
    title: asText(source?.title) || title,
    context: asText(source?.context) || lesson.scenario,
    question: asText(source?.question) || `What action best demonstrates this objective: ${objective}`,
    options: Array.isArray(source?.options) && source.options.length >= 2
      ? source.options.map((option: any, index: number) => ({
          text: asText(option?.text) || (index === 0 ? 'Apply the lesson evidence and choose the action that supports the objective.' : 'Choose an action unrelated to the objective.'),
          isCorrect: typeof option?.isCorrect === 'boolean' ? option.isCorrect : index === 0,
          feedback: asText(option?.feedback) || (index === 0 ? 'This choice directly applies the lesson evidence.' : 'Review the lesson objective and evidence before retrying.'),
        }))
      : optionSet('Apply the lesson evidence and choose the action that supports the objective.'),
  });
  experience.scenario = normalizeDecisionActivity(experience.scenario, 'Applied Business Scenario');
  experience.caseStudy = normalizeDecisionActivity(experience.caseStudy, 'Business Evidence Case Study');

  const exercises = Array.isArray(experience.exercises) ? experience.exercises.filter((exercise: any) => exercise && typeof exercise === 'object') : [];
  if (!exercises.length) exercises.push({});
  experience.exercises = exercises.map((exercise: any, index: number) => ({
    id: asText(exercise.id) || `exercise-${index + 1}`,
    title: asText(exercise.title) || 'Apply the lesson to a business decision',
    instructions: Array.isArray(exercise.instructions) && exercise.instructions.filter(asText).length >= 2
      ? exercise.instructions.map(asText).filter(Boolean)
      : [`Review the lesson objective and identify the evidence that matters.`, `Apply the evidence to a realistic decision and document why the selected action is appropriate.`],
    expectedArtifact: asText(exercise.expectedArtifact) || 'A written decision with supporting evidence and reasoning.',
    autoGrade: {
      type: ['checklist','multiple_choice','numeric','text_rubric'].includes(exercise.autoGrade?.type) ? exercise.autoGrade.type : 'checklist',
      criteria: Array.isArray(exercise.autoGrade?.criteria) && exercise.autoGrade.criteria.map(asText).filter(Boolean).length
        ? exercise.autoGrade.criteria.map(asText).filter(Boolean)
        : ['The response applies the lesson objective and cites relevant evidence.'],
    },
  }));

  const task = experience.practicalTask && typeof experience.practicalTask === 'object' ? experience.practicalTask : {};
  experience.practicalTask = {
    title: asText(task.title) || 'Practical Business Application',
    description: asText(task.description) || `Create an observable work product that demonstrates this objective: ${objective}`,
    instructions: Array.isArray(task.instructions) ? task.instructions.map(asText).filter(Boolean) : [],
    evidence: asText(task.evidence) || 'Submit the completed work product and a short explanation of the decision evidence used.',
  };
  while (experience.practicalTask.instructions.length < 3) {
    experience.practicalTask.instructions.push([
      'Identify the relevant business facts and constraints.',
      'Apply the lesson method or calculation to the facts.',
      'Document the result and explain why it supports the business objective.',
    ][experience.practicalTask.instructions.length]);
  }

  const resources = Array.isArray(experience.resources) ? experience.resources.filter((resource: any) => resource && typeof resource === 'object') : [];
  while (resources.length < 2) resources.push({});
  experience.resources = resources.map((resource: any, index: number) => ({
    ...resource,
    type: ['worksheet','template','checklist','reference','calculator','example'].includes(resource.type) ? resource.type : index === 0 ? 'worksheet' : 'reference',
    title: asText(resource.title) || (index === 0 ? 'Lesson Worksheet' : 'Quick Reference'),
    description: asText(resource.description) || (index === 0 ? `Use this worksheet to apply the lesson objective: ${objective}` : `Use this reference to review and apply the lesson's key concepts.`),
    content: extendTo(resource.content, 40, [points[index % points.length], objective]),
  }));

  const glossary = Array.isArray(experience.glossary) ? experience.glossary.filter((item: any) => item && typeof item === 'object') : [];
  while (glossary.length < 4) glossary.push({});
  experience.glossary = glossary.map((item: any, index: number) => ({
    term: asText(item.term) || `Lesson term ${index + 1}`,
    definition: asText(item.definition) || points[index % points.length],
  }));

  const objectiveMap = Array.isArray(experience.remediation?.objectiveMap) ? experience.remediation.objectiveMap.map(asText).filter(Boolean) : [];
  for (const candidate of [objective, ...points]) if (objectiveMap.length < 3 && candidate && !objectiveMap.includes(candidate)) objectiveMap.push(candidate);
  experience.remediation = {
    ...(experience.remediation ?? {}),
    passingScore: Number.isInteger(experience.remediation?.passingScore) && experience.remediation.passingScore >= 1 && experience.remediation.passingScore <= 100 ? experience.remediation.passingScore : 80,
    reviewMessage: asText(experience.remediation?.reviewMessage) || 'Review the named reading section, flashcards, and applied exercise before retrying the related knowledge check.',
    objectiveMap,
    targetedActions: Array.isArray(experience.remediation?.targetedActions) && experience.remediation.targetedActions.length
      ? experience.remediation.targetedActions.map((action: any) => ({ objective: asText(action.objective) || objective, action: asText(action.action) || 'Review the reading guide, complete the applied exercise, and retry the objective-aligned knowledge check.' }))
      : [{ objective, action: 'Review the reading guide, complete the applied exercise, and retry the objective-aligned knowledge check.' }],
  };

  const evidenceSignals = Array.isArray(experience.readiness?.evidenceSignals) ? experience.readiness.evidenceSignals.map(asText).filter(Boolean) : [];
  for (const signal of ['knowledge-check mastery', 'applied exercise completion', 'assessment performance']) if (evidenceSignals.length < 3 && !evidenceSignals.includes(signal)) evidenceSignals.push(signal);
  experience.readiness = {
    ...(experience.readiness ?? {}),
    domainKey: asText(experience.readiness?.domainKey) || 'business_competency',
    masteryThreshold: Number.isInteger(experience.readiness?.masteryThreshold) && experience.readiness.masteryThreshold >= 1 && experience.readiness.masteryThreshold <= 100 ? experience.readiness.masteryThreshold : 80,
    evidenceSignals,
  };

  const questions = Array.isArray(lesson.quiz_questions) ? lesson.quiz_questions.filter((q: any) => q && typeof q === 'object') : [];
  for (const check of experience.knowledgeChecks) {
    if (questions.length >= 3) break;
    questions.push({ question: check.question, options: check.options, correct: check.correct, explanation: check.explanation });
  }
  while (questions.length < 3) {
    const point = points[questions.length % points.length];
    questions.push({
      question: `Which option best applies this lesson principle: ${point}`,
      options: ['Use the lesson evidence and apply the principle to the decision.', 'Ignore the available evidence and choose based only on preference.', 'Delay every decision even when sufficient evidence is available.', 'Use an unrelated metric that does not address the business question.'],
      correct: 0,
      explanation: 'The strongest response uses relevant evidence and applies the lesson principle directly to the business decision.',
    });
  }
  lesson.quiz_questions = questions.map((q: any, index: number) => ({
    question: asText(q.question) || `Lesson question ${index + 1}`,
    options: Array.isArray(q.options) && q.options.length === 4 ? q.options.map(asText) : ['Apply the lesson evidence.', 'Ignore the evidence.', 'Use unrelated information.', 'Avoid the decision.'],
    correct: Number.isInteger(q.correct) && q.correct >= 0 && q.correct <= 3 ? q.correct : 0,
    explanation: asText(q.explanation) || 'The correct choice directly applies the lesson objective and evidence.',
  }));

  return lesson;
}

export function parseRepairableLessonAIJson(raw: string | null | undefined, label = 'Lesson generation') {
  const parsed = parseRawJson(raw, label);
  return validateParsed(repairGeneratedLessonContent(parsed), generatedLessonContentSchema, label);
}

export function parseStrictAIJson<T>(raw: string | null | undefined, schema: z.ZodType<T>, label: string): T {
  const parsed = parseRawJson(raw, label);
  const candidate = label.toLowerCase().includes('lesson generation') ? repairGeneratedLessonContent(parsed) : parsed;
  return validateParsed(candidate, schema, label);
}
