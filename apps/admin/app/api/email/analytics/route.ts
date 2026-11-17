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
  status: string | null;
  provider: string | null;
  message_id: string | null;
  sent_at: string;
};

type DeliveryEventRow = {
  email_log_id: string;
  event_type: string;
};

type CanonicalDelivery = {
  key: string;
  row: EmailLogRow;
  logIds: Set<string>;
};

type CampaignAggregate = {
  id: string;
  name: string;
  sent: number;
  opens: number;
  clicks: number;
  sentAt: string;
};

function deliveryKey(row: EmailLogRow): string | null {
  if (row.status === 'failed') return null;

  const messageId = row.message_id?.trim();
  if (messageId) return `message:${row.provider || 'unknown'}:${messageId}`;

  // Transport rows are canonical even when a provider did not return an ID.
  // Preserve older Gmail/Resend records and legacy rows without an action, but
  // exclude companion feature-audit rows that describe the same delivery.
  if (
    row.action === 'email_transport_send' ||
    row.provider === 'gmail' ||
    row.provider === 'resend' ||
    !row.action
  ) {
    return `log:${row.id}`;
  }
  return null;
}

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
  const rawLogs: EmailLogRow[] = [];
  for (let offset = 0; ; offset += pageSize) {
    let query = db
      .from('email_logs')
      .select('id,campaign_id,action,subject,status,provider,message_id,sent_at')
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false })
      .order('id')
      .range(offset, offset + pageSize - 1);
    if (days) query = query.gte('sent_at', start.toISOString());
    const { data, error } = await query;
    if (error) return safeDbError(error, 'Email analytics could not be loaded.');
    rawLogs.push(...((data ?? []) as EmailLogRow[]));
    if ((data?.length ?? 0) < pageSize) break;
  }

  const deliveryByKey = new Map<string, CanonicalDelivery>();
  const deliveryKeyByLogId = new Map<string, string>();
  for (const row of rawLogs) {
    const key = deliveryKey(row);
    if (!key) continue;
    const delivery = deliveryByKey.get(key);
    if (delivery) {
      delivery.logIds.add(row.id);
      deliveryKeyByLogId.set(row.id, key);
      if (row.action === 'email_transport_send' && delivery.row.action !== 'email_transport_send') {
        delivery.row = row;
      }
    } else {
      deliveryByKey.set(key, { key, row, logIds: new Set([row.id]) });
      deliveryKeyByLogId.set(row.id, key);
    }
  }

  const openedDeliveryKeys = new Set<string>();
  const clickedDeliveryKeys = new Set<string>();
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
      const key = deliveryKeyByLogId.get(event.email_log_id);
      if (!key) continue;
      if (trackedOpenEvents.includes(event.event_type)) openedDeliveryKeys.add(key);
      if (trackedClickEvents.includes(event.event_type)) clickedDeliveryKeys.add(key);
    }
    if ((data?.length ?? 0) < pageSize) break;
  }

  const deliveries = [...deliveryByKey.values()];
  const campaignMap = new Map<string, CampaignAggregate>();
  const timeline = new Map<string, { date: string; sent: number; opens: number; clicks: number }>();
  for (const delivery of deliveries) {
    const row = delivery.row;
    const opened = openedDeliveryKeys.has(delivery.key);
    const clicked = clickedDeliveryKeys.has(delivery.key);
    const key = row.campaign_id || row.subject || row.action || delivery.key;
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
  const totalSent = deliveries.length;
  const overview = {
    totalSent,
    totalOpens: openedDeliveryKeys.size,
    totalClicks: clickedDeliveryKeys.size,
    totalBounces: null,
    openRate: rate(openedDeliveryKeys.size, totalSent),
    clickRate: rate(clickedDeliveryKeys.size, totalSent),
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
