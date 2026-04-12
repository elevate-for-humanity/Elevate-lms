import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { createZoomMeeting } from '@/lib/integrations/zoom';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is instructor or admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['instructor', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const {
    courseId,
    topic,
    start,
    provider = 'zoom',
    durationMinutes = 60,
  } = await req.json();

  if (!courseId || !topic || !start) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  try {
    let joinUrl = '';

    if (provider === 'zoom') {
      const zoom = await createZoomMeeting({
        topic,
        startTime: start,
        duration: durationMinutes,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          auto_recording: 'cloud',
        },
      });
      joinUrl = zoom.join_url;
    } else if (provider === 'teams') {
      // Teams meeting creation requires Graph API — not yet configured
      return NextResponse.json({ error: 'Teams meeting creation not yet configured' }, { status: 500 });
    }

    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert({
        course_id: courseId,
        provider,
        topic,
        join_url: joinUrl,
        start_time: start,
        duration_minutes: durationMinutes,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, meeting });
  } catch (error) { 
    logger.error(
      'Meeting creation error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to create meeting' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/meetings/create', _POST);
