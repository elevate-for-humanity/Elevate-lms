import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-api';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * STEP 5D: Daily cron to expire overdue licenses
 * 
 * Call this endpoint daily via Vercel Cron or external scheduler
 * Requires CRON_SECRET header for authentication
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('Unauthorized cron attempt', { 
      path: '/api/cron/expire-licenses' 
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const supabase = createSupabaseClient();
    
    // Call the batch expiry function
    const { data, error } = await supabase.rpc('expire_all_overdue_licenses');
    
    if (error) {
      logger.error('Failed to expire licenses', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const expiredCount = data as number;
    
    logger.info('License expiry cron completed', { expiredCount });
    
    return NextResponse.json({ 
      success: true,
      expiredCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Cron job failed', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
