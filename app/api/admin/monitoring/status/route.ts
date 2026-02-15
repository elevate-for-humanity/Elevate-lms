import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  // Require admin auth — this endpoint exposes infrastructure details
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
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
      error: error instanceof Error ? error.message : 'Unknown error',
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
    
    // Simple query to check connection
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single();

    const latency = Date.now() - startTime;

    if (error && !error.message.includes('multiple')) {
      return {
        status: 'fail',
        connected: false,
        error: error.message,
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
      error: error instanceof Error ? error.message : 'Unknown error',
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
      error: error instanceof Error ? error.message : 'Unknown error',
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
  // Get memory usage
  const memoryUsage = process.memoryUsage();
  
  // Get uptime
  const uptime = process.uptime();

  // In production, these would come from a metrics store
  // For now, return mock data that would be collected
  return {
    uptime,
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      unit: 'MB',
    },
    requests: {
      total: 0, // Would be tracked in Redis
      errors: 0, // Would be tracked in Redis
      rate: 0, // Requests per minute
    },
    rateLimits: {
      blocked: 0, // Would come from Upstash analytics
      allowed: 0, // Would come from Upstash analytics
    },
  };
}
