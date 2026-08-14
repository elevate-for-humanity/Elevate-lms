// PUBLIC ROUTE: browser telemetry — no PII, no auth required, rate-limited by CloudFront
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody, getErrorMessage } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  try {
    const vitals = await request.json();
    const supabase = await createClient();

    // Store web vitals in database for analysis
    const { error } = await supabase.from('web_vitals').insert({
      name: vitals.name,
      value: vitals.value,
      rating: vitals.rating,
      delta: vitals.delta,
      metric_id: vitals.id,
      navigation_type: vitals.navigationType,
      user_agent: request.headers.get('user-agent'),
      url: request.headers.get('referer'),
      created_at: new Date().toISOString(),
    });

    if (error) {
      logger.error('Error storing web vitals:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    /* Error handled silently */
    logger.error('Web vitals API error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
