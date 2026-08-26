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
                    slug: z
                      .string()
                      .trim()
                      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
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
