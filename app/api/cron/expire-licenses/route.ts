import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createAdminClient as createSupabaseClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * STEP 5D: Daily cron to expire overdue licenses
 * 
 * Call this endpoint daily via scheduled cron or external scheduler
 * Requires CRON_SECRET header for authentication
 */
async function _GET(request: Request) {
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
    const supabase = await createClient();
    
    // Call the batch expiry function
    const { data, error } = await supabase.rpc('expire_all_overdue_licenses');
    
    if (error) {
      logger.error('Failed to expire licenses', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
export const GET = withApiAudit('/api/cron/expire-licenses', _GET);
