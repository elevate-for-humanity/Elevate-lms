import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get rate limit hits from audit logs
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const { data: rateLimitHits } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action_type', 'rate_limit_hit')
      .gte('created_at', oneHourAgo.toISOString());

    // Get Upstash analytics if available
    let upstashStats = null;
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });

        // Get rate limit keys
        const keys = await redis.keys('ratelimit:*');
        upstashStats = {
          totalKeys: keys.length,
          keys: keys.slice(0, 100), // Limit to 100 keys
        };
      } catch (error) {
        logger.error('Failed to get Upstash stats:', error);
      }
    }

    // Analyze rate limit hits
    const analysis = analyzeRateLimitHits(rateLimitHits || []);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      timeRange: '1h',
      totalHits: rateLimitHits?.length || 0,
      analysis,
      upstashStats,
    });
  } catch (error) {
    logger.error('Rate limit monitoring error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
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

  // Group by endpoint
  const byEndpoint: Record<string, number> = {};
  hits.forEach(hit => {
    const endpoint = hit.details?.endpoint || 'unknown';
    byEndpoint[endpoint] = (byEndpoint[endpoint] || 0) + 1;
  });

  // Group by IP
  const byIP: Record<string, { count: number; endpoints: Set<string> }> = {};
  hits.forEach(hit => {
    const ip = hit.ip_address || 'unknown';
    const endpoint = hit.details?.endpoint || 'unknown';
    
    if (!byIP[ip]) {
      byIP[ip] = { count: 0, endpoints: new Set() };
    }
    
    byIP[ip].count++;
    byIP[ip].endpoints.add(endpoint);
  });

  // Find top offenders
  const topOffenders = Object.entries(byIP)
    .map(([ip, data]) => ({
      ip,
      count: data.count,
      endpoints: Array.from(data.endpoints),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Create timeline (hourly buckets)
  const timeline: Record<string, number> = {};
  hits.forEach(hit => {
    const hour = new Date(hit.created_at).toISOString().slice(0, 13) + ':00:00';
    timeline[hour] = (timeline[hour] || 0) + 1;
  });

  return {
    byEndpoint,
    byIP: Object.fromEntries(
      Object.entries(byIP).map(([ip, data]) => [ip, data.count])
    ),
    topOffenders,
    timeline: Object.entries(timeline).map(([time, count]) => ({ time, count })),
  };
}
