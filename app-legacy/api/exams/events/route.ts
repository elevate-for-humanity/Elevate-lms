import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  try {
    const supabase = await createClient();
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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase.from('exam_events').insert({
      exam_session_id: examSessionId,
      user_id: user.id,
      event_type: eventType,
      metadata,
    });

    if (error) {
      logger.error('Request failed', error instanceof Error ? error : undefined);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error('POST /api/exams/events failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
