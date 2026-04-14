// PUBLIC ROUTE: browser perf reporting — no auth possible
import { NextRequest, NextResponse } from 'next/server';

import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const data = await parseBody<Record<string, any>>(request);
    const supabase = await createClient();

    // Store slow resource data for analysis
    const { error } = await supabase.from('slow_resources').insert({
      name: data.name,
      duration: data.duration,
      size: data.size,
      type: data.type,
      user_agent: request.headers.get('user-agent'),
      url: request.headers.get('referer'),
      created_at: new Date().toISOString(),
    });

    if (error) {
      logger.error('Error storing slow resource data:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) { 
    logger.error(
      'Slow resources API error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        success: false,
        error: toErrorMessage(error) || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/analytics/performance/slow-resources', _POST);
