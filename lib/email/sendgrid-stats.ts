/**
 * Fetches real email delivery stats from SendGrid Stats API.
 * Used by admin email marketing pages — server-side only.
 */

export interface SendGridMonthStats {
  requests: number;
  delivered: number;
  opens: number;
  uniqueOpens: number;
  clicks: number;
  uniqueClicks: number;
  bounces: number;
  unsubscribes: number;
  openRate: number;   // unique_opens / delivered, 0–100
  clickRate: number;  // unique_clicks / delivered, 0–100
  month: string;      // YYYY-MM-DD (first of month)
}

export interface SendGridStatsResult {
  thisMonth: SendGridMonthStats | null;
  lastMonth: SendGridMonthStats | null;
  error?: string;
}

function parseMonth(raw: any): SendGridMonthStats {
  const m = raw.stats?.[0]?.metrics ?? {};
  const delivered = m.delivered ?? 0;
  const uniqueOpens = m.unique_opens ?? 0;
  const uniqueClicks = m.unique_clicks ?? 0;
  return {
    requests:      m.requests ?? 0,
    delivered,
    opens:         m.opens ?? 0,
    uniqueOpens,
    clicks:        m.clicks ?? 0,
    uniqueClicks,
    bounces:       m.bounces ?? 0,
    unsubscribes:  m.unsubscribes ?? 0,
    openRate:      delivered > 0 ? Math.round((uniqueOpens / delivered) * 1000) / 10 : 0,
    clickRate:     delivered > 0 ? Math.round((uniqueClicks / delivered) * 1000) / 10 : 0,
    month:         raw.date,
  };
}

export async function getSendGridStats(): Promise<SendGridStatsResult> {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return { thisMonth: null, lastMonth: null, error: 'SENDGRID_API_KEY not set' };

  const now = new Date();
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const startDate = firstOfLastMonth.toISOString().slice(0, 10);
  const endDate = now.toISOString().slice(0, 10);

  try {
    const res = await fetch(
      `https://api.sendgrid.com/v3/stats?start_date=${startDate}&end_date=${endDate}&aggregated_by=month`,
      {
        headers: { Authorization: `Bearer ${key}` },
        next: { revalidate: 3600 }, // cache for 1 hour
      }
    );

    if (!res.ok) {
      return { thisMonth: null, lastMonth: null, error: `SendGrid API error: ${res.status}` };
    }

    const data: any[] = await res.json();
    const thisMonthKey = firstOfThisMonth.toISOString().slice(0, 10).slice(0, 7);
    const lastMonthKey = firstOfLastMonth.toISOString().slice(0, 10).slice(0, 7);

    const thisMonthRaw = data.find((d) => d.date?.startsWith(thisMonthKey));
    const lastMonthRaw = data.find((d) => d.date?.startsWith(lastMonthKey));

    return {
      thisMonth: thisMonthRaw ? parseMonth(thisMonthRaw) : null,
      lastMonth: lastMonthRaw ? parseMonth(lastMonthRaw) : null,
    };
  } catch (err) {
    return {
      thisMonth: null,
      lastMonth: null,
      error: err instanceof Error ? err.message : 'Failed to fetch SendGrid stats',
    };
  }
}
