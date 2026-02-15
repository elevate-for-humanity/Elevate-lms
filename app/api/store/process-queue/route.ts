export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { processFulfillmentQueue, getQueueStats } from '@/lib/store/fulfillment-queue';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * Process fulfillment queue
 * Can be called by:
 * - Cron job (Netlify scheduled functions)
 * - Manual trigger from admin
 * - Upstash QStash webhook
 */
export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    // Verify authorization (cron secret or admin)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Check if it's an admin request
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    
    const processed = await processFulfillmentQueue();
    const stats = await getQueueStats();
    
    logger.info('Queue processing complete', { processed, stats });
    
    return Response.json({
      success: true,
      processed,
      stats,
    });
  } catch (error) {
    logger.error('Queue processing failed', error as Error);
    return Response.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Get queue stats
 */
export async function GET() {
  try {
    const stats = await getQueueStats();
    return Response.json({ stats });
  } catch (error) {
    return Response.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
