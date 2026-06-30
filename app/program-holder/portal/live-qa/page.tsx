import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ScheduleMeetingButton } from './ScheduleMeetingButton';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Video, Calendar, Users, Clock, ChevronRight, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Live Q&A | Program Holder Portal',
  robots: { index: false, follow: false },
};

export default async function LiveQAPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/program-holder/portal/live-qa');

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!['program_holder', 'admin', 'super_admin', 'instructor'].includes(profile?.role ?? ''))
    redirect('/portals');

  const now = new Date().toISOString();

  const [{ data: upcoming }, { data: past }, { count: totalSessions }] = await Promise.all([
    db
      .from('live_sessions')
      .select('id, title, scheduled_at, status, meeting_url, course_id')
      .gte('scheduled_at', now)
      .order('scheduled_at')
      .limit(5),
    db
      .from('live_sessions')
      .select('id, title, scheduled_at, status, course_id')
      .lt('scheduled_at', now)
      .order('scheduled_at', { ascending: false })
      .limit(8),
    db.from('live_sessions').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-0.5">
            Program Holder Portal
          </p>
          <h1 className="text-xl font-bold text-slate-900">Live Q&amp;A Sessions</h1>
        </div>
        <div className="flex gap-3">
          <ScheduleMeetingButton />
          <Link
            href="/admin/live-sessions/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-700"
          >
            <Plus className="w-4 h-4" /> New Session
          </Link>
          <Link
            href="/program-holder/portal"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Portal
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid sm:grid-cols-3 gap-5 mb-8">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <Video className="w-5 h-5 text-blue-500 mb-3" />
            <p className="text-2xl font-extrabold text-slate-900">{totalSessions ?? 0}</p>
            <p className="text-sm text-slate-500 mt-0.5">Total Sessions</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <Calendar className="w-5 h-5 text-brand-green-500 mb-3" />
            <p className="text-2xl font-extrabold text-slate-900">{upcoming?.length ?? 0}</p>
            <p className="text-sm text-slate-500 mt-0.5">Upcoming</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <Clock className="w-5 h-5 text-slate-400 mb-3" />
            <p className="text-2xl font-extrabold text-slate-900">{past?.length ?? 0}</p>
            <p className="text-sm text-slate-500 mt-0.5">Past Sessions</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-green-500" /> Upcoming Sessions
              </h2>
            </div>
            {!upcoming?.length ? (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">
                No upcoming sessions scheduled.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcoming.map((s: any) => (
                  <div key={s.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {s.title ?? 'Live Session'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(s.scheduled_at).toLocaleString()}
                        </p>
                      </div>
                      {s.meeting_url && (
                        <a
                          href={s.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-brand-red-600 hover:underline shrink-0 ml-4"
                        >
                          Join
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Past Sessions
              </h2>
            </div>
            {!past?.length ? (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">No past sessions.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {past.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{s.title ?? 'Session'}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(s.scheduled_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                      {s.status ?? 'completed'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
