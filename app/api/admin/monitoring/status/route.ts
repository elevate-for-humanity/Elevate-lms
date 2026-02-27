import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Redis } from '@upstash/redis';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
// Require admin auth — this endpoint exposes infrastructure details
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
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
    
    const metrics = await getMetrics();

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
  const _admin = createAdminClient(); const db = _admin || supabase;
    
    // Simple query to check connection
    const { error } = await db
      .from('profiles')
      .select('count')
      .limit(1)
      .single();

    const latency = Date.now() - startTime;

    if (error && !error.message.includes('multiple')) {
      return {
        status: 'fail',
        connected: false,
        error: 'Internal server error',
        latency,
      };
    }

    return {
      status: 'pass',
      connected: true,
      latency,
    };
  } catch (error) {
    return {
      status: 'fail',
      connected: false,
      error: 'Internal server error',
      latency: Date.now() - startTime,
    };
  }
}

async function checkRedis() {
  const startTime = Date.now();
  
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return {
        status: 'warn',
        connected: false,
        message: 'Redis not configured',
        latency: 0,
      };
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Test connection with ping
    await redis.ping();
    
    const latency = Date.now() - startTime;

    return {
      status: 'pass',
      connected: true,
      latency,
    };
  } catch (error) {
    return {
      status: 'fail',
      connected: false,
      error: 'Internal server error',
      latency: Date.now() - startTime,
    };
  }
}

function checkStripe() {
  const configured = !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET
  );

  return {
    status: configured ? 'pass' : 'warn',
    configured,
    message: configured ? 'Stripe configured' : 'Stripe not configured',
  };
}

function checkEmail() {
  const configured = !!(
    process.env.RESEND_API_KEY &&
    process.env.EMAIL_FROM
  );

  return {
    status: configured ? 'pass' : 'warn',
    configured,
    message: configured ? 'Email configured' : 'Email not configured',
  };
}

function determineOverallStatus(checks: any): 'healthy' | 'degraded' | 'down' {
  const statuses = Object.values(checks).map((check: any) => check.status);
  
  if (statuses.includes('fail')) {
    // If database is down, system is down
    if (checks.database.status === 'fail') {
      return 'down';
    }
    return 'degraded';
  }
  
  if (statuses.includes('warn')) {
    return 'degraded';
  }
  
  return 'healthy';
}

async function getMetrics() {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  return {
    uptime,
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      unit: 'MB',
    },
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };
}
export const GET = withApiAudit('/api/admin/monitoring/status', _GET);
