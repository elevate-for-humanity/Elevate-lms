import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { validateTheoryAvailability } from '@/lib/apprenticeship/theory-scheduling';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
async function context() {
  const user = await getCurrentUser();
  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, user?.id);
  if (!subject.userId) return null;
  const result = await db
    .from('apprenticeship_theory_schedules')
    .select(
      'id,course_id,user_id,days_of_week,start_time,end_time,timezone,starts_on,weekly_target_minutes,weekly_max_minutes,learner_confirmed_at',
    )
    .eq('user_id', subject.userId)
    .eq('active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (result.error) throw new Error('Unable to load your theory schedule.');
  return { db, subject, schedule: result.data };
}
export async function GET() {
  try {
    const ctx = await context();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    if (!ctx.schedule)
      return NextResponse.json(
        { error: 'An active theory schedule must be assigned.' },
        { status: 404, headers },
      );
    const access = await ctx.db.rpc('get_apprentice_theory_window', {
      p_user: ctx.subject.userId,
      p_course: ctx.schedule.course_id,
    });
    if (access.error) throw access.error;
    return NextResponse.json(
      { schedule: ctx.schedule, access: access.data, readOnly: ctx.subject.previewing },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { error: 'Theory schedule is temporarily unavailable.' },
      { status: 503, headers },
    );
  }
}
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  try {
    const ctx = await context();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    if (ctx.subject.previewing)
      return NextResponse.json(
        { error: 'Administrative preview is read-only.' },
        { status: 403, headers },
      );
    if (!ctx.schedule)
      return NextResponse.json(
        { error: 'An active theory schedule must be assigned.' },
        { status: 404, headers },
      );
    const body = await request.json();
    let value;
    try {
      value = validateTheoryAvailability(
        body,
        ctx.schedule.weekly_target_minutes,
        ctx.schedule.weekly_max_minutes,
      );
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid schedule.' },
        { status: 400, headers },
      );
    }
    const result = await ctx.db
      .from('apprenticeship_theory_schedules')
      .update({
        days_of_week: value.days,
        start_time: value.startTime,
        end_time: value.endTime,
        learner_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', ctx.schedule.id)
      .eq('user_id', ctx.subject.userId)
      .eq('active', true)
      .select('id')
      .single();
    if (result.error) throw result.error;
    return NextResponse.json({ saved: true }, { headers });
  } catch {
    return NextResponse.json(
      { error: 'Your schedule could not be saved.' },
      { status: 503, headers },
    );
  }
}
