/**
 * GET  /api/admin/courses/[courseId]/quiz  — load quiz metadata
 * PUT  /api/admin/courses/[courseId]/quiz  — disabled (quiz data moved to course_lessons)
 */

import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuestionSchema = z.object({
  question_text: z.string().min(1, 'Question text is required'),
  question_type: z.enum(['multiple_choice', 'true_false']).default('multiple_choice'),
  options: z.array(z.string()).min(2, 'At least 2 options required'),
  correct_answer: z.string().min(1, 'Correct answer is required'),
  points: z.number().int().min(1).default(1),
});

const QuizSaveSchema = z.object({
  quiz_title: z.string().min(1).default('Course Assessment'),
  quiz_passing_score: z.number().int().min(0).max(100).default(70),
  quiz_questions: z.array(QuestionSchema),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await createClient();
  const { data: course, error } = await db
    .from('courses')
    .select('metadata')
    .eq('id', courseId)
    .maybeSingle();

  if (error?.code === 'PGRST116')
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 });

  const meta = (course?.metadata || {}) as Record<string, unknown>;
  return NextResponse.json({
    quiz_title: meta.quiz_title || 'Course Assessment',
    quiz_passing_score: meta.quiz_passing_score || 70,
    quiz_questions: meta.quiz_questions || [],
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  await params; // consume params
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = QuizSaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Quiz data is stored per-lesson in course_lessons.quiz_questions.
  // Use PATCH /api/admin/lms/courses/[courseId]/lessons/[lessonId] to update quiz questions.
  return NextResponse.json(
    { error: 'Quiz data is stored in course_lessons.quiz_questions — update via lesson API' },
    { status: 410 },
  );
}
