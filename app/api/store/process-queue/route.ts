
import { processFulfillmentQueue, getQueueStats } from '@/lib/store/fulfillment-queue';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

/**
 * Process fulfillment queue
 * Can be called by:
 * - Cron job (Netlify scheduled functions)
 * - Manual trigger from admin
 * - Upstash QStash webhook
 */
async function _POST(req: Request) {
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
async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const stats = await getQueueStats();
    return Response.json({ stats });
  } catch (error) {
    return Response.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
export const GET = withRuntime(withApiAudit('/api/store/process-queue', _GET));
export const POST = withRuntime(withApiAudit('/api/store/process-queue', _POST));
