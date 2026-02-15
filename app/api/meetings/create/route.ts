import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';

// Zoom integration helper
async function createZoomMeeting(topic: string, start: string) {
  const ZOOM_API_KEY = process.env.ZOOM_API_KEY;
  const ZOOM_API_SECRET = process.env.ZOOM_API_SECRET;

  if (!ZOOM_API_KEY || !ZOOM_API_SECRET) {
    throw new Error('Zoom credentials not configured');
  }

  const token = Buffer.from(`${ZOOM_API_KEY}:${ZOOM_API_SECRET}`).toString(
    'base64'
  );

  const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic,
      type: 2,
      start_time: start,
      timezone: 'America/New_York',
      duration: 60,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
      },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Zoom API error: ${error}`);
  }

  return res.json();
}

export async function POST(req: Request) {
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
      const zoom = await createZoomMeeting(topic, start);
      joinUrl = zoom.join_url;
    } else if (provider === 'teams') {
      // Teams integration would go here
      // For now, use a Content
      joinUrl = 'https://teams.microsoft.com/l/meetup-join/Content';
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
  } catch (error) { /* Error handled silently */ 
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
