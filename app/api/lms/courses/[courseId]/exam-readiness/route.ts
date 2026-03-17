// GET /api/lms/courses/[courseId]/exam-readiness
// Returns the current learner's exam readiness state for this course,
// including per-domain scores for the block reason panel.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  const { courseId } = await params;
  const db = createAdminClient() ?? supabase;

  // Resolve program_id from course
  const { data: course } = await db
    .from('training_courses')
    .select('program_id')
    .eq('id', courseId)
    .maybeSingle();

  if (!course?.program_id) {
    // No program linked — no readiness rules apply
    return NextResponse.json({ applicable: false });
  }

  const programId = course.program_id;

  // Check if exam ready rules exist for this program
  const { data: rules } = await db
    .from('program_exam_ready_rules')
    .select('min_avg_checkpoint_score, min_checkpoint_score')
    .eq('program_id', programId)
    .maybeSingle();

  if (!rules) {
    return NextResponse.json({ applicable: false });
  }

  // Call evaluate_exam_readiness for structured result
  const { data: readiness, error: rpcErr } = await db.rpc('evaluate_exam_readiness', {
    p_user_id:    user.id,
    p_program_id: programId,
  });

  if (rpcErr) {
    return NextResponse.json({ applicable: false });
  }

  const r = Array.isArray(readiness) ? readiness[0] : readiness;

  // Fetch per-domain scores for the panel
  const { data: domains } = await db
    .from('program_competency_domains')
    .select('domain_key, domain_name, domain_min_score, is_required')
    .eq('program_id', programId)
    .eq('is_required', true)
    .order('domain_name');

  // Compute per-domain learner avg from checkpoint_scores
  const domainStatuses = await Promise.all(
    (domains ?? []).map(async (d) => {
      const { data: scores } = await db
        .from('checkpoint_scores')
        .select('score, lesson_id')
        .eq('user_id', user.id)
        .eq('passed', true);

      // Get checkpoint lessons tagged to this domain
      const { data: checkpointLessons } = await db
        .from('curriculum_lessons')
        .select('id')
        .eq('program_id', programId)
        .eq('step_type', 'checkpoint')
        .contains('competency_keys', [d.domain_key]);

      const lessonIds = new Set((checkpointLessons ?? []).map((l: { id: string }) => l.id));
      const domainScores = (scores ?? [])
        .filter((s: { lesson_id: string; score: number }) => lessonIds.has(s.lesson_id))
        .map((s: { score: number }) => s.score);

      const avg = domainScores.length > 0
        ? Math.round(domainScores.reduce((a: number, b: number) => a + b, 0) / domainScores.length)
        : 0;

      const passed = avg > 0 && (d.domain_min_score === null || avg >= d.domain_min_score);

      return {
        domain_key:       d.domain_key,
        domain_name:      d.domain_name,
        domain_min_score: d.domain_min_score,
        learner_avg:      avg,
        passed,
        failure_reason:   !passed
          ? avg === 0
            ? `${d.domain_name}: not yet covered`
            : `${d.domain_name}: ${avg}% (need ${d.domain_min_score}%)`
          : null,
      };
    })
  );

  // Active authorization if any
  const { data: auth } = await db
    .from('exam_authorizations')
    .select('expires_at')
    .eq('user_id', user.id)
    .eq('program_id', programId)
    .not('status', 'in', '(expired,revoked)')
    .order('authorized_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    applicable:              true,
    is_ready:                r?.is_ready ?? false,
    avg_score:               r?.avg_checkpoint_score ?? null,
    min_score:               r?.min_checkpoint_score ?? null,
    checkpoints_passed:      r?.checkpoints_passed ?? 0,
    checkpoints_total:       r?.checkpoints_total ?? 0,
    lessons_completed:       r?.lessons_completed ?? 0,
    lessons_total:           r?.lessons_total ?? 0,
    failure_reasons:         r?.failure_reasons ?? [],
    domains:                 domainStatuses,
    authorization_expires_at: auth?.expires_at ?? null,
  });
}
