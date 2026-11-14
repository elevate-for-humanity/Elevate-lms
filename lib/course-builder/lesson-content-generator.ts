import { groqJSON } from '@/lib/groq-client';
import type { BlueprintLessonRef } from '@/lib/curriculum/blueprints/types';
import { z } from 'zod';

export interface GeneratedLessonContent {
  objective: string;
  content: string;
  quiz_questions: Array<{
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }>;
}

const generatedQuestionSchema = z.object({
  question: z.string().min(10),
  options: z.array(z.string().min(2)).min(4),
  correct: z.number().int().min(0),
  explanation: z.string().min(10),
});

const generatedLessonSchema = z.object({
  objective: z.string().min(20),
  content: z.string().min(200),
  quiz_questions: z.array(generatedQuestionSchema),
});

export async function generateLessonContent(
  lesson: BlueprintLessonRef,
  moduleTitle: string,
  courseTitle: string,
  state: string,
  standardsBlock?: string,
): Promise<GeneratedLessonContent> {
  const isCheckpoint = lesson.slug.includes('checkpoint');
  const isExam = lesson.slug.includes('exam') || lesson.slug.includes('final');
  const questionCount = isExam ? 10 : isCheckpoint ? 5 : 3;

  const prompt = `You are a curriculum architect writing premium workforce training content.

Course: ${courseTitle} (${state})
Module: ${moduleTitle}
Lesson: ${lesson.title}
Type: ${isExam ? 'final exam' : isCheckpoint ? 'checkpoint quiz' : 'lesson'}

${standardsBlock ? `INDUSTRY STANDARDS CONTEXT:\n${standardsBlock}\n\nUse this standards context as authoritative. Lesson objective, content, and quiz questions must trace back to listed job tasks/skills/credential domains when applicable.` : ''}

Return ONLY valid JSON — no markdown, no prose:
{
  "objective": "By the end of this lesson, learners will be able to... (one sentence, 20-80 words)",
  "content": "<h2>...</h2><p>...</p>... (full HTML, minimum 400 words, use h2/p/ul/li, cover core concepts, real-world application, key terminology, practical guidance)",
  "quiz_questions": [
    {
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct": 0,
      "explanation": "..."
    }
  ]
}

Rules:
- objective: starts with "By the end of this lesson, learners will be able to"
- content: minimum 400 words, professional HTML, no placeholders
- quiz_questions: exactly ${questionCount} questions, correct is 0-indexed
- All content must be specific to ${courseTitle} — no generic filler`;

  const raw = await groqJSON<unknown>(prompt);
  const parsed = generatedLessonSchema.parse(raw);

  if (!parsed.objective.startsWith('By the end of this lesson, learners will be able to')) {
    throw new Error('Generated objective does not follow required format');
  }

  // Keep output quality aligned with seeder expectations and prevent placeholder blobs.
  const visibleChars = parsed.content.replace(/<[^>]*>/g, '').trim().length;
  if (visibleChars < 400) {
    throw new Error(`Generated content too short (${visibleChars} visible chars)`);
  }

  if (parsed.quiz_questions.length !== questionCount) {
    throw new Error(
      `Generated quiz question count mismatch (expected ${questionCount}, got ${parsed.quiz_questions.length})`,
    );
  }

  for (const entry of parsed.quiz_questions) {
    if (entry.correct >= entry.options.length) {
      throw new Error('Generated quiz question has invalid correct answer index');
    }
  }

  return parsed;
}
