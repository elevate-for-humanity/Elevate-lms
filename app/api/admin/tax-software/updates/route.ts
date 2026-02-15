import { logger } from '@/lib/logger';
/**
 * Tax Software Updates API
 * Manage pending tax parameter updates
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function guardAdmin() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

/**
 * GET - List pending updates and alerts
 */
export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { createMonitor } = await import('@/lib/tax-software/irs-monitor');
    const monitor = createMonitor();
    
    const pendingUpdates = monitor.getPendingUpdates();
    const alerts = monitor.getAlerts();
    
    return NextResponse.json({
      pendingUpdates,
      alerts,
      summary: {
        pendingCount: pendingUpdates.length,
        alertCount: alerts.length,
        highConfidence: pendingUpdates.filter((u: any) => u.confidence === 'high').length,
        mediumConfidence: pendingUpdates.filter((u: any) => u.confidence === 'medium').length,
        lowConfidence: pendingUpdates.filter((u: any) => u.confidence === 'low').length
      }
    });
  } catch (error) {
    logger.error('Error fetching tax updates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch updates' },
      { status: 500 }
    );
  }
}

/**
 * POST - Approve or reject an update
 */
export async function POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { createMonitor } = await import('@/lib/tax-software/irs-monitor');
    const body = await req.json();
    const { action, updateId, alertId, userId } = body;
    
    const monitor = createMonitor();
    
    if (action === 'approve' && updateId) {
      const success = await monitor.approveUpdate(updateId, userId || 'admin');
      if (success) {
        return NextResponse.json({ success: true, message: 'Update approved and applied' });
      } else {
        return NextResponse.json({ error: 'Update not found or already processed' }, { status: 404 });
      }
    }
    
    if (action === 'reject' && updateId) {
      const success = monitor.rejectUpdate(updateId, userId || 'admin');
      if (success) {
        return NextResponse.json({ success: true, message: 'Update rejected' });
      } else {
        return NextResponse.json({ error: 'Update not found or already processed' }, { status: 404 });
      }
    }
    
    if (action === 'acknowledge' && alertId) {
      const success = monitor.acknowledgeAlert(alertId, userId || 'admin');
      if (success) {
        return NextResponse.json({ success: true, message: 'Alert acknowledged' });
      } else {
        return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
      }
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logger.error('Error processing tax update action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}
