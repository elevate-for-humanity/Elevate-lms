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
  const startDate = start.slice(0, 10);
  const endDate = end.slice(0, 10);
  const { data, error } = await supabase
    .from('calendar_events')
    .select('id, title, date, time, event_type, description')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lt('date', endDate)
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Unable to load calendar events' }, { status: 500 });
  }

  const events = (data ?? []).map((event) => {
    const date = String(event.date);
    const time = event.time ? String(event.time).slice(0, 5) : '00:00';
    const startTime = new Date(`${date}T${time}:00Z`);
    const rawType = String(event.event_type ?? 'event').toLowerCase();
    const type = ['assignment', 'quiz', 'deadline', 'class', 'event'].includes(rawType) ? rawType : 'event';

    return {
      id: String(event.id),
      title: String(event.title ?? 'Scheduled event'),
      date: startTime.toISOString().slice(0, 10),
      time: startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }),
      type,
      course: undefined,
    };
  });

  return NextResponse.json({ events });
}
