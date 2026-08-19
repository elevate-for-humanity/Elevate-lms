import Link from 'next/link';
import { Calendar, Clock } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Schedule | Host Shop Portal',
  description: 'View training sessions hosted by the signed-in host-shop user.',
  robots: { index: false, follow: false },
};

export default async function HostShopSchedulePage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const supabase = await createClient();

  const { data: sessions, error } = await supabase
    .from('attendance_sessions')
    .select('id, title, scheduled_at, status')
    .eq('host_id', user.id)
    .order('scheduled_at', { ascending: true })
    .limit(50);

  const rows = sessions ?? [];
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
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">Host Shop</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Training Schedule</h1>
          <p className="mt-2 text-slate-600">Only attendance sessions hosted by this signed-in account are shown.</p>
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
