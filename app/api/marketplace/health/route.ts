// PUBLIC ROUTE: marketplace health check
import { NextResponse } from 'next/server';

import { getAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  const supabase = await getAdminClient();
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }
  try {
    // Check database connectivity
    const { error: dbError } = await supabase
      .from('marketplace_creators')
      .select('id')
      .limit(1);

    if (dbError) {
      return NextResponse.json(
        {
          ok: false,
          service: 'marketplace',
          error: 'Database connection failed',
        },
        { status: 503 }
      );
    }

    // Check Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          ok: false,
          service: 'marketplace',
          error: 'Stripe not configured',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      service: 'marketplace',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'healthy',
        stripe: 'configured',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        service: 'marketplace',
        err: toErrorMessage(err),
      },
      { status: 500 }
    );
  }
}
export const GET = withRuntime(withApiAudit('/api/marketplace/health', _GET));
