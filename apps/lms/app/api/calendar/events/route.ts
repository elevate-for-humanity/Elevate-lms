import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function monthBounds(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'pageLoad');
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const now = new Date();
  const year = Number(params.get('year') ?? now.getUTCFullYear());
  const month = Number(params.get('month') ?? now.getUTCMonth() + 1);
  const requestedUserId = params.get('userId');

  if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid calendar month' }, { status: 400 });
  }
  if (requestedUserId && requestedUserId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { start, end } = monthBounds(year, month);
  const { data, error } = await supabase
    .from('calendar_events')
    .select('id, title, start_time, end_time, event_type, description, course_id, is_public')
    .or(`user_id.eq.${user.id},is_public.eq.true`)
    .gte('start_time', start)
    .lt('start_time', end)
    .order('start_time', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Unable to load calendar events' }, { status: 500 });
  }

  const courseIds = [...new Set((data ?? []).map((event) => event.course_id).filter(Boolean))] as string[];
  const courseTitles = new Map<string, string>();

  if (courseIds.length > 0) {
    const { data: courses } = await supabase.from('courses').select('id, title').in('id', courseIds);
    for (const course of courses ?? []) courseTitles.set(String(course.id), String(course.title));
  }

  const events = (data ?? []).map((event) => {
    const startTime = new Date(String(event.start_time));
    const rawType = String(event.event_type ?? 'event').toLowerCase();
    const type = ['assignment', 'quiz', 'deadline', 'class', 'event'].includes(rawType) ? rawType : 'event';

    return {
      id: String(event.id),
      title: String(event.title ?? 'Scheduled event'),
      date: startTime.toISOString().slice(0, 10),
      time: startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }),
      type,
      course: event.course_id ? courseTitles.get(String(event.course_id)) : undefined,
    };
  });

  return NextResponse.json({ events });
}
