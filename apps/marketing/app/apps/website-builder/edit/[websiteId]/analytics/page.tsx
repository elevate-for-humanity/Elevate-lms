import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Website Analytics | Elevate Website Builder',
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ websiteId: string }> };

export default async function WebsiteAnalyticsPage({ params }: Props) {
  const { websiteId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/apps/website-builder/edit/${websiteId}/analytics`);

  const access = await getWebsiteBuilderAccess(user.id, supabase);
  if (!access.allowed) redirect(access.upgradeUrl || `/store/apps/website-builder?reason=${encodeURIComponent(access.reason || 'inactive')}`);

  const { data: site } = await supabase
    .from('user_websites')
    .select('id, user_id, site_name')
    .eq('id', websiteId)
    .maybeSingle();
  if (!site || site.user_id !== user.id) notFound();

  const db = await requireAdminClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: events } = await db
    .from('tenant_site_events')
    .select('event_name, path, session_key, created_at')
    .eq('website_id', websiteId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000);

  const rows = events || [];
  const pageViews = rows.filter((row) => row.event_name === 'page_view');
  const uniqueSessions = new Set(pageViews.map((row) => row.session_key).filter(Boolean)).size;
  const leadEvents = rows.filter((row) => row.event_name === 'lead_submitted').length;
  const ctaClicks = rows.filter((row) => ['cta_click', 'booking_click', 'product_click'].includes(row.event_name)).length;
  const pageCounts = new Map<string, number>();
  for (const row of pageViews) {
    const path = row.path || '/';
    pageCounts.set(path, (pageCounts.get(path) || 0) + 1);
  }
  const topPages = [...pageCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-brand-red-700">Website Builder</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Analytics · {site.site_name || 'Website'}</h1>
            <p className="mt-2 text-slate-600">Last 30 days of first-party activity from the published tenant website.</p>
          </div>
          <Link href={`/apps/website-builder/edit/${websiteId}`} className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-800">Back to editor</Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Page views', pageViews.length],
            ['Unique sessions', uniqueSessions],
            ['Lead submissions', leadEvents],
            ['Tracked clicks', ctaClicks],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
            </div>
          ))}
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Top pages</h2>
          {!topPages.length ? (
            <p className="mt-4 text-sm text-slate-500">No page-view data yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {topPages.map(([path, count]) => (
                <div key={path} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="font-semibold text-slate-700">{path}</span>
                  <span className="font-black text-slate-950">{count}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
