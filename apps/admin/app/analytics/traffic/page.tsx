import { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, Globe2, MousePointerClick, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import TrafficReports from '@/components/analytics/TrafficReports';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Website Traffic | Admin' };

export default async function TrafficAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();
  const params = await searchParams;
  const days = ['7', '30', '90'].includes(params.days ?? '') ? Number(params.days) : 30;
  const end = new Date().toISOString();
  const start = new Date(Date.now() - days * 86400000).toISOString();

  const [{ data, error }, automation, localTraffic] = await Promise.all([
    db.rpc('admin_traffic_summary', { p_start: start }),
    db
      .from('page_views')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', start)
      .lte('created_at', end)
      .or(
        'user_agent.ilike.%bot%,user_agent.ilike.%crawler%,user_agent.ilike.%spider%,user_agent.ilike.%headless%,user_agent.ilike.%playwright%,user_agent.ilike.%curl%,user_agent.ilike.%python%,user_agent.ilike.%wget%,user_agent.ilike.%meta-externalagent%,user_agent.ilike.%facebookexternalhit%,user_agent.ilike.%bingpreview%',
      ),
    db
      .from('page_views')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', start)
      .lte('created_at', end)
      .or(
        'referrer.ilike.http://localhost%,referrer.ilike.https://localhost%,referrer.ilike.http://127.0.0.1%,referrer.ilike.https://127.0.0.1%',
      ),
  ]);
  const localCount = localTraffic.error ? null : localTraffic.count;
  const automationCount = automation.error ? null : automation.count;
  type CountRow = { label: string; value: number };
  const pairs = (values: CountRow[] = []): [string, number][] =>
    values.map((row) => [row.label, row.value]);
  const topPages = pairs(data?.topPages);
  const topSources = pairs(data?.topSources);
  const topReferrers = pairs(data?.topReferrers);
  const daily = pairs(data?.daily);
  const cards = error
    ? []
    : [
        { label: `Raw page views (${days}d)`, value: data?.views ?? 0, icon: MousePointerClick },
        { label: `Recorded session IDs (${days}d)`, value: data?.sessions ?? 0, icon: Users },
        { label: 'Tracked pages', value: data?.pages ?? 0, icon: Globe2 },
        { label: 'Traffic sources', value: data?.sources ?? 0, icon: BarChart3 },
      ];

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/analytics" className="text-sm font-semibold text-blue-700">
              ← Analytics
            </Link>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Website Traffic</h1>
            <p className="mt-1 text-slate-600">
              First-party website records, including repeat views and automation. Session IDs are
              browser identifiers, not verified people. Daily totals use Eastern time.
            </p>
          </div>
        </div>

        <nav aria-label="Traffic date range" className="mt-5 flex flex-wrap gap-3">
          {[7, 30, 90].map((period) => (
            <Link
              key={period}
              href={`/analytics/traffic?days=${period}`}
              aria-current={period === days ? 'page' : undefined}
              className={`rounded-lg border px-4 py-2 font-semibold ${period === days ? 'bg-blue-800 text-white' : 'bg-white text-slate-900'}`}
            >
              Last {period} days
            </Link>
          ))}
        </nav>
        <p className="mt-3 text-sm text-slate-700">
          Rolling period:{' '}
          {new Date(start).toLocaleDateString('en-US', { timeZone: 'America/New_York' })} through{' '}
          {new Date(end).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}. Includes
          today.
        </p>
        <section className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-5 text-slate-900">
          <h2 className="font-bold">Traffic quality</h2>
          <p className="mt-2">
            Recognized bot / automation views:{' '}
            <strong>
              {automationCount === null ? 'Unavailable' : automationCount.toLocaleString()}
            </strong>
            . These are included in the raw totals below.
          </p>
          <p className="mt-2">
            Views referred from local development:{' '}
            <strong>{localCount === null ? 'Unavailable' : localCount.toLocaleString()}</strong>.
            These can overlap with automation and are also included in raw totals.
          </p>
          <p className="mt-2 text-sm">
            Detection uses the recorded browser identifier. Other automation may look like an
            ordinary browser, so remaining views cannot be called confirmed human visits. Historical
            records do not identify the website hostname; these totals may combine multiple Elevate
            portals.
          </p>
          <p className="mt-2 text-sm">
            Source and referrer breakdowns count page views, not unique visitors or conversions.
            Google Analytics reports appear separately below and use their own reporting period.
          </p>
        </section>
        {error && (
          <p role="alert" className="mt-6 rounded border border-red-200 bg-red-50 p-4">
            Traffic data could not be loaded. Please try again.
          </p>
        )}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border bg-white p-5 shadow-sm">
              <Icon className="h-5 w-5 text-slate-500" />
              <div className="mt-3 text-3xl font-black text-slate-950">
                {value.toLocaleString()}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-500">{label}</div>
            </div>
          ))}
        </section>

        {!error && (
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="font-black text-slate-950">Top pages</h2>
              <div className="mt-4 space-y-2">
                {topPages.length ? (
                  topPages.map(([path, count]) => (
                    <div key={path} className="flex items-center justify-between gap-4 text-sm">
                      <span className="truncate text-slate-700">{path}</span>
                      <span className="font-black tabular-nums text-slate-950">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No traffic recorded yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="font-black text-slate-950">Traffic sources · page views</h2>
              <div className="mt-4 space-y-2">
                {topSources.length ? (
                  topSources.map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between gap-4 text-sm">
                      <span className="truncate text-slate-700">{source}</span>
                      <span className="font-black tabular-nums text-slate-950">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No acquisition data recorded yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="font-black text-slate-950">Top referrers · page views</h2>
              <div className="mt-4 space-y-2">
                {topReferrers.length ? (
                  topReferrers.map(([referrer, count]) => (
                    <div key={referrer} className="flex items-center justify-between gap-4 text-sm">
                      <span className="truncate text-slate-700">{referrer}</span>
                      <span className="font-black tabular-nums text-slate-950">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No referrer data recorded yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="font-black text-slate-950">Daily page views</h2>
              <div className="mt-4 space-y-2">
                {daily.length ? (
                  daily.map(([day, count]) => (
                    <div key={day} className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-slate-700">{day}</span>
                      <span className="font-black tabular-nums text-slate-950">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No daily trend data yet.</p>
                )}
              </div>
            </div>
          </section>
        )}
        <div className="mt-8">
          <TrafficReports />
        </div>
      </div>
    </main>
  );
}
