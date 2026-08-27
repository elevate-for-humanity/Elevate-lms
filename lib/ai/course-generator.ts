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
  options: string[]; // 4 options, A–D
  correct_index: number; // 0-based
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GeneratedVideoSegment {
  title: string;
  narration: string;
  visual_direction: string;
  duration_seconds: number;
}

export interface GeneratedLesson {
  title: string;
  description: string; // 1–2 sentence summary
  content: string; // Full lesson body (markdown)
  /** 1–3 sentence learner-facing summary for preview and audit scoring */
  summary_text: string;
  key_takeaways: string[];
  reflection_prompt: string;
  /**
   * Competency keys this lesson covers. Must match keys in competency_exam_profiles.
   * Max 3 — more than 3 triggers stuffing penalty in the validator.
   */
  competency_keys: string[];
  learning_objectives: string[];
  scenario: string;
  practice_exercise: string;
  remediation_guidance: string;
  video_segments: GeneratedVideoSegment[];
  quiz_questions: GeneratedQuizQuestion[];
  duration_minutes: number;
}

export interface GeneratedCourse {
  title: string;
  course_name: string; // same as title — required NOT NULL field
  description: string;
  summary: string; // 1–2 sentence elevator pitch
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
- Assessment difficulty: approximately 30% easy, 50% medium, and 20% hard across the course.
- Every lesson must include measurable objectives, a workplace scenario, guided practice, and remediation guidance.
- Video scripts must be segmented into short scenes with narration, visual direction, and timing.
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
  ]
    .filter(Boolean)
    .join('\n');

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
      "summary_text": "string (1–3 sentences — what the learner will be able to do after this lesson)",
      "key_takeaways": ["string", ...],
      "reflection_prompt": "string (one open-ended question for learner reflection)",
      "competency_keys": ["string", ...],
      "learning_objectives": ["2–4 measurable objectives using Bloom action verbs"],
      "scenario": "credential-relevant workplace scenario",
      "practice_exercise": "guided learn-by-doing exercise with observable outcome",
      "remediation_guidance": "targeted next steps when the learner misses this lesson's checks",
      "video_segments": [
        {
          "title": "short scene title",
          "narration": "spoken script for this scene",
          "visual_direction": "specific demonstration, diagram, annotation, or on-screen emphasis",
          "duration_seconds": 60
        }
      ],
      "duration_minutes": number,
      "quiz_questions": [
        {
          "question": "string",
          "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
          "correct_index": 0,
          "explanation": "string",
          "difficulty": "easy|medium|hard"
        }
      ]
    }
  ]
}

Generate exactly ${lessonCount} lessons.
${!includeQuiz ? 'Set quiz_questions to [] for all lessons.' : 'Include 2–3 quiz questions per lesson.'}
${!includeReflection ? 'Set reflection_prompt to "" for all lessons.' : ''}

For competency_keys: assign 1–3 short kebab-case keys per lesson that name the specific competency the lesson teaches (e.g. "peer-support-boundaries", "motivational-interviewing", "trauma-informed-care"). These must be specific to the lesson content, not generic labels.
For summary_text: write 1–3 sentences describing what the learner will be able to do after completing this lesson.`;
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
        summary_text: String(lesson.summary_text || lesson.description || '').trim(),
        key_takeaways: Array.isArray(lesson.key_takeaways)
          ? (lesson.key_takeaways as unknown[]).map(String)
          : [],
        reflection_prompt: String(lesson.reflection_prompt || '').trim(),
        competency_keys: Array.isArray(lesson.competency_keys)
          ? (lesson.competency_keys as unknown[]).map(String).slice(0, 3)
          : [],
        learning_objectives: Array.isArray(lesson.learning_objectives)
          ? (lesson.learning_objectives as unknown[]).map(String).filter(Boolean).slice(0, 4)
          : [],
        scenario: String(lesson.scenario || '').trim(),
        practice_exercise: String(lesson.practice_exercise || '').trim(),
        remediation_guidance: String(lesson.remediation_guidance || '').trim(),
        video_segments: Array.isArray(lesson.video_segments)
          ? (lesson.video_segments as unknown[]).map((segment: unknown, segmentIndex: number) => {
              const value = (segment || {}) as Record<string, unknown>;
              return {
                title: String(value.title || `Scene ${segmentIndex + 1}`).trim(),
                narration: String(value.narration || '').trim(),
                visual_direction: String(value.visual_direction || '').trim(),
                duration_seconds: typeof value.duration_seconds === 'number'
                  ? Math.max(15, Math.min(180, value.duration_seconds))
                  : 60,
              };
            }).filter((segment) => segment.narration && segment.visual_direction)
          : [],
        duration_minutes:
          typeof lesson.duration_minutes === 'number' ? lesson.duration_minutes : 30,
        quiz_questions: Array.isArray(lesson.quiz_questions)
          ? (lesson.quiz_questions as unknown[]).map((q: unknown) => {
              const qObj = (q || {}) as Record<string, unknown>;
              return {
                question: String(qObj.question || '').trim(),
                options: Array.isArray(qObj.options) ? (qObj.options as unknown[]).map(String) : [],
                correct_index: typeof qObj.correct_index === 'number' ? qObj.correct_index : 0,
                explanation: String(qObj.explanation || '').trim(),
                difficulty: (['easy', 'medium', 'hard'].includes(String(qObj.difficulty))
                  ? qObj.difficulty
                  : 'medium') as GeneratedQuizQuestion['difficulty'],
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
      model: 'gpt-4.1',
      temperature: 0.7,
      maxTokens: 8000,
    });
    raw = result.content;
  } catch (err) {
    logger.error('[CourseGenerator] AI call failed', err);
    throw new Error('AI generation failed. Check OPENAI_API_KEY is configured.', { cause: err });
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
            content:
              'Your response was not valid JSON. Return only the JSON object, no other text.',
          },
        ],
        model: 'gpt-4.1',
        temperature: 0.2,
        maxTokens: 8000,
      });
      parsed = JSON.parse(extractJSON(repairResult.content));
    } catch (repairErr) {
      logger.error('[CourseGenerator] JSON repair failed', repairErr);
      throw new Error('AI returned malformed JSON after repair attempt.', { cause: repairErr });
    }
  }

  return validateCourse(parsed);
}
