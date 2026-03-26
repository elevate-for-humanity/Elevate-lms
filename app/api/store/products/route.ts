import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const { data, error }: any = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products', details: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) { 
    logger.error(
      'Get products error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        message: toErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/store/products', _GET);
