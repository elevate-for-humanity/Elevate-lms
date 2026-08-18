import { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, Globe2, MousePointerClick, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Website Traffic | Admin' };

export default async function TrafficAnalyticsPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();
  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await db
    .from('page_views')
    .select('path,session_id,referrer,utm_source,utm_medium,utm_campaign,created_at')
    .gte('created_at', start)
    .order('created_at', { ascending: false })
    .limit(10000);

  const rows = data ?? [];
  const sessions = new Set(rows.map((r) => r.session_id).filter(Boolean));
  const pageCounts = new Map<string, number>();
  const sourceCounts = new Map<string, number>();
  const referrerCounts = new Map<string, number>();
  const dailyCounts = new Map<string, number>();

  for (const row of rows) {
    pageCounts.set(row.path, (pageCounts.get(row.path) ?? 0) + 1);
    const source = row.utm_source || 'direct / unknown';
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
    if (row.referrer) referrerCounts.set(row.referrer, (referrerCounts.get(row.referrer) ?? 0) + 1);
    const day = row.created_at?.slice(0, 10) ?? 'unknown';
    dailyCounts.set(day, (dailyCounts.get(day) ?? 0) + 1);
  }

  const topPages = [...pageCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  const topSources = [...sourceCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topReferrers = [...referrerCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const daily = [...dailyCounts.entries()].sort(([a], [b]) => a.localeCompare(b));

  const cards = [
    { label: 'Page views (30d)', value: rows.length, icon: MousePointerClick },
    { label: 'Sessions (30d)', value: sessions.size, icon: Users },
    { label: 'Tracked pages', value: pageCounts.size, icon: Globe2 },
    { label: 'Traffic sources', value: sourceCounts.size, icon: BarChart3 },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/analytics" className="text-sm font-semibold text-blue-700">← Analytics</Link>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Website Traffic</h1>
            <p className="mt-1 text-slate-600">First-party page views, sessions, acquisition sources, referrers, and 30-day traffic trends.</p>
          </div>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border bg-white p-5 shadow-sm">
              <Icon className="h-5 w-5 text-slate-500" />
              <div className="mt-3 text-3xl font-black text-slate-950">{value}</div>
              <div className="mt-1 text-sm font-semibold text-slate-500">{label}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
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
        </section>
      </div>
    </main>
  );
}
