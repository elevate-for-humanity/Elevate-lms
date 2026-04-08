import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Redis } from '@upstash/redis';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  // Auth — admin/super_admin only (endpoint exposes infrastructure details)
  const supabase = await createClient();
  const db = createAdminClient() ?? supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const startTime = Date.now();

  try {
    const checks = {
      database: await checkDatabase(),
      redis: await checkRedis(),
      stripe: checkStripe(),
      email: checkEmail(),
    };

    const overall = determineOverallStatus(checks);
    const metrics = getMetrics();

    return NextResponse.json({
      overall,
      timestamp: new Date().toISOString(),
      checks,
      metrics,
      responseTime: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('Monitoring status error:', error);
    return NextResponse.json({
      overall: 'down',
      timestamp: new Date().toISOString(),
      error: 'Internal server error',
      checks: {
        database: { status: 'fail', connected: false },
        redis: { status: 'fail', connected: false },
        stripe: { status: 'fail', configured: false },
        email: { status: 'fail', configured: false },
      },
      metrics: {
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
        requests: { total: 0, errors: 0, rate: 0 },
        rateLimits: { blocked: 0, allowed: 0 },
      },
    }, { status: 500 });
  }
}

async function checkDatabase() {
  const startTime = Date.now();
  try {
    const supabase = await createClient();
    const db = createAdminClient() ?? supabase;
    const { error } = await db.from('profiles').select('id', { count: 'exact', head: true });
    const latency = Date.now() - startTime;
    if (error) return { status: 'fail', connected: false, latency };
    return { status: 'pass', connected: true, latency };
  } catch {
    return { status: 'fail', connected: false, latency: Date.now() - startTime };
  }
}

async function checkRedis() {
  const startTime = Date.now();
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      return { status: 'warn', connected: false, message: 'Redis not configured', latency: 0 };
    }
    const redis = new Redis({ url, token });
    await redis.ping();
    return { status: 'pass', connected: true, latency: Date.now() - startTime };
  } catch {
    return { status: 'fail', connected: false, latency: Date.now() - startTime };
  }
}

function checkStripe() {
  const configured = !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET
  );
  return { status: configured ? 'pass' : 'warn', configured };
}

function checkEmail() {
  const configured = !!(process.env.SENDGRID_API_KEY && process.env.EMAIL_FROM);
  return { status: configured ? 'pass' : 'warn', configured };
}

function determineOverallStatus(checks: any): 'healthy' | 'degraded' | 'down' {
  const statuses = Object.values(checks).map((c: any) => c.status);
  if (statuses.includes('fail')) {
    return checks.database?.status === 'fail' ? 'down' : 'degraded';
  }
  if (statuses.includes('warn')) return 'degraded';
  return 'healthy';
}

function getMetrics() {
  const mem = process.memoryUsage();
  return {
    uptime: process.uptime(),
    memory: {
      used: Math.round(mem.heapUsed / 1024 / 1024),
      total: Math.round(mem.heapTotal / 1024 / 1024),
    },
    // Request and rate-limit counters are not tracked in-process.
    // Wire up to Redis or an APM tool for real values.
    requests: { total: 0, errors: 0, rate: 0 },
    rateLimits: { blocked: 0, allowed: 0 },
  };
}

export const GET = withRuntime(withApiAudit('/api/admin/monitoring/status', _GET));
