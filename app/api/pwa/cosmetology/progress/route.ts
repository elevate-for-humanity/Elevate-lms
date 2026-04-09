/**
 * GET /api/pwa/cosmetology/progress
 *
 * Returns a strictly-typed ApprenticeProgressResponse for the authenticated
 * cosmetology apprentice. Validates the payload before returning — if any
 * field is missing or wrong type, returns 500 so the failure is loud.
 *
 * Required hours: 1,500 (Indiana IPLA cosmetology standard)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { validateProgressResponse, type ApprenticeProgressResponse } from '@/lib/api/apprentice-progress-contract';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const REQUIRED_HOURS  = 1500;
const PROGRAM_LABEL   = 'Cosmetology Apprenticeship';
const DISCIPLINE      = 'cosmetology';
const PROGRAM_SLUG    = 'cosmetology-apprenticeship';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    // ── 1. Approved + pending hours ──────────────────────────────────────────
    const { data: hoursRows, error: hoursErr } = await supabase
      .from('apprentice_hours')
      .select('hours, status, date, submitted_at')
      .eq('user_id', user.id)
      .eq('discipline', DISCIPLINE)
      .in('status', ['approved', 'pending']);

    if (hoursErr) {
      logger.error('[cosmetology/progress] hours query failed', hoursErr);
      return safeError('Failed to load hours data', 500);
    }

    const approved = (hoursRows ?? []).filter(r => r.status === 'approved');
    const pending  = (hoursRows ?? []).filter(r => r.status === 'pending');

    const totalHoursApproved = approved.reduce((s, r) => s + (r.hours ?? 0), 0);
    const totalHoursPending  = pending.reduce((s, r) => s + (r.hours ?? 0), 0);

    // ── 2. Transfer hours from legacy enrollment ─────────────────────────────
    const { data: enrollment } = await supabase
      .from('student_enrollments')
      .select('transfer_hours, lms_completed, practical_skills_verified')
      .eq('student_id', user.id)
      .maybeSingle();

    const transferHours           = enrollment?.transfer_hours           ?? 0;
    const practicalSkillsVerified = enrollment?.practical_skills_verified ?? false;

    // ── 3. LMS progress ──────────────────────────────────────────────────────
    const { data: programRow } = await supabase
      .from('programs')
      .select('id')
      .eq('slug', PROGRAM_SLUG)
      .maybeSingle();

    let lmsCompleted    = enrollment?.lms_completed ?? false;
    let lmsProgressPct  = 0;
    let checkpointsPassed = 0;
    let checkpointsTotal  = 0;

    if (programRow?.id) {
      // Total lessons in program
      const { count: totalLessons } = await supabase
        .from('curriculum_lessons')
        .select('id', { count: 'exact', head: true })
        .eq('program_id', programRow.id)
        .eq('status', 'published');

      // Completed lessons
      const { count: completedLessons } = await supabase
        .from('lesson_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true)
        .in(
          'lesson_id',
          (await supabase
            .from('curriculum_lessons')
            .select('id')
            .eq('program_id', programRow.id)
            .eq('status', 'published')
          ).data?.map(r => r.id) ?? []
        );

      if (totalLessons && totalLessons > 0) {
        lmsProgressPct = Math.round(((completedLessons ?? 0) / totalLessons) * 100);
        lmsCompleted   = lmsProgressPct === 100;
      }

      // Checkpoints
      const { count: totalCheckpoints } = await supabase
        .from('curriculum_lessons')
        .select('id', { count: 'exact', head: true })
        .eq('program_id', programRow.id)
        .eq('step_type', 'checkpoint')
        .eq('status', 'published');

      const { count: passedCheckpoints } = await supabase
        .from('checkpoint_scores')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('passed', true);

      checkpointsTotal  = totalCheckpoints ?? 0;
      checkpointsPassed = Math.min(passedCheckpoints ?? 0, checkpointsTotal);
    }

    // ── 4. Partner shop name ─────────────────────────────────────────────────
    const { data: enrollmentRow } = await supabase
      .from('program_enrollments')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('program_slug', PROGRAM_SLUG)
      .eq('status', 'active')
      .maybeSingle();

    let partnerShopName: string | null = null;
    if (enrollmentRow?.organization_id) {
      const { data: partner } = await supabase
        .from('partners')
        .select('name')
        .eq('id', enrollmentRow.organization_id)
        .maybeSingle();
      partnerShopName = partner?.name ?? null;
    }

    // ── 5. Weekly average + projected completion ─────────────────────────────
    let weeklyAvgHours: number | null = null;
    let projectedCompletionDate: string | null = null;

    const totalHoursTowardRequired = totalHoursApproved + transferHours;
    const hoursLeft = Math.max(0, REQUIRED_HOURS - totalHoursTowardRequired);

    // Only project if hours are not yet complete
    if (hoursLeft > 0 && approved.length >= 2) {
      const dates = approved
        .map(r => new Date(r.date).getTime())
        .sort((a, b) => a - b);

      const spanWeeks = Math.max(1, (dates[dates.length - 1] - dates[0]) / (7 * 24 * 60 * 60 * 1000));
      weeklyAvgHours = Math.round((totalHoursApproved / spanWeeks) * 10) / 10;

      if (weeklyAvgHours > 0) {
        const weeksLeft  = hoursLeft / weeklyAvgHours;
        const projected  = new Date();
        projected.setUTCHours(0, 0, 0, 0);
        projected.setDate(projected.getDate() + Math.ceil(weeksLeft * 7));
        projectedCompletionDate = projected.toISOString().split('T')[0];
      }
    }

    // ── 6. Build + validate response ─────────────────────────────────────────
    const payload: ApprenticeProgressResponse = {
      totalHoursApproved:      Math.round(totalHoursApproved * 10) / 10,
      totalHoursPending:       Math.round(totalHoursPending * 10) / 10,
      requiredHours:           REQUIRED_HOURS,
      transferHours:           Math.round(transferHours * 10) / 10,
      lmsCompleted,
      lmsProgressPct,
      practicalSkillsVerified,
      checkpointsPassed,
      checkpointsTotal,
      programLabel:            PROGRAM_LABEL,
      partnerShopName,
      weeklyAvgHours,
      projectedCompletionDate,
    };

    const contractViolation = validateProgressResponse(payload);
    if (contractViolation) {
      // This is a server-side bug — log it loudly and return 500
      logger.error('[cosmetology/progress] contract violation', { violation: contractViolation, payload });
      return safeError(`Progress API contract violation: ${contractViolation}`, 500);
    }

    return NextResponse.json(payload);
  } catch (err) {
    return safeInternalError(err, 'Failed to load progress');
  }
}
