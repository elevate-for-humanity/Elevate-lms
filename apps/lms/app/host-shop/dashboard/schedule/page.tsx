import Link from 'next/link';
import { Calendar, Clock, BookOpen, BellRing } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';
import { APPRENTICESHIP_PROGRAM_SYLLABI } from '@/lib/apprenticeship-programs/program-syllabus';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Schedule | Host Shop Portal',
  description: 'View training sessions hosted by the signed-in host-shop user.',
  robots: { index: false, follow: false },
};

const DAY_LABELS: Record<number, string> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' };

function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(2020, 0, 1, hours, minutes));
}

async function updateTheorySchedule(formData: FormData) {
  'use server';
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const scheduleId = String(formData.get('scheduleId') || '');
  const startTime = String(formData.get('startTime') || '');
  const endTime = String(formData.get('endTime') || '');
  const targetMinutes = Math.round(Number(formData.get('weeklyTargetHours')) * 60);
  const maxMinutes = Math.round(Number(formData.get('weeklyMaxHours')) * 60);
  const days = formData.getAll('days').map(Number).filter((day) => Number.isInteger(day) && day >= 1 && day <= 7);
  if (!scheduleId || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime) || endTime <= startTime || !days.length || targetMinutes < 30 || maxMinutes < targetMinutes || maxMinutes > 2400) {
    throw new Error('INVALID_THEORY_SCHEDULE');
  }
  const db = await requireAdminClient();
  const { data: owned } = await (db as any).from('apprenticeship_theory_schedules').select('id,partner_id').eq('id', scheduleId).eq('partner_id', board.partner.id).maybeSingle();
  if (!owned) throw new Error('THEORY_SCHEDULE_ACCESS_DENIED');
  const { error } = await (db as any).from('apprenticeship_theory_schedules').update({
    days_of_week: days,
    start_time: startTime,
    end_time: endTime,
    weekly_target_minutes: targetMinutes,
    weekly_max_minutes: maxMinutes,
    updated_at: new Date().toISOString(),
  }).eq('id', scheduleId).eq('partner_id', board.partner.id);
  if (error) throw new Error(`THEORY_SCHEDULE_UPDATE_FAILED:${error.message}`);
}

export default async function HostShopSchedulePage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const db = await requireAdminClient();
  const shopIds = board.shops.map((shop) => shop.id).filter(Boolean);
  const [{ data: partnerUsers }, { data: shopStaff }] = await Promise.all([
    db.from('partner_users').select('user_id').eq('partner_id', board.partner.id).eq('status', 'active'),
    shopIds.length
      ? db.from('shop_staff').select('user_id').in('shop_id', shopIds).eq('active', true)
      : Promise.resolve({ data: [] }),
  ]);
  const hostUserIds = Array.from(new Set([
    ...(partnerUsers || []).map((row: any) => row.user_id),
    ...(shopStaff || []).map((row: any) => row.user_id),
  ].filter(Boolean)));

  const { data: sessions, error } = hostUserIds.length
    ? await db.from('attendance_sessions')
        .select('id, title, scheduled_at, status')
        .in('host_id', hostUserIds)
        .order('scheduled_at', { ascending: true })
        .limit(50)
    : { data: [], error: null };

  const rows = sessions ?? [];
  const apprenticeIds = board.apprentices.map((apprentice) => apprentice.student_id).filter(Boolean);
  const { data: theorySchedules, error: theoryError } = apprenticeIds.length
    ? await (db as any).from('apprenticeship_theory_schedules')
        .select('id,user_id,program_slug,course_id,timezone,days_of_week,start_time,end_time,weekly_target_minutes,weekly_max_minutes,active')
        .eq('partner_id', board.partner.id).in('user_id', apprenticeIds).eq('active', true)
    : { data: [], error: null };
  const courseIds = Array.from(new Set((theorySchedules || []).map((item: any) => item.course_id).filter(Boolean))) as string[];
  const [{ data: courses }, { data: courseLessons }, { data: lessonProgress }] = await Promise.all([
    courseIds.length ? db.from('courses').select('id,title,status').in('id', courseIds) : Promise.resolve({ data: [] }),
    courseIds.length ? db.from('course_lessons').select('id,course_id,title,order_index,is_published').in('course_id', courseIds).order('order_index') : Promise.resolve({ data: [] }),
    courseIds.length && apprenticeIds.length ? db.from('lesson_progress').select('user_id,course_id,lesson_id,completed').in('course_id', courseIds).in('user_id', apprenticeIds).eq('completed', true) : Promise.resolve({ data: [] }),
  ]);
  const apprenticeById = new Map(board.apprentices.map((apprentice) => [apprentice.student_id, apprentice]));
  const courseById = new Map((courses || []).map((course: any) => [course.id, course]));
  const completedKeys = new Set((lessonProgress || []).map((item: any) => `${item.user_id}:${item.lesson_id}`));
  const now = Date.now();
  const upcoming = rows.filter((session) => {
    const timestamp = session.scheduled_at ? new Date(session.scheduled_at).getTime() : 0;
    return timestamp >= now && session.status !== 'cancelled';
  });
  const past = rows
    .filter((session) => {
      const timestamp = session.scheduled_at ? new Date(session.scheduled_at).getTime() : 0;
      return timestamp < now || session.status === 'completed';
    })
    .reverse()
    .slice(0, 10);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">{board.partner?.name || 'Host Shop'}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Training Schedule</h1>
          <p className="mt-2 text-slate-600">Only attendance sessions hosted by active users assigned to this Host Shop are shown.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/host-shop/dashboard/attendance/record" className="rounded-xl bg-brand-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-800">
            Record attendance
          </Link>
          <Link href="/host-shop/dashboard" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">
            Back to dashboard
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          Schedule data could not be loaded. No sample events are being substituted.
        </div>
      ) : null}

      <section className="mt-6 rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-5 sm:p-6">
        <div className="flex gap-3"><BookOpen className="mt-0.5 h-6 w-6 shrink-0 text-fuchsia-800"/><div><h2 className="text-xl font-black text-slate-950">Syllabus and apprentice theory pacing</h2><p className="mt-1 text-sm font-semibold leading-6 text-slate-700">The Host Shop and apprentice see the same course sequence, weekly target, maximum, and reminder window. Theory time remains separate from shop OJL.</p></div></div>
        {theoryError ? <p className="mt-4 rounded-xl border border-red-200 bg-white p-4 font-bold text-red-900">Theory schedules could not be loaded.</p> : null}
        <div className="mt-5 grid gap-4">
          {(theorySchedules || []).map((schedule: any) => {
            const apprentice = apprenticeById.get(schedule.user_id);
            const syllabus = APPRENTICESHIP_PROGRAM_SYLLABI[schedule.program_slug as keyof typeof APPRENTICESHIP_PROGRAM_SYLLABI];
            const lessons = (courseLessons || []).filter((lesson: any) => lesson.course_id === schedule.course_id && lesson.is_published !== false);
            const completed = lessons.filter((lesson: any) => completedKeys.has(`${schedule.user_id}:${lesson.id}`)).length;
            const nextLesson = lessons.find((lesson: any) => !completedKeys.has(`${schedule.user_id}:${lesson.id}`));
            const course = courseById.get(schedule.course_id) as any;
            return <article key={schedule.id} className="rounded-2xl border border-fuchsia-200 bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="text-lg font-black text-slate-950">{apprentice?.name || 'Apprentice'}</h3><p className="mt-1 text-sm font-semibold text-slate-700">{course?.title || syllabus?.rtiLabel || 'Assigned theory course'} · {completed}/{lessons.length} lessons complete</p><p className="mt-1 text-sm text-slate-600">Next: {nextLesson?.title || (lessons.length ? 'Course complete' : 'Course publication pending')}</p></div>{syllabus?.syllabusPath ? <a href={syllabus.syllabusPath} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-fuchsia-300 px-4 py-2 text-sm font-black text-fuchsia-950">Open full syllabus</a> : null}</div>
              <form action={updateTheorySchedule} className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-end"><input type="hidden" name="scheduleId" value={schedule.id}/><fieldset><legend className="text-xs font-black uppercase tracking-wide text-slate-600">Theory days</legend><div className="mt-2 flex flex-wrap gap-2">{Object.entries(DAY_LABELS).map(([value,label]) => <label key={value} className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-bold"><input type="checkbox" name="days" value={value} defaultChecked={schedule.days_of_week.includes(Number(value))}/>{label}</label>)}</div></fieldset><label className="text-xs font-black uppercase tracking-wide text-slate-600">Start<input name="startTime" type="time" required defaultValue={String(schedule.start_time).slice(0,5)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base font-semibold text-slate-950"/></label><label className="text-xs font-black uppercase tracking-wide text-slate-600">Stop<input name="endTime" type="time" required defaultValue={String(schedule.end_time).slice(0,5)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base font-semibold text-slate-950"/></label><button className="min-h-11 rounded-xl bg-fuchsia-800 px-4 py-2 font-black text-white">Save schedule</button><label className="text-xs font-black uppercase tracking-wide text-slate-600">Weekly target hours<input name="weeklyTargetHours" type="number" min="0.5" max="40" step="0.25" required defaultValue={schedule.weekly_target_minutes / 60} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base font-semibold text-slate-950"/></label><label className="text-xs font-black uppercase tracking-wide text-slate-600">Weekly maximum hours<input name="weeklyMaxHours" type="number" min="0.5" max="40" step="0.25" required defaultValue={schedule.weekly_max_minutes / 60} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base font-semibold text-slate-950"/></label><p className="self-center text-sm font-semibold text-slate-600 lg:col-span-2"><BellRing className="mr-1 inline h-4 w-4"/>Automatic start and stop alerts use {schedule.timezone}. Current block: {formatTime(schedule.start_time)}–{formatTime(schedule.end_time)}.</p></form>
            </article>;
          })}
          {!theorySchedules?.length ? <div className="rounded-xl border border-amber-200 bg-white p-5 font-semibold text-amber-950">No active apprentice theory schedule exists yet. A schedule is created automatically when an active placement is recorded.</div> : null}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6"><h2 className="font-black text-slate-950">Upcoming sessions</h2></div>
        {upcoming.length === 0 ? (
          <div className="px-6 py-12 text-center"><Calendar className="mx-auto h-10 w-10 text-slate-300" /><h3 className="mt-3 font-bold text-slate-900">No upcoming sessions</h3><p className="mt-1 text-sm text-slate-500">New hosted attendance sessions will appear here automatically.</p></div>
        ) : (
          <div className="divide-y divide-slate-200">
            {upcoming.map((session) => (
              <div key={session.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div><p className="font-black text-slate-950">{session.title || 'Training session'}</p><p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><Clock className="h-4 w-4" />{session.scheduled_at ? new Date(session.scheduled_at).toLocaleString() : 'Time not set'}</p></div>
                <span className="text-sm font-bold capitalize text-slate-700">{session.status || 'scheduled'}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6"><h2 className="font-black text-slate-950">Recent sessions</h2></div>
        {past.length === 0 ? <p className="px-6 py-8 text-sm text-slate-500">No completed or past sessions are recorded for this account.</p> : (
          <div className="divide-y divide-slate-200">
            {past.map((session) => (
              <div key={session.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="font-semibold text-slate-900">{session.title || 'Training session'}</p><p className="text-sm text-slate-500">{session.scheduled_at ? new Date(session.scheduled_at).toLocaleString() : 'Time not set'} · {session.status || 'recorded'}</p></div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
