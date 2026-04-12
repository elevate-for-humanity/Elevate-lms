import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { resolveLessonOjt } from '@/lib/ojt/resolveLessonOjt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    const { lessonId } = await params;
    const db = await getAdminClient();

    const lesson = await resolveLessonOjt(db, lessonId);
    if (!lesson) return safeError('Lesson not found', 404);

    if (!lesson.required_skill_id) {
      // No OJT requirement — lesson can always be completed
      return NextResponse.json({
        skillName: null,
        skillDescription: null,
        requiredReps: 0,
        requiresVerification: false,
        verifiedReps: 0,
        pendingReps: 0,
        canComplete: true,
      });
    }

    // Fetch competency log entries for this apprentice + skill
    const { data: logs, error: logsErr } = await db
      .from('competency_log')
      .select('id, supervisor_verified, service_count')
      .eq('apprentice_id', user.id)
      .eq('skill_id', lesson.required_skill_id);

    if (logsErr) return safeInternalError(logsErr, 'Failed to load competency log');

    const verifiedReps = (logs ?? [])
      .filter(l => l.supervisor_verified)
      .reduce((sum, l) => sum + (l.service_count ?? 1), 0);

    const pendingReps = (logs ?? [])
      .filter(l => !l.supervisor_verified)
      .reduce((sum, l) => sum + (l.service_count ?? 1), 0);

    // requires_verification=true → only supervisor-verified reps count toward unlock
    // requires_verification=false → any logged reps (pending or verified) count
    const effectiveReps = lesson.requires_verification ? verifiedReps : verifiedReps + pendingReps;
    const canComplete = effectiveReps >= lesson.required_reps;

    return NextResponse.json({
      skillName: lesson.skill?.name ?? 'Required skill',
      skillDescription: lesson.skill?.description ?? '',
      requiredReps: lesson.required_reps,
      requiresVerification: lesson.requires_verification,
      verifiedReps,
      pendingReps,
      canComplete,
    });
  } catch (err) {
    return safeInternalError(err, 'OJT status check failed');
  }
}
