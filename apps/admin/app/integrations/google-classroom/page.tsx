import type { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  alternates: { canonical: 'https://admin.elevateforhumanity.org/integrations/google-classroom' },
  title: 'Google Classroom | Integrations | Elevate For Humanity',
  description: 'Inspect the verified Google Classroom connection and synchronization state.',
};

export default async function GoogleClassroomPage() {
  await requireRole(['admin']);
  const db = await createClient();
  const [{ data: integration }, { data: syncRows, error: syncError }] = await Promise.all([
    db
      .from('integrations')
      .select('id,slug,status,is_active,note,updated_at')
      .eq('slug', 'google-classroom')
      .maybeSingle(),
    db
      .from('google_classroom_sync')
      .select('id,course_id,status,last_sync_at,updated_at')
      .order('updated_at', { ascending: false })
      .limit(50),
  ]);
  const rows = syncError ? [] : (syncRows ?? []);
  const authorized = integration?.status === 'authorized' || integration?.status === 'active';
  const connected = integration?.is_active === true && integration?.status === 'active';
  const synchronized = rows.filter((row) => row.status === 'active' || row.status === 'synced');
  const lastSync = rows.find((row) => row.last_sync_at)?.last_sync_at ?? null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
          Learning integrations
        </p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-950">Google Classroom</h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              Verified connection health for roster, course, assignment, and grade synchronization.
              Environment variables alone never mark this integration active.
            </p>
          </div>
          <span
            className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}
          >
            {connected ? 'Connected' : 'Setup required'}
          </span>
        </div>
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Metric label="Mapped courses" value={rows.filter((row) => row.course_id).length} />
          <Metric label="Healthy syncs" value={synchronized.length} />
          <Metric
            label="Last successful sync"
            value={lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
          />
        </section>
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Production readiness</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Readiness label="OAuth connection authorized" ready={authorized} />
            <Readiness
              label="At least one mapped course"
              ready={rows.some((row) => row.course_id)}
            />
            <Readiness label="Successful synchronization recorded" ready={Boolean(lastSync)} />
            <Readiness label="Roster synchronization verified" ready={false} />
            <Readiness label="Grade return verified" ready={false} />
          </div>
          {!authorized ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              Google Classroom is not being represented as live. Complete provider authorization and
              a successful bounded synchronization before enabling it for partner schools.
            </div>
          ) : null}
          {integration?.note ? (
            <p className="mt-4 text-sm text-slate-600">{integration.note}</p>
          ) : null}
        </section>
        <div className="mt-8 flex flex-wrap gap-3">
          {!authorized ? (
            <Link
              href="/api/admin/integrations/google-classroom/authorize"
              className="rounded-lg bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
            >
              Connect Google Classroom
            </Link>
          ) : (
            <form action="/api/admin/integrations/google-classroom/sync" method="post">
              <button
                type="submit"
                className="rounded-lg bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800"
              >
                Synchronize now
              </button>
            </form>
          )}
          <Link
            href="/partners/lms-integrations"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 hover:bg-slate-100"
          >
            Partner LMS connections
          </Link>
          <Link
            href="/integrations"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 hover:bg-slate-100"
          >
            All integrations
          </Link>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}
function Readiness({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <span className="font-semibold text-slate-800">{label}</span>
      <span className={`text-sm font-black ${ready ? 'text-emerald-700' : 'text-amber-700'}`}>
        {ready ? 'Verified' : 'Pending'}
      </span>
    </div>
  );
}
