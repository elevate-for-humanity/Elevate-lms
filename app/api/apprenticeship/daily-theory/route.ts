import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import {
  DAILY_THEORY_PASSING_SCORE,
  isBeautyApprenticeshipSlug,
} from '@/lib/beauty-apprenticeship/constants';
import {
  dailyTheoryBlockedMessage,
  scorePassesDailyTheory,
  theoryDateInTimeZone,
} from '@/lib/beauty-apprenticeship/daily-theory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET ?program_slug=barber-apprenticeship — today’s daily theory status */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  const programSlug = request.nextUrl.searchParams.get('program_slug') ?? '';
  if (!isBeautyApprenticeshipSlug(programSlug)) {
    return safeError('Invalid program_slug', 400);
  }

  const theoryDate = theoryDateInTimeZone();
  const { data, error } = await supabase
    .from('apprenticeship_daily_theory')
    .select('best_score, passed, attempt_count, theory_date, lesson_id')
    .eq('user_id', user.id)
    .eq('program_slug', programSlug)
    .eq('theory_date', theoryDate)
    .maybeSingle();

  if (error) return safeInternalError(error, 'Failed to load daily theory status');

  const passed = data?.passed === true;
  return NextResponse.json({
    program_slug: programSlug,
    theory_date: theoryDate,
    passing_score: DAILY_THEORY_PASSING_SCORE,
    passed,
    best_score: data?.best_score ?? null,
    attempt_count: data?.attempt_count ?? 0,
    lesson_id: data?.lesson_id ?? null,
    can_credit_theory_hours: passed,
    message: passed ? null : dailyTheoryBlockedMessage(data?.best_score ?? undefined),
  });
}

/** POST { program_slug, score, lesson_id? } — record quiz attempt; updates best score */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    const body = await request.json();
    const programSlug = body.program_slug as string;
    const score = Number(body.score);
    const lessonId = body.lesson_id as string | undefined;

    if (!isBeautyApprenticeshipSlug(programSlug)) {
      return safeError('Invalid program_slug', 400);
    }
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return safeError('score must be 0–100', 400);
    }

    const theoryDate = theoryDateInTimeZone();
    const passed = scorePassesDailyTheory(score);
    const now = new Date().toISOString();

    const admin = await requireAdminClient();
    if (!admin) return safeError('Service unavailable', 503);

    const { data: existing } = await admin
      .from('apprenticeship_daily_theory')
      .select('id, best_score, passed, attempt_count')
      .eq('user_id', user.id)
      .eq('program_slug', programSlug)
      .eq('theory_date', theoryDate)
      .maybeSingle();

    const bestScore = Math.max(Number(existing?.best_score ?? 0), score);
    const nowPassed = existing?.passed === true || passed || scorePassesDailyTheory(bestScore);

    const row = {
      user_id: user.id,
      program_slug: programSlug,
      theory_date: theoryDate,
      lesson_id: lessonId ?? null,
      best_score: bestScore,
      passed: nowPassed,
      attempt_count: (existing?.attempt_count ?? 0) + 1,
      last_attempt_at: now,
      updated_at: now,
    };

    const { data: saved, error } = await admin
      .from('apprenticeship_daily_theory')
      .upsert(row, { onConflict: 'user_id,program_slug,theory_date' })
      .select('best_score, passed, attempt_count, theory_date')
      .single();

    if (error) return safeInternalError(error, 'Failed to save daily theory attempt');

    return NextResponse.json({
      ...saved,
      passing_score: DAILY_THEORY_PASSING_SCORE,
      can_credit_theory_hours: saved.passed === true,
      message: saved.passed
        ? 'Daily theory requirement met for today.'
        : dailyTheoryBlockedMessage(Number(saved.best_score)),
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to record daily theory');
  }
}
