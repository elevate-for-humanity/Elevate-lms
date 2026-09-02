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

const canonicalBlueprintStepTypes = ['lesson', 'checkpoint', 'quiz', 'exam', 'lab', 'assignment'] as const;

function slugifyBlueprintValue(value: unknown, fallback: string): string {
  const normalized = String(value ?? fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function normalizeBlueprintStepType(value: unknown, title: unknown, slug: unknown): typeof canonicalBlueprintStepTypes[number] {
  const hint = `${String(value ?? '')} ${String(title ?? '')} ${String(slug ?? '')}`.toLowerCase();
  if (/final|cumulative|readiness|practice[-_ ]assessment|exam/.test(hint)) return 'exam';
  if (/checkpoint/.test(hint)) return 'checkpoint';
  if (/quiz/.test(hint)) return 'quiz';
  if (/lab|practical|demonstration|simulation/.test(hint)) return 'lab';
  if (/assignment|applied|project|exercise|remediation/.test(hint)) return 'assignment';
  return 'lesson';
}

function normalizeBlueprintLesson(value: unknown, fallbackIndex: number): Record<string, unknown> | null {
  if (typeof value === 'string') {
    return { title: value, slug: slugifyBlueprintValue(value, `lesson-${fallbackIndex}`), stepType: 'lesson' };
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const title = String(source.title ?? source.name ?? source.label ?? `Lesson ${fallbackIndex}`).trim();
  const slug = slugifyBlueprintValue(source.slug ?? source.id ?? title, `lesson-${fallbackIndex}`);
  return { title, slug, stepType: normalizeBlueprintStepType(source.stepType ?? source.type ?? source.kind, title, slug) };
}

/**
 * AI providers sometimes honor the requested learning design but express it as
 * named module fields (checkpoint, appliedPractice, finalExam, etc.) instead of
 * the canonical lessons array. Normalize that richer shape at the AI boundary;
 * downstream Course Factory validation remains strict and receives one stable
 * contract. No instructional step is silently persisted outside the contract.
 */
function normalizeGeneratedBlueprint(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const source = value as Record<string, unknown>;
  const rawModules = Array.isArray(source.modules) ? source.modules : [];
  const modules = rawModules.map((moduleValue, moduleIndex) => {
    const module = moduleValue && typeof moduleValue === 'object' && !Array.isArray(moduleValue)
      ? moduleValue as Record<string, unknown>
      : {};
    const candidates: unknown[] = [];
    for (const key of ['lessons', 'steps', 'content', 'appliedPractice', 'applied-learning', 'checkpoint', 'finalExam', 'cumulative-review', 'practice-readiness-assessment', 'remediation-path', 'assessments']) {
      const candidate = module[key];
      if (Array.isArray(candidate)) candidates.push(...candidate);
      else if (candidate != null) candidates.push(candidate);
    }
    const lessons = candidates
      .map((candidate, lessonIndex) => normalizeBlueprintLesson(candidate, lessonIndex + 1))
      .filter((lesson): lesson is Record<string, unknown> => lesson !== null);
    const title = String(module.title ?? module.name ?? `Module ${moduleIndex + 1}`).trim();
    return {
      title,
      description: String(module.description ?? module.summary ?? `${title} workforce-training module.`).trim(),
      lessons,
    };
  });
  return {
    title: String(source.title ?? '').trim(),
    description: String(source.description ?? source.summary ?? '').trim(),
    modules,
  };
}

export const generatedBlueprintSchema = z.preprocess(normalizeGeneratedBlueprint, z
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
                    slug: z
                      .string()
                      .trim()
                      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
                    stepType: z.enum(canonicalBlueprintStepTypes),
                  })
                  .strict(),
              )
              .min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict());

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
  if (/^```/i.test(content) || /```$/.test(content)) {
    throw new Error(`${label} returned markdown-wrapped JSON; plain JSON is required`);
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

/**
 * Strict means strict: invalid or incomplete AI output is retried by the
 * generator and then rejected. This boundary never pads a response with
 * reusable filler, invented scenarios, or generic assessment content.
 */
export function parseStrictAIJson<T>(
  raw: string | null | undefined,
  schema: z.ZodType<T>,
  label: string,
): T {
  return validateParsed(parseRawJson(raw, label), schema, label);
}
