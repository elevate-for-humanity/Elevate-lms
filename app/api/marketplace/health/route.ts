import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';

export async function GET() {
  const supabase = createAdminClient();
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
