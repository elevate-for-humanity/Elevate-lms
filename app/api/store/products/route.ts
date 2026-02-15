import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data, error }: any = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products', details: error.message || 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) { /* Error handled silently */ 
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
