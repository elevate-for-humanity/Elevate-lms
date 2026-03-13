/**
 * AI Course Generator
 *
 * Generates a structured course draft from a prompt or pasted syllabus/script.
 * Output maps directly to training_courses + training_lessons + lesson_content_blocks.
 *
 * Schema mapping:
 *   training_courses:      course_name (NOT NULL), title, description, summary,
 *                          difficulty, duration_hours, is_published, metadata
 *   training_lessons:      course_id (NOT NULL), lesson_number (NOT NULL),
 *                          title (NOT NULL), content, description, order_index,
 *                          is_published, quiz_questions (jsonb)
 *   lesson_content_blocks: lesson_id, block_type, content (jsonb), order_index
 */

import { aiChat } from '@/lib/ai';
import { logger } from '@/lib/logger';

// ─── Output types ─────────────────────────────────────────────────────────────

export interface GeneratedQuizQuestion {
  question: string;
  options: string[];          // 4 options, A–D
  correct_index: number;      // 0-based
  explanation: string;
}

export interface GeneratedLesson {
  title: string;
  description: string;        // 1–2 sentence summary
  content: string;            // Full lesson body (markdown)
  key_takeaways: string[];
  reflection_prompt: string;
  quiz_questions: GeneratedQuizQuestion[];
  duration_minutes: number;
}

export interface GeneratedCourse {
  title: string;
  course_name: string;        // same as title — required NOT NULL field
  description: string;
  summary: string;            // 1–2 sentence elevator pitch
  learning_objectives: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_hours: number;
  lessons: GeneratedLesson[];
}

// ─── Input options ─────────────────────────────────────────────────────────────

export interface CourseGeneratorOptions {
  /** Free-form prompt OR pasted syllabus/script/notes */
  prompt: string;
  /** Structured overrides — all optional */
  courseTitle?: string;
  audience?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  lessonCount?: number;
  durationHours?: number;
  tone?: string;
  includeQuiz?: boolean;
  includeReflection?: boolean;
}

// ─── Prompt builder ────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are an expert instructional designer for workforce development programs.
Your job is to generate complete, practical course content for adult learners.

Rules:
- Content must be coherent, specific, and immediately useful — not generic filler.
- Lesson body content should be 200–400 words of practical instruction.
- Key takeaways: 3–5 concise bullet points per lesson.
- Quiz questions: multiple choice, 4 options each, one correct answer.
- Reflection prompts: one actionable question per lesson.
- Always respond with valid JSON only. No markdown fences, no commentary.`;
}

function buildUserPrompt(opts: CourseGeneratorOptions): string {
  const lessonCount = opts.lessonCount ?? 6;
  const difficulty = opts.difficulty ?? 'beginner';
  const includeQuiz = opts.includeQuiz !== false;
  const includeReflection = opts.includeReflection !== false;

  const structuredContext = [
    opts.courseTitle ? `Course title: ${opts.courseTitle}` : null,
    opts.audience ? `Target audience: ${opts.audience}` : null,
    `Difficulty: ${difficulty}`,
    `Number of lessons: ${lessonCount}`,
    opts.durationHours ? `Total duration: ${opts.durationHours} hours` : null,
    opts.tone ? `Tone/style: ${opts.tone}` : null,
    `Include quiz questions per lesson: ${includeQuiz}`,
    `Include reflection prompts: ${includeReflection}`,
  ].filter(Boolean).join('\n');

  return `Generate a complete course based on the following input.

${structuredContext}

INPUT (prompt, syllabus, or script):
${opts.prompt}

Return a single JSON object with this exact structure:
{
  "title": "string",
  "course_name": "string (same as title)",
  "description": "string (2–3 sentences)",
  "summary": "string (1–2 sentence elevator pitch)",
  "learning_objectives": ["string", ...],
  "difficulty": "beginner|intermediate|advanced",
  "duration_hours": number,
  "lessons": [
    {
      "title": "string",
      "description": "string (1–2 sentence summary)",
      "content": "string (200–400 words of practical instruction)",
      "key_takeaways": ["string", ...],
      "reflection_prompt": "string",
      "duration_minutes": number,
      "quiz_questions": [
        {
          "question": "string",
          "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
          "correct_index": 0,
          "explanation": "string"
        }
      ]
    }
  ]
}

Generate exactly ${lessonCount} lessons.
${!includeQuiz ? 'Set quiz_questions to [] for all lessons.' : 'Include 2–3 quiz questions per lesson.'}
${!includeReflection ? 'Set reflection_prompt to "" for all lessons.' : ''}`;
}

// ─── JSON repair ───────────────────────────────────────────────────────────────

function extractJSON(raw: string): string {
  // Strip markdown fences if model ignores the instruction
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Find first { and last }
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }
  return raw.trim();
}

function validateCourse(data: unknown): GeneratedCourse {
  if (!data || typeof data !== 'object') throw new Error('AI returned non-object');
  const d = data as Record<string, unknown>;

  if (!d.title || typeof d.title !== 'string') throw new Error('Missing course title');
  if (!Array.isArray(d.lessons) || d.lessons.length === 0) throw new Error('No lessons generated');

  // Coerce and fill defaults
  const course: GeneratedCourse = {
    title: String(d.title).trim(),
    course_name: String(d.course_name || d.title).trim(),
    description: String(d.description || '').trim(),
    summary: String(d.summary || '').trim(),
    learning_objectives: Array.isArray(d.learning_objectives)
      ? (d.learning_objectives as unknown[]).map(String)
      : [],
    difficulty: (['beginner', 'intermediate', 'advanced'].includes(d.difficulty as string)
      ? d.difficulty
      : 'beginner') as GeneratedCourse['difficulty'],
    duration_hours: typeof d.duration_hours === 'number' ? d.duration_hours : 1,
    lessons: (d.lessons as unknown[]).map((l: unknown, i: number) => {
      const lesson = (l || {}) as Record<string, unknown>;
      return {
        title: String(lesson.title || `Lesson ${i + 1}`).trim(),
        description: String(lesson.description || '').trim(),
        content: String(lesson.content || '').trim(),
        key_takeaways: Array.isArray(lesson.key_takeaways)
          ? (lesson.key_takeaways as unknown[]).map(String)
          : [],
        reflection_prompt: String(lesson.reflection_prompt || '').trim(),
        duration_minutes: typeof lesson.duration_minutes === 'number' ? lesson.duration_minutes : 30,
        quiz_questions: Array.isArray(lesson.quiz_questions)
          ? (lesson.quiz_questions as unknown[]).map((q: unknown) => {
              const qObj = (q || {}) as Record<string, unknown>;
              return {
                question: String(qObj.question || '').trim(),
                options: Array.isArray(qObj.options)
                  ? (qObj.options as unknown[]).map(String)
                  : [],
                correct_index: typeof qObj.correct_index === 'number' ? qObj.correct_index : 0,
                explanation: String(qObj.explanation || '').trim(),
              };
            })
          : [],
      };
    }),
  };

  return course;
}

// ─── Main generator ────────────────────────────────────────────────────────────

export async function generateCourse(opts: CourseGeneratorOptions): Promise<GeneratedCourse> {
  const messages = [
    { role: 'system' as const, content: buildSystemPrompt() },
    { role: 'user' as const, content: buildUserPrompt(opts) },
  ];

  let raw: string;
  try {
    const result = await aiChat({
      messages,
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 8000,
    });
    raw = result.content;
  } catch (err) {
    logger.error('[CourseGenerator] AI call failed', err);
    throw new Error('AI generation failed. Check OPENAI_API_KEY is configured.');
  }

  // Attempt parse; retry once with repair if it fails
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJSON(raw));
  } catch {
    logger.warn('[CourseGenerator] First parse failed, retrying with repair prompt');
    try {
      const repairResult = await aiChat({
        messages: [
          ...messages,
          { role: 'assistant' as const, content: raw },
          {
            role: 'user' as const,
            content: 'Your response was not valid JSON. Return only the JSON object, no other text.',
          },
        ],
        model: 'gpt-4o',
        temperature: 0.2,
        maxTokens: 8000,
      });
      parsed = JSON.parse(extractJSON(repairResult.content));
    } catch (repairErr) {
      logger.error('[CourseGenerator] JSON repair failed', repairErr);
      throw new Error('AI returned malformed JSON after repair attempt.');
    }
  }

  return validateCourse(parsed);
}
