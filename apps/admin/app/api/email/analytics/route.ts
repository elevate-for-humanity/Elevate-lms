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
const trackedOpenEvents = ['open', 'opened'];
const trackedClickEvents = ['click', 'clicked'];
const trackedEvents = [...trackedOpenEvents, ...trackedClickEvents];
const rate = (numerator: number, denominator: number) =>
  denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;

type EmailLogRow = {
  id: string;
  campaign_id: string | null;
  action: string | null;
  subject: string | null;
  sent_at: string;
};

type DeliveryEventRow = {
  email_log_id: string;
  event_type: string;
};

type CampaignAggregate = {
  id: string;
  name: string;
  sent: number;
  opens: number;
  clicks: number;
  sentAt: string;
};

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

  const pageSize = 500;
  const logs: EmailLogRow[] = [];
  for (let offset = 0; ; offset += pageSize) {
    let query = db
      .from('email_logs')
      .select('id,campaign_id,action,subject,sent_at')
      .in('status', ['accepted', 'sent', 'delivered'])
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false })
      .order('id')
      .range(offset, offset + pageSize - 1);
    if (days) query = query.gte('sent_at', start.toISOString());
    const { data, error } = await query;
    if (error) return safeDbError(error, 'Email analytics could not be loaded.');
    logs.push(...((data ?? []) as EmailLogRow[]));
    if ((data?.length ?? 0) < pageSize) break;
  }

  const logIds = new Set(logs.map((row) => row.id));
  const openedLogIds = new Set<string>();
  const clickedLogIds = new Set<string>();
  for (let offset = 0; ; offset += pageSize) {
    let query = db
      .from('email_delivery_events')
      .select('email_log_id,event_type')
      .in('event_type', trackedEvents)
      .order('occurred_at', { ascending: false })
      .order('id')
      .range(offset, offset + pageSize - 1);
    if (days) query = query.gte('occurred_at', start.toISOString());
    const { data, error } = await query;
    if (error) return safeDbError(error, 'Email engagement analytics could not be loaded.');
    for (const event of (data ?? []) as DeliveryEventRow[]) {
      if (!logIds.has(event.email_log_id)) continue;
      if (trackedOpenEvents.includes(event.event_type)) openedLogIds.add(event.email_log_id);
      if (trackedClickEvents.includes(event.event_type)) clickedLogIds.add(event.email_log_id);
    }
    if ((data?.length ?? 0) < pageSize) break;
  }

  const campaignMap = new Map<string, CampaignAggregate>();
  const timeline = new Map<string, { date: string; sent: number; opens: number; clicks: number }>();
  for (const row of logs) {
    const opened = openedLogIds.has(row.id);
    const clicked = clickedLogIds.has(row.id);
    const key = row.campaign_id || row.subject || row.action || row.id;
    const campaign = campaignMap.get(key) ?? {
      id: row.campaign_id || row.id,
      name: row.subject || row.action || 'Direct email',
      sent: 0,
      opens: 0,
      clicks: 0,
      sentAt: row.sent_at,
    };
    campaign.sent += 1;
    if (opened) campaign.opens += 1;
    if (clicked) campaign.clicks += 1;
    if (row.sent_at > campaign.sentAt) campaign.sentAt = row.sent_at;
    campaignMap.set(key, campaign);

    const date = row.sent_at.slice(0, 10);
    const day = timeline.get(date) ?? { date, sent: 0, opens: 0, clicks: 0 };
    day.sent += 1;
    if (opened) day.opens += 1;
    if (clicked) day.clicks += 1;
    timeline.set(date, day);
  }

  const campaigns = [...campaignMap.values()]
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
    .map((campaign) => ({
      ...campaign,
      openRate: rate(campaign.opens, campaign.sent),
      clickRate: rate(campaign.clicks, campaign.sent),
    }));
  const overview = {
    totalSent: logs.length,
    totalOpens: openedLogIds.size,
    totalClicks: clickedLogIds.size,
    totalBounces: null,
    openRate: rate(openedLogIds.size, logs.length),
    clickRate: rate(clickedLogIds.size, logs.length),
    bounceRate: null,
  };

  return NextResponse.json({
    success: true,
    data: {
      overview,
      campaigns,
      timeline: [...timeline.values()].sort((a, b) => a.date.localeCompare(b.date)),
      topPerformers: campaigns
        .filter((campaign) => campaign.sent > 0)
        .sort((a, b) => b.openRate - a.openRate || b.clickRate - a.clickRate)
        .slice(0, 5)
        .map((campaign) => ({
          campaign: campaign.name,
          metric: 'Open Rate',
          value: campaign.openRate,
        })),
    },
  });
}
