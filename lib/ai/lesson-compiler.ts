/**
 * Lesson Compiler — Pass 2 of the AI course factory
 *
 * Takes a lesson stub (title + objectives + summary) plus course/module context
 * and produces a fully compiled instructional package:
 *   - narration script (instructor-grade, 600-900 words)
 *   - slide outline (4-12 slides with bullets + speaker notes)
 *   - practice exercise
 *   - 5-question quiz bank with explanations
 *   - instructor facilitation notes
 *
 * Uses Zod for strict output validation — malformed AI responses are caught
 * and surfaced as errors rather than silently stored as bad data.
 *
 * Concurrency: mapWithConcurrency(limit=3) keeps throughput high without
 * hammering the model. At 3 concurrent calls × ~5s each, 24 lessons ≈ 40s.
 */

import { z } from 'zod';
import { getOpenAIClient } from '@/lib/openai-client';
import { LESSON_COMPILER_SYSTEM, buildLessonCompilerPrompt } from '@/lib/ai/prompts/lesson-compiler';

// ── Zod schemas ───────────────────────────────────────────────────────────────

export const QuizQuestionSchema = z.object({
  question: z.string().min(10, 'Question too short'),
  options: z.array(z.string().min(1)).length(4, 'Must have exactly 4 options'),
  correct_answer: z.string().min(1),
  explanation: z.string().min(10, 'Explanation too short'),
});

export const SlideSectionSchema = z.object({
  slide_number: z.number().int().positive(),
  title: z.string().min(1),
  bullets: z.array(z.string().min(1)).min(3).max(6),
  speaker_notes: z.string().min(20, 'Speaker notes too short'),
  visual_suggestion: z.string().optional(),
});

export const CompiledLessonSchema = z.object({
  lesson_title: z.string().min(1),
  lesson_objectives: z.array(z.string().min(1)).min(2).max(6),
  estimated_minutes: z.number().int().min(3).max(60),
  narration_script: z.string().min(400, 'Narration script too short — minimum 400 characters'),
  slide_outline: z.array(SlideSectionSchema).min(4).max(12),
  practice_exercise: z.object({
    title: z.string().min(1),
    instructions: z.string().min(20),
    expected_outcome: z.string().min(10),
  }),
  knowledge_check: z.array(QuizQuestionSchema).length(5, 'Must have exactly 5 quiz questions'),
  instructor_notes: z.array(z.string().min(10)).min(2).max(8),
});

export type CompiledLesson = z.infer<typeof CompiledLessonSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type SlideSection = z.infer<typeof SlideSectionSchema>;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CompileLessonArgs {
  courseTitle: string;
  courseDescription: string;
  audience: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  moduleTitle: string;
  moduleObjectives: string[];
  lessonTitle: string;
  lessonObjectives: string[];
  lessonSummary: string;
}

// ── Validation ────────────────────────────────────────────────────────────────

export function validateCompiledLesson(lesson: CompiledLesson): void {
  // Correct answer must be one of the four options
  for (const q of lesson.knowledge_check) {
    if (!q.options.includes(q.correct_answer)) {
      throw new Error(
        `Quiz answer mismatch in lesson "${lesson.lesson_title}": ` +
        `correct_answer "${q.correct_answer}" is not in options [${q.options.join(', ')}]`
      );
    }
  }

  if (lesson.narration_script.length < 400) {
    throw new Error(`Narration too short in lesson "${lesson.lesson_title}" (${lesson.narration_script.length} chars)`);
  }

  if (lesson.estimated_minutes < 3) {
    throw new Error(`Estimated minutes too low in lesson "${lesson.lesson_title}" (${lesson.estimated_minutes})`);
  }

  // Duplicate bullet detection
  for (const slide of lesson.slide_outline) {
    const seen = new Set<string>();
    for (const bullet of slide.bullets) {
      if (seen.has(bullet)) {
        throw new Error(`Duplicate bullet in slide ${slide.slide_number} of "${lesson.lesson_title}": "${bullet}"`);
      }
      seen.add(bullet);
    }
  }
}

// ── Content renderer ──────────────────────────────────────────────────────────

export function formatNarrationForTeleprompter(script: string): string {
  return script.replace(/\n{3,}/g, '\n\n').trim();
}

export function renderLessonContent(compiled: CompiledLesson): string {
  const slides = compiled.slide_outline
    .map(
      (slide) =>
        `## Slide ${slide.slide_number}: ${slide.title}\n` +
        slide.bullets.map((b) => `- ${b}`).join('\n') +
        `\n\n**Speaker Notes**\n${slide.speaker_notes}` +
        (slide.visual_suggestion ? `\n\n*Visual: ${slide.visual_suggestion}*` : '')
    )
    .join('\n\n');

  return [
    `# ${compiled.lesson_title}`,
    '',
    `## Learning Objectives`,
    compiled.lesson_objectives.map((o) => `- ${o}`).join('\n'),
    '',
    `## Narration Script`,
    formatNarrationForTeleprompter(compiled.narration_script),
    '',
    `## Slide Outline`,
    slides,
    '',
    `## Practice Exercise`,
    `**${compiled.practice_exercise.title}**`,
    '',
    compiled.practice_exercise.instructions,
    '',
    `**Expected Outcome**`,
    compiled.practice_exercise.expected_outcome,
  ].join('\n');
}

// ── Core compiler ─────────────────────────────────────────────────────────────

function parseJSON(raw: string): unknown {
  return JSON.parse(
    raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
  );
}

export async function compileLesson(args: CompileLessonArgs): Promise<CompiledLesson> {
  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: LESSON_COMPILER_SYSTEM },
      { role: 'user', content: buildLessonCompilerPrompt(args) },
    ],
    temperature: 0.5,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content;
  if (!raw) throw new Error(`No response from AI for lesson "${args.lessonTitle}"`);

  const parsed = parseJSON(raw);
  const validated = CompiledLessonSchema.safeParse(parsed);

  if (!validated.success) {
    const issues = validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Lesson "${args.lessonTitle}" failed validation: ${issues}`);
  }

  validateCompiledLesson(validated.data);
  return validated.data;
}

// ── Controlled concurrency ────────────────────────────────────────────────────

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await worker(items[current], current);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

export interface LessonStub {
  lesson_title: string;
  lesson_order: number;
  lesson_objectives: string[];
  lesson_summary: string;
}

export interface ModuleStub {
  module_title: string;
  module_order: number;
  module_objectives: string[];
  lessons: LessonStub[];
}

export interface CompileAllArgs {
  courseTitle: string;
  courseDescription: string;
  audience: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  modules: ModuleStub[];
}

export interface CompiledModule {
  module_title: string;
  module_order: number;
  module_objectives: string[];
  lessons: CompiledLesson[];
  compile_errors: string[];
}

/**
 * Compile all lessons across all modules with controlled concurrency.
 * Lessons that fail validation are recorded in compile_errors rather than
 * aborting the whole course — the admin review screen surfaces these.
 */
export async function compileAllLessons(args: CompileAllArgs): Promise<CompiledModule[]> {
  const compiledModules: CompiledModule[] = [];

  for (const mod of args.modules) {
    const errors: string[] = [];

    const compiledLessons = await mapWithConcurrency(
      mod.lessons,
      3, // 3 concurrent lesson compilations
      async (lesson) => {
        try {
          return await compileLesson({
            courseTitle: args.courseTitle,
            courseDescription: args.courseDescription,
            audience: args.audience,
            difficulty: args.difficulty,
            moduleTitle: mod.module_title,
            moduleObjectives: mod.module_objectives,
            lessonTitle: lesson.lesson_title,
            lessonObjectives: lesson.lesson_objectives,
            lessonSummary: lesson.lesson_summary,
          });
        } catch (err: any) {
          errors.push(err?.message || `Failed to compile "${lesson.lesson_title}"`);
          // Return a minimal stub so the course structure stays intact
          return {
            lesson_title: lesson.lesson_title,
            lesson_objectives: lesson.lesson_objectives,
            estimated_minutes: 20,
            narration_script: `[Compilation failed — content needs manual authoring for "${lesson.lesson_title}"]`,
            slide_outline: [
              {
                slide_number: 1,
                title: lesson.lesson_title,
                bullets: lesson.lesson_objectives.slice(0, 4),
                speaker_notes: 'Content pending manual authoring.',
              },
            ],
            practice_exercise: {
              title: 'Exercise',
              instructions: 'Instructions pending.',
              expected_outcome: 'Outcome pending.',
            },
            knowledge_check: Array.from({ length: 5 }, (_, i) => ({
              question: `Question ${i + 1} pending`,
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correct_answer: 'Option A',
              explanation: 'Explanation pending.',
            })),
            instructor_notes: ['Content needs manual review before publishing.'],
          } satisfies CompiledLesson;
        }
      }
    );

    compiledModules.push({
      module_title: mod.module_title,
      module_order: mod.module_order,
      module_objectives: mod.module_objectives,
      lessons: compiledLessons,
      compile_errors: errors,
    });
  }

  return compiledModules;
}
