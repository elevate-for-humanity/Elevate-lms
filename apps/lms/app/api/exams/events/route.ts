import { logger } from '@/lib/logger';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { NextResponse } from 'next/server';
import { requireExamSessionAccess } from '@/lib/testing/session-access';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  try {
    const body = await req.json();

    const examSessionId = body?.exam_session_id;
    const eventType = body?.event_type;
    const metadata = body?.metadata ?? {};

    if (!examSessionId || !eventType) {
      return NextResponse.json(
        { error: 'exam_session_id and event_type are required' },
        { status: 400 },
      );
    }

    const allowed = new Set([
      'tab_hidden',
      'window_blur',
      'fullscreen_exit',
      'camera_started',
      'camera_denied',
      'camera_stopped',
      'recording_uploaded',
      'devtools_detected',
      'automation_detected',
      'exam_started',
      'exam_submitted',
      'tab_visible',
      'window_focus',
      'fullscreen_enter',
      'copy_blocked',
      'paste_blocked',
      'right_click_blocked',
      'print_blocked',
      'keydown_blocked',
    ]);
    if (
      typeof examSessionId !== 'string' ||
      !/^[0-9a-f-]{36}$/i.test(examSessionId) ||
      !allowed.has(eventType) ||
      JSON.stringify(metadata).length > 4096
    ) {
      return NextResponse.json({ error: 'Invalid exam event' }, { status: 400 });
    }
    const access = await requireExamSessionAccess(examSessionId);
    if (access instanceof NextResponse) return access;
    const { db: supabase, user } = access;

    const { error } = await supabase.from('exam_events').insert({
      exam_session_id: examSessionId,
      user_id: user.id,
      event_type: eventType,
      metadata,
    });

    if (error) {
      logger.error(
        'Request failed',
        normalizeError(error, 'Exam event insert failed'),
        getErrorContext(error),
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error(
      'POST /api/exams/events failed',
      normalizeError(error, 'Events failed'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
