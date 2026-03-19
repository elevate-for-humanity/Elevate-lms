/**
 * GET  /api/admin/courses/[id]/quiz  — load quiz from metadata
 * PUT  /api/admin/courses/[id]/quiz  — save quiz back to metadata
 *
 * Quiz data lives in training_courses.metadata JSONB:
 *   { quiz_title, quiz_passing_score, quiz_questions: QuizQuestionBlueprint[] }
 *
 * This avoids the integer/UUID mismatch with the legacy quizzes table.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;
  if (!supabase) return { error: 'Database unavailable', status: 500 };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await db
    .from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'org_admin', 'instructor'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user, profile, db };
}

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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: course, error } = await auth.db
    .from('courses')
    .select('metadata')
    .eq('id', id)
    .single();

  if (error?.code === 'PGRST116') return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 });

  const meta = (course?.metadata || {}) as Record<string, any>;
  return NextResponse.json({
    quiz_title: meta.quiz_title || 'Course Assessment',
    quiz_passing_score: meta.quiz_passing_score || 70,
    quiz_questions: meta.quiz_questions || [],
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = QuizSaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Validate each question has correct_answer in options
  for (const [qi, q] of parsed.data.quiz_questions.entries()) {
    if (!q.options.includes(q.correct_answer)) {
      return NextResponse.json(
        { error: `Question ${qi + 1}: correct answer "${q.correct_answer}" is not in the options list.` },
        { status: 400 }
      );
    }
  }

  // Quiz data is stored per-lesson in course_lessons.quiz_questions.
  // Course-level quiz metadata is no longer supported.
  // Use PATCH /api/admin/lms/courses/[courseId]/lessons/[lessonId] to update quiz questions.
  return NextResponse.json(
    { error: 'LEGACY_SYSTEM_DISABLED: quiz data is stored in course_lessons.quiz_questions — update via lesson API' },
    { status: 410 }
  );

  // Load existing metadata to merge (preserve non-quiz keys)
  const { data: existing } = await auth.db
    .from('courses')
    .select('metadata')
    .eq('id', id)
    .single();

  const existingMeta = (existing?.metadata || {}) as Record<string, any>;
  const updatedMeta = {
    ...existingMeta,
    quiz_title: parsed.data.quiz_title,
    quiz_passing_score: parsed.data.quiz_passing_score,
    quiz_questions: parsed.data.quiz_questions,
  };

  const { error: updateError } = await auth.db
    .from('courses')
    .update({ metadata: updatedMeta, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (updateError) return NextResponse.json({ error: 'Failed to save quiz' }, { status: 500 });

  return NextResponse.json({ ok: true, question_count: parsed.data.quiz_questions.length });
}
