import { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, Globe2, MousePointerClick, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import TrafficReports from '@/components/analytics/TrafficReports';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Website Traffic | Admin' };

export default async function TrafficAnalyticsPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();
  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await db.rpc('admin_traffic_summary', { p_start: start });
  type CountRow = { label: string; value: number };
  const pairs = (values: CountRow[] = []): [string, number][] => values.map(row => [row.label, row.value]);
  const topPages = pairs(data?.topPages);
  const topSources = pairs(data?.topSources);
  const topReferrers = pairs(data?.topReferrers);
  const daily = pairs(data?.daily);
  const cards = error ? [] : [
    { label: 'Page views (30d)', value: data?.views ?? 0, icon: MousePointerClick },
    { label: 'Sessions (30d)', value: data?.sessions ?? 0, icon: Users },
    { label: 'Tracked pages', value: data?.pages ?? 0, icon: Globe2 },
    { label: 'Traffic sources', value: data?.sources ?? 0, icon: BarChart3 },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/analytics" className="text-sm font-semibold text-blue-700">← Analytics</Link>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Website Traffic</h1>
            <p className="mt-1 text-slate-600">First-party traffic across all recorded views. Sources use campaign tags or referral domains. Daily totals use Eastern time.</p>
          </div>
        </div>

        {error && <p role="alert" className="mt-6 rounded border border-red-200 bg-red-50 p-4">Traffic data could not be loaded. Please try again.</p>}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border bg-white p-5 shadow-sm">
              <Icon className="h-5 w-5 text-slate-500" />
              <div className="mt-3 text-3xl font-black text-slate-950">{value}</div>
              <div className="mt-1 text-sm font-semibold text-slate-500">{label}</div>
            </div>
          ))}
        </section>

        {!error && <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-black text-slate-950">Top pages</h2>
            <div className="mt-4 space-y-2">
              {topPages.length ? topPages.map(([path, count]) => (
                <div key={path} className="flex items-center justify-between gap-4 text-sm">
                  <span className="truncate text-slate-700">{path}</span>
                  <span className="font-black tabular-nums text-slate-950">{count}</span>
                </div>
              )) : <p className="text-sm text-slate-500">No traffic recorded yet.</p>}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-black text-slate-950">Traffic sources</h2>
            <div className="mt-4 space-y-2">
              {topSources.length ? topSources.map(([source, count]) => (
                <div key={source} className="flex items-center justify-between gap-4 text-sm">
                  <span className="truncate text-slate-700">{source}</span>
                  <span className="font-black tabular-nums text-slate-950">{count}</span>
                </div>
              )) : <p className="text-sm text-slate-500">No acquisition data recorded yet.</p>}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-black text-slate-950">Top referrers</h2>
            <div className="mt-4 space-y-2">
              {topReferrers.length ? topReferrers.map(([referrer, count]) => (
                <div key={referrer} className="flex items-center justify-between gap-4 text-sm">
                  <span className="truncate text-slate-700">{referrer}</span>
                  <span className="font-black tabular-nums text-slate-950">{count}</span>
                </div>
              )) : <p className="text-sm text-slate-500">No referrer data recorded yet.</p>}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-black text-slate-950">Daily page views</h2>
            <div className="mt-4 space-y-2">
              {daily.length ? daily.map(([day, count]) => (
                <div key={day} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-700">{day}</span>
                  <span className="font-black tabular-nums text-slate-950">{count}</span>
                </div>
              )) : <p className="text-sm text-slate-500">No daily trend data yet.</p>}
            </div>
          </div>
        </section>}
        <div className="mt-8"><TrafficReports /></div>
      </div>
    </main>
  );
}
