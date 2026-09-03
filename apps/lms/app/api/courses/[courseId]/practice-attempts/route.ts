// pre-auth-registry: exempt - requireAuth and active enrollment are verified before every practice_attempts write; user_id always comes from the authenticated session.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CompleteAttemptSchema = z.object({
  totalQuestions: z.number().int().positive().max(500),
  correctAnswers: z.number().int().nonnegative().max(500),
  domainScores: z.record(z.string(), z.number().min(0).max(100)).default({}),
  timeSpentSeconds: z.number().int().nonnegative().max(86_400).optional(),
  sectionKey: z.enum(['core', 'type-i', 'type-ii', 'type-iii', 'universal']),
});

async function ensureEnrollment(db: Awaited<ReturnType<typeof createClient>>, userId: string, courseId: string) {
  const { data, error } = await db
    .from('course_enrollments')
    .select('id')
    .eq('student_id', userId)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { user, error: authError } = await requireAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { courseId } = await params;
  const db = await createClient();
  if (!(await ensureEnrollment(db, user.id, courseId))) return NextResponse.json({ error: 'Course access required' }, { status: 403 });

  const { data, error } = await db
    .from('practice_attempts')
    .select('id,attempt_number,score,total_questions,correct_answers,domain_scores,time_spent_seconds,status,started_at,completed_at')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .order('attempt_number', { ascending: true });
  if (error) return NextResponse.json({ error: 'Unable to load practice attempts' }, { status: 500 });

  const attempts = data ?? [];
  return NextResponse.json({ success: true, attempts, used: attempts.length, remaining: Math.max(0, 6 - attempts.length), maxAttempts: 6 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { user, error: authError } = await requireAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { courseId } = await params;
  const db = await createClient();
  if (!(await ensureEnrollment(db, user.id, courseId))) return NextResponse.json({ error: 'Course access required' }, { status: 403 });

  const parsed = CompleteAttemptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid practice assessment result', details: parsed.error.flatten() }, { status: 400 });
  const { totalQuestions, correctAnswers, domainScores, timeSpentSeconds, sectionKey } = parsed.data;
  if (correctAnswers > totalQuestions) return NextResponse.json({ error: 'correctAnswers cannot exceed totalQuestions' }, { status: 400 });

  const { data: existing, error: countError } = await db
    .from('practice_attempts')
    .select('attempt_number,domain_scores')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .order('attempt_number', { ascending: false });
  if (countError) return NextResponse.json({ error: 'Unable to verify attempts' }, { status: 500 });
  const sectionAttempts = (existing ?? []).filter((attempt) => {
    const scores = attempt.domain_scores;
    return scores && typeof scores === 'object' && !Array.isArray(scores) && scores.sectionKey === sectionKey;
  }).length;
  if (sectionAttempts >= 6) {
    return NextResponse.json({ error: 'PRACTICE_ATTEMPT_LIMIT', sectionKey, maxAttempts: 6 }, { status: 409 });
  }

  const attemptNumber = Number((existing ?? [])[0]?.attempt_number ?? 0) + 1;
  const score = Math.round((correctAnswers / totalQuestions) * 10000) / 100;
  const now = new Date().toISOString();
  const { data, error } = await db
    .from('practice_attempts')
    .insert({
      user_id: user.id,
      course_id: courseId,
      attempt_number: attemptNumber,
      score,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      domain_scores: { ...domainScores, sectionKey },
      time_spent_seconds: timeSpentSeconds ?? null,
      status: 'completed',
      completed_at: now,
    })
    .select('id,attempt_number,score,total_questions,correct_answers,domain_scores,time_spent_seconds,status,started_at,completed_at')
    .single();
  if (error) return NextResponse.json({ error: 'Unable to save practice attempt' }, { status: 500 });

  const weakDomains = Object.entries(domainScores).filter(([, value]) => value < 80).map(([key]) => key);
  return NextResponse.json({
    success: true,
    attempt: data,
    masteryThreshold: 80,
    mastered: score >= 80 && weakDomains.length === 0,
    weakDomains,
    nextAction: weakDomains.length ? 'focused_review' : attemptNumber < 6 ? 'continue_spaced_review' : 'readiness_report',
    remaining: Math.max(0, 6 - sectionAttempts - 1),
  });
}
