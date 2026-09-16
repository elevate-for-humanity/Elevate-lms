import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getCurrentUser } from '@/lib/auth';
import { assertLessonAccess, accessErrorResponse } from '@/lib/lms/access-control';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getTimeclockWeekEnding, getTimeclockWorkDate } from '@/lib/timeclock/work-date';
import { APPRENTICE_TIME_POLICY } from '@/lib/timeclock/policy';
import { resolveCourseEnrollment } from '@/lib/enrollment/resolve-course-enrollment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TheoryAction = 'start' | 'heartbeat' | 'stop';

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    action?: TheoryAction;
    courseId?: string;
    lessonId?: string;
    sessionId?: string;
    creditFinal?: boolean;
  };
  if (!body.action || !['start', 'heartbeat', 'stop'].includes(body.action)) {
    return NextResponse.json({ error: 'Valid theory session action required' }, { status: 400 });
  }

  const db = await requireAdminClient();
  if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  if (body.action === 'heartbeat') {
    if (!body.sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    const { data, error } = await db.rpc('record_theory_activity_heartbeat', {
      p_session_id: body.sessionId,
      p_user_id: user.id,
    });
    if (error) return NextResponse.json({ error: 'Unable to record theory activity' }, { status: 409 });
    const result = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({
      tracked: true,
      sessionId: result?.session_id ?? body.sessionId,
      creditedSeconds: Number(result?.credited_seconds ?? 0),
      weeklyActiveSeconds: Number(result?.weekly_active_seconds ?? 0),
      status: result?.session_status ?? 'active',
      message: result?.block_reason ?? null,
    });
  }

  if (body.action === 'stop') {
    if (!body.sessionId) return NextResponse.json({ tracked: false });
    if (body.creditFinal) {
      await db.rpc('record_theory_activity_heartbeat', {
        p_session_id: body.sessionId,
        p_user_id: user.id,
      });
    }
    await db
      .from('theory_activity_sessions')
      .update({ status: 'completed', ended_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', body.sessionId)
      .eq('user_id', user.id)
      .eq('status', 'active');
    return NextResponse.json({ tracked: true, stopped: true });
  }

  if (!body.courseId || !body.lessonId) {
    return NextResponse.json({ error: 'courseId and lessonId required' }, { status: 400 });
  }
  try {
    await assertLessonAccess(user.id, body.lessonId);
  } catch (error) {
    const { status, body: responseBody } = accessErrorResponse(error);
    return NextResponse.json(responseBody, { status });
  }

  const [{ data: apprentice }, { data: lesson }, enrollment] = await Promise.all([
    db.from('apprentices').select('id').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
    db.from('course_lessons').select('id,course_id').eq('id', body.lessonId).eq('course_id', body.courseId).maybeSingle(),
    resolveCourseEnrollment(user.id, body.courseId),
  ]);
  if (!apprentice) return NextResponse.json({ tracked: false, reason: 'NOT_APPRENTICE' });
  if (!lesson || !enrollment || !['active', 'enrolled', 'in_progress', 'completed', 'confirmed'].includes(String(enrollment.status).toLowerCase())) {
    return NextResponse.json({ error: 'Active lesson enrollment required' }, { status: 403 });
  }

  const { data: openShift } = await db
    .from('progress_entries')
    .select('id')
    .eq('apprentice_id', apprentice.id)
    .not('clock_in_at', 'is', null)
    .is('clock_out_at', null)
    .limit(1)
    .maybeSingle();
  if (openShift) {
    return NextResponse.json(
      { error: 'Clock out of OJL before starting theory.', code: 'OJL_OVERLAP' },
      { status: 409 },
    );
  }

  const workDate = getTimeclockWorkDate();
  const weekEnding = getTimeclockWeekEnding(workDate);
  const { data: weeklySessions } = await db
    .from('theory_activity_sessions')
    .select('active_seconds')
    .eq('user_id', user.id)
    .eq('week_ending', weekEnding);
  const weeklyActiveSeconds = (weeklySessions || []).reduce(
    (sum: number, row: any) => sum + Number(row.active_seconds || 0),
    0,
  );
  if (weeklyActiveSeconds >= APPRENTICE_TIME_POLICY.weeklyTheoryMaxHours * 3600) {
    return NextResponse.json(
      { error: 'The weekly 10-hour theory limit has been reached.', code: 'WEEKLY_THEORY_LIMIT_REACHED' },
      { status: 409 },
    );
  }

  await db
    .from('theory_activity_sessions')
    .update({ status: 'completed', ended_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('status', 'active');
  const { data: session, error } = await db
    .from('theory_activity_sessions')
    .insert({
      user_id: user.id,
      enrollment_id: enrollment.id,
      course_id: body.courseId,
      lesson_id: body.lessonId,
      week_ending: weekEnding,
    })
    .select('id,active_seconds')
    .single();
  if (error || !session) return NextResponse.json({ error: 'Unable to start theory tracking' }, { status: 500 });

  return NextResponse.json({
    tracked: true,
    sessionId: session.id,
    sessionActiveSeconds: Number(session.active_seconds || 0),
    weeklyActiveSeconds,
    heartbeatIntervalSeconds: APPRENTICE_TIME_POLICY.theoryHeartbeatIntervalSeconds,
    inactivityTimeoutSeconds: APPRENTICE_TIME_POLICY.theoryInactivityTimeoutSeconds,
  });
}

export const POST = withApiAudit('/api/theory/session', _POST);
