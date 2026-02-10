/**
 * Tax Software Monitor API
 * Trigger IRS monitoring runs
 */

import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/authGuards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * POST - Run IRS monitor
 */
export async function POST(req: Request) {
  try {
    const adminCheck = await apiRequireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;
    // Dynamic import to avoid build issues with Node.js modules
    const { createMonitor } = await import('@/lib/tax-software/irs-monitor');
    
    const body = await req.json().catch(() => ({}));
    const { taxYear, sources } = body;
    
    const monitor = createMonitor({
      taxYear: taxYear || new Date().getFullYear() + 1,
      sources: sources || undefined
    });
    
    const report = await monitor.run();
    
    return NextResponse.json({
      success: true,
      report: {
        runId: report.runId,
        timestamp: report.timestamp,
        sourcesChecked: report.sourcesChecked,
        changesDetected: report.changesDetected,
        updatesFound: report.updatesFound,
        alertsSent: report.alertsSent
      }
    });
  } catch (error) {
    console.error('Error running IRS monitor:', error);
    return NextResponse.json(
      { error: 'Failed to run monitor' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get monitor status
 */
export async function GET() {
  try {
    const adminCheck = await apiRequireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;
    const { createMonitor } = await import('@/lib/tax-software/irs-monitor');
    const monitor = createMonitor();
    
    return NextResponse.json({
      status: 'ready',
      pendingUpdates: monitor.getPendingUpdates().length,
      unacknowledgedAlerts: monitor.getAlerts().length
    });
  } catch (error) {
    console.error('Error getting monitor status:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
