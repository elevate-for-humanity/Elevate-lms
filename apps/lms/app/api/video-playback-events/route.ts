import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { createClient } from '@/lib/supabase/server';
import { resolveCoursePreview } from '@/lib/admin/course-preview';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { resolveCourseEnrollment } from '@/lib/enrollment/resolve-course-enrollment';
import { assertLessonAccess, accessErrorResponse } from '@/lib/lms/access-control';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EVENT_TYPES = new Set(['play', 'pause', 'heartbeat', 'ended', 'error']);

type PlaybackEventBody = {
  courseId?: unknown;
  lessonId?: unknown;
  eventType?: unknown;
  currentTime?: unknown;
  duration?: unknown;
  sessionId?: unknown;
  errorMessage?: unknown;
};

function boundedNumber(value: unknown, maximum: number): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= maximum
    ? value
    : null;
}

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as PlaybackEventBody | null;
  const courseId = typeof body?.courseId === 'string' ? body.courseId.trim() : '';
  const lessonId = typeof body?.lessonId === 'string' ? body.lessonId.trim() : '';
  const eventType = typeof body?.eventType === 'string' ? body.eventType.trim() : '';
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : '';
  const currentTime = boundedNumber(body?.currentTime, 43_200);
  const duration = boundedNumber(body?.duration, 43_200);
  const errorMessage =
    typeof body?.errorMessage === 'string' ? body.errorMessage.trim().slice(0, 500) : null;

  if (
    !courseId ||
    !lessonId ||
    !EVENT_TYPES.has(eventType) ||
    !sessionId ||
    sessionId.length > 100 ||
    (body?.currentTime !== null && body?.currentTime !== undefined && currentTime === null) ||
    (body?.duration !== null && body?.duration !== undefined && duration === null) ||
    (currentTime !== null && duration !== null && currentTime > duration + 5)
  ) {
    return NextResponse.json({ error: 'Invalid playback event.' }, { status: 400 });
  }

  const db = await requireAdminClient();
  const [coursePreview, portalSubject, profileResult] = await Promise.all([
    resolveCoursePreview(courseId),
    resolvePortalPreviewSubject(db, user.id),
    db.from('profiles').select('role').eq('id', user.id).maybeSingle(),
  ]);
  if (profileResult.error) {
    return NextResponse.json({ error: 'Unable to verify learner identity.' }, { status: 503 });
  }
  if (coursePreview.active || portalSubject.previewing ||
      ['admin', 'super_admin', 'staff', 'instructor'].includes(String(profileResult.data?.role || ''))) {
    return NextResponse.json({ error: 'Playback records are disabled in administrator preview.', code: 'PREVIEW_READ_ONLY' }, { status: 403 });
  }
  const enrollment = await resolveCourseEnrollment(user.id, courseId);
  if (!enrollment || !['active', 'enrolled', 'in_progress', 'completed', 'confirmed'].includes(String(enrollment.status).toLowerCase())) {
    return NextResponse.json({ error: 'Active course enrollment required.', code: 'ENROLLMENT_REQUIRED' }, { status: 403 });
  }
  const { data: pacing, error: pacingError } = await supabase.rpc('get_my_course_pacing', {
    p_course_id: courseId,
  });
  if (pacingError) {
    return NextResponse.json({ error: 'Unable to verify study access.' }, { status: 503 });
  }
  if (pacing?.theoryWindow?.allowed === false) {
    return NextResponse.json({
      error: 'Playback tracking is unavailable outside your saved theory study times.',
      code: pacing.theoryWindow.reason || 'THEORY_WINDOW_CLOSED',
    }, { status: 403 });
  }
  const scheduled = pacing?.lessons?.find((lesson: { id: string }) => lesson.id === lessonId);
  if (scheduled && !scheduled.available) {
    return NextResponse.json({ error: 'This lesson is not yet available.', code: 'LESSON_LOCKED' }, { status: 403 });
  }
  try {
    await assertLessonAccess(user.id, lessonId);
  } catch (error) {
    const { status, body: errorBody } = accessErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }

  const { data: lesson, error: lessonError } = await db
    .from('course_lessons')
    .select('course_id,status,is_published')
    .eq('id', lessonId)
    .maybeSingle();

  if (
    lessonError ||
    !lesson ||
    lesson.course_id !== courseId ||
    lesson.status !== 'published' ||
    lesson.is_published !== true
  ) {
    return NextResponse.json({ error: 'Published lesson access could not be verified.' }, { status: 400 });
  }

  const { error } = await db.from('video_playback_events').insert({
    user_id: user.id,
    action: 'learner_video_playback',
    event_type: eventType,
    video_id: lessonId,
    page_slug: `/lms/courses/${courseId}/lessons/${lessonId}`,
    current_time: currentTime,
    duration,
    error_message: errorMessage,
    session_id: sessionId,
    details: {
      courseId,
      lessonId,
      source: 'interactive-video-player',
      authenticatedLearnerSession: true,
      evidenceType: 'client_media_event',
    },
  });

  if (error) {
    logger.error('Learner playback event persistence failed', error, {
      userId: user.id,
      courseId,
      lessonId,
      eventType,
    });
    return NextResponse.json({ error: 'Playback evidence could not be saved.' }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}

