/**
 * Tax Software Updates API
 * Manage pending tax parameter updates
 */

import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/authGuards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - List pending updates and alerts
 */
export async function GET() {
  try {
    const adminCheck = await apiRequireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;
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
    console.error('Error fetching tax updates:', error);
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
  try {
    const adminCheck = await apiRequireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;
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
    console.error('Error processing tax update action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}
