import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toError, toErrorMessage } from '@/lib/safe';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30d';

    const supabase = await createClient();

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        break;
    }

    // Get campaign stats
    const { data: campaigns, error: campaignsError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('status', 'sent')
      .gte('sent_at', startDate.toISOString())
      .order('sent_at', { ascending: false });

    if (campaignsError) throw campaignsError;

    // Get email logs for detailed stats
    const { data: logs, error: logsError } = await supabase
      .from('email_logs')
      .select('*')
      .gte('sent_at', startDate.toISOString());

    if (logsError) throw logsError;

    // Calculate overview stats
    const totalSent =
      logs?.filter(
        (l) =>
          l.status === 'sent' ||
          l.status === 'delivered' ||
          l.status === 'opened' ||
          l.status === 'clicked'
      ).length || 0;
    const totalOpens =
      logs?.filter((l) => l.status === 'opened' || l.status === 'clicked')
        .length || 0;
    const totalClicks = logs?.filter((l) => l.status === 'clicked').length || 0;
    const totalBounces =
      logs?.filter((l) => l.status === 'bounced').length || 0;

    const overview = {
      totalSent,
      totalOpens,
      totalClicks,
      totalBounces,
      openRate: totalSent > 0 ? (totalOpens / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (totalClicks / totalSent) * 100 : 0,
      bounceRate: totalSent > 0 ? (totalBounces / totalSent) * 100 : 0,
    };

    // Calculate per-campaign stats
    const campaignStats =
      campaigns?.map((campaign) => {
        const campaignLogs =
          logs?.filter((l) => l.campaign_id === campaign.id) || [];
        const sent = campaignLogs.filter(
          (l) =>
            l.status === 'sent' ||
            l.status === 'delivered' ||
            l.status === 'opened' ||
            l.status === 'clicked'
        ).length;
        const opens = campaignLogs.filter(
          (l) => l.status === 'opened' || l.status === 'clicked'
        ).length;
        const clicks = campaignLogs.filter(
          (l) => l.status === 'clicked'
        ).length;

        return {
          id: campaign.id,
          name: campaign.name,
          sent,
          opens,
          clicks,
          openRate: sent > 0 ? (opens / sent) * 100 : 0,
          clickRate: sent > 0 ? (clicks / sent) * 100 : 0,
          sentAt: campaign.sent_at,
        };
      }) || [];

    // Calculate timeline data (daily aggregates)
    const timelineMap = new Map<
      string,
      { sent: number; opens: number; clicks: number }
    >();

    logs?.forEach((log) => {
      const date = new Date(log.sent_at).toISOString().split('T')[0];
      const existing = timelineMap.get(date) || {
        sent: 0,
        opens: 0,
        clicks: 0,
      };

      if (
        log.status === 'sent' ||
        log.status === 'delivered' ||
        log.status === 'opened' ||
        log.status === 'clicked'
      ) {
        existing.sent++;
      }
      if (log.status === 'opened' || log.status === 'clicked') {
        existing.opens++;
      }
      if (log.status === 'clicked') {
        existing.clicks++;
      }

      timelineMap.set(date, existing);
    });

    const timeline = Array.from(timelineMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate top performers
    const topPerformers = [
      ...campaignStats
        .sort((a, b) => b.openRate - a.openRate)
        .slice(0, 3)
        .map((c) => ({
          campaign: c.name,
          metric: 'Open Rate',
          value: c.openRate,
        })),
      ...campaignStats
        .sort((a, b) => b.clickRate - a.clickRate)
        .slice(0, 3)
        .map((c) => ({
          campaign: c.name,
          metric: 'Click Rate',
          value: c.clickRate,
        })),
    ];

    return NextResponse.json({
      success: true,
      data: {
        overview,
        campaigns: campaignStats,
        timeline,
        topPerformers,
      },
    });
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'Analytics error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { success: false, error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
