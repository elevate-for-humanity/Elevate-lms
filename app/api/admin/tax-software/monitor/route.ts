import { logger } from '@/lib/logger';
/**
 * Tax Software Monitor API
 * Trigger IRS monitoring runs
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

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
 * POST - Run IRS monitor
 */
export async function POST(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
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
    logger.error('Error running IRS monitor:', error);
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
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { createMonitor } = await import('@/lib/tax-software/irs-monitor');
    const monitor = createMonitor();
    
    return NextResponse.json({
      status: 'ready',
      pendingUpdates: monitor.getPendingUpdates().length,
      unacknowledgedAlerts: monitor.getAlerts().length
    });
  } catch (error) {
    logger.error('Error getting monitor status:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
