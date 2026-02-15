import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

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

    // Get performance metrics from audit logs
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const { data: requests } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action_type', 'api_request')
      .gte('created_at', oneHourAgo.toISOString());

    // Calculate metrics
    const metrics = calculatePerformanceMetrics(requests || []);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      timeRange: '1h',
      metrics,
    });
  } catch (error) {
    logger.error('Performance monitoring error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

function calculatePerformanceMetrics(requests: any[]) {
  if (requests.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      slowestEndpoints: [],
      fastestEndpoints: [],
      errorRate: 0,
    };
  }

  // Extract response times
  const responseTimes = requests
    .map(r => r.details?.duration || 0)
    .filter(d => d > 0)
    .sort((a, b) => a - b);

  // Calculate percentiles
  const p50 = percentile(responseTimes, 50);
  const p95 = percentile(responseTimes, 95);
  const p99 = percentile(responseTimes, 99);

  // Calculate average
  const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

  // Group by endpoint
  const byEndpoint: Record<string, { count: number; totalTime: number; errors: number }> = {};
  
  requests.forEach(req => {
    const endpoint = req.details?.endpoint || 'unknown';
    const duration = req.details?.duration || 0;
    const isError = req.details?.statusCode >= 400;

    if (!byEndpoint[endpoint]) {
      byEndpoint[endpoint] = { count: 0, totalTime: 0, errors: 0 };
    }

    byEndpoint[endpoint].count++;
    byEndpoint[endpoint].totalTime += duration;
    if (isError) byEndpoint[endpoint].errors++;
  });

  // Calculate average per endpoint
  const endpointStats = Object.entries(byEndpoint).map(([endpoint, stats]) => ({
    endpoint,
    count: stats.count,
    averageTime: stats.totalTime / stats.count,
    errorRate: (stats.errors / stats.count) * 100,
  }));

  // Sort by average time
  const slowestEndpoints = endpointStats
    .sort((a, b) => b.averageTime - a.averageTime)
    .slice(0, 10);

  const fastestEndpoints = endpointStats
    .sort((a, b) => a.averageTime - b.averageTime)
    .slice(0, 10);

  // Calculate error rate
  const totalErrors = requests.filter(r => r.details?.statusCode >= 400).length;
  const errorRate = (totalErrors / requests.length) * 100;

  return {
    totalRequests: requests.length,
    averageResponseTime: Math.round(averageResponseTime),
    p50: Math.round(p50),
    p95: Math.round(p95),
    p99: Math.round(p99),
    slowestEndpoints,
    fastestEndpoints,
    errorRate: Math.round(errorRate * 100) / 100,
  };
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const index = Math.ceil((p / 100) * arr.length) - 1;
  return arr[Math.max(0, Math.min(index, arr.length - 1))];
}
