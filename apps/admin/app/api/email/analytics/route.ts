import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const daysByRange = new Map([
  ['7d', 7],
  ['30d', 30],
  ['90d', 90],
]);
const rate = (numerator: number, denominator: number) =>
  denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const range = request.nextUrl.searchParams.get('range') ?? '30d';
  const days = daysByRange.get(range);
  if (!days && range !== 'all') {
    return NextResponse.json({ error: 'Invalid analytics date range.' }, { status: 400 });
  }

  const db = await requireAdminClient();
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  if (days) start.setUTCDate(start.getUTCDate() - days + 1);

  const campaigns = [];
  const timeline = new Map<string, { date: string; sent: number; opens: number; clicks: number }>();
  const overview = {
    totalSent: 0,
    totalOpens: 0,
    totalClicks: 0,
    totalBounces: null,
    openRate: 0,
    clickRate: 0,
    bounceRate: null,
  };

  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    let query = db
      .from('email_campaigns')
      .select('id,name,sent_count,open_count,click_count,sent_at')
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false })
      .order('id')
      .range(offset, offset + pageSize - 1);
    if (days) query = query.gte('sent_at', start.toISOString());
    const { data, error } = await query;
    if (error) return safeDbError(error, 'Email analytics could not be loaded.');
    for (const row of data ?? []) {
      const sent = Number(row.sent_count ?? 0);
      const opens = Number(row.open_count ?? 0);
      const clicks = Number(row.click_count ?? 0);
      campaigns.push({
        id: row.id,
        name: row.name,
        sent,
        opens,
        clicks,
        openRate: rate(opens, sent),
        clickRate: rate(clicks, sent),
        sentAt: row.sent_at,
      });
      overview.totalSent += sent;
      overview.totalOpens += opens;
      overview.totalClicks += clicks;
      const date = row.sent_at.slice(0, 10);
      const day = timeline.get(date) ?? { date, sent: 0, opens: 0, clicks: 0 };
      day.sent += sent;
      day.opens += opens;
      day.clicks += clicks;
      timeline.set(date, day);
    }
    if ((data?.length ?? 0) < pageSize) break;
  }

  overview.openRate = rate(overview.totalOpens, overview.totalSent);
  overview.clickRate = rate(overview.totalClicks, overview.totalSent);
  return NextResponse.json({
    success: true,
    data: { overview, campaigns, timeline: [...timeline.values()].reverse() },
  });
}
