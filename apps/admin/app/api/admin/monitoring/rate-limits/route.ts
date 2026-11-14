import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Redis } from 'ioredis';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const { data: rateLimitHits } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action_type', 'rate_limit_hit')
      .gte('created_at', oneHourAgo.toISOString());

    let redisStats = null;
    if (process.env.REDIS_URL) {
      const redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        connectTimeout: 5_000,
        enableReadyCheck: true,
      });

      try {
        const keys = await redis.keys('ratelimit:*');
        redisStats = {
          totalKeys: keys.length,
          keys: keys.slice(0, 100),
        };
      } catch (error) {
        logger.error('Failed to get Redis rate-limit stats:', error);
      } finally {
        redis.disconnect();
      }
    }

    const analysis = analyzeRateLimitHits(rateLimitHits || []);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      timeRange: '1h',
      totalHits: rateLimitHits?.length || 0,
      analysis,
      redisStats,
    });
  } catch (error) {
    logger.error('Rate limit monitoring error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}

function analyzeRateLimitHits(hits: any[]) {
  if (hits.length === 0) {
    return {
      byEndpoint: {},
      byIP: {},
      topOffenders: [],
      timeline: [],
    };
  }

  const byEndpoint: Record<string, number> = {};
  hits.forEach((hit) => {
    const endpoint = hit.details?.endpoint || 'unknown';
    byEndpoint[endpoint] = (byEndpoint[endpoint] || 0) + 1;
  });

  const byIP: Record<string, { count: number; endpoints: Set<string> }> = {};
  hits.forEach((hit) => {
    const ip = hit.ip_address || 'unknown';
    const endpoint = hit.details?.endpoint || 'unknown';

    if (!byIP[ip]) {
      byIP[ip] = { count: 0, endpoints: new Set() };
    }

    byIP[ip].count++;
    byIP[ip].endpoints.add(endpoint);
  });

  const topOffenders = Object.entries(byIP)
    .map(([ip, data]) => ({
      ip,
      count: data.count,
      endpoints: Array.from(data.endpoints),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const timeline: Record<string, number> = {};
  hits.forEach((hit) => {
    const hour = new Date(hit.created_at).toISOString().slice(0, 13) + ':00:00';
    timeline[hour] = (timeline[hour] || 0) + 1;
  });

  return {
    byEndpoint,
    byIP: Object.fromEntries(Object.entries(byIP).map(([ip, data]) => [ip, data.count])),
    topOffenders,
    timeline: Object.entries(timeline).map(([time, count]) => ({ time, count })),
  };
}
export const GET = withApiAudit('/api/admin/monitoring/rate-limits', _GET);
