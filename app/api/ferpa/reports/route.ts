export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

/**
 * POST /api/ferpa/reports — Generate a FERPA compliance report
 */
async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { reportType, startDate, endDate, format } = await request.json();

    if (!reportType || !startDate || !endDate) {
      return NextResponse.json({ error: 'reportType, startDate, and endDate are required' }, { status: 400 });
    }

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    let data: any[] = [];

    switch (reportType) {
      case 'access-log': {
        const { data: logs } = await db
          .from('ferpa_access_logs')
          .select('*')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .order('created_at', { ascending: false })
          .limit(1000);
        data = logs || [];
        break;
      }
      case 'disclosure': {
        const { data: logs } = await db
          .from('ferpa_access_logs')
          .select('*')
          .eq('action', 'disclosure')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .order('created_at', { ascending: false });
        data = logs || [];
        break;
      }
      case 'request-summary': {
        const { data: logs } = await db
          .from('ferpa_access_logs')
          .select('action, record_type, created_at')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        // Summarize by action type
        const summary: Record<string, number> = {};
        (logs || []).forEach(l => {
          summary[l.action] = (summary[l.action] || 0) + 1;
        });
        data = Object.entries(summary).map(([action, count]) => ({ action, count }));
        break;
      }
      case 'annual': {
        // Full annual report: access counts, unique users, record types
        const { data: logs } = await db
          .from('ferpa_access_logs')
          .select('user_id, student_id, action, record_type, created_at')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        const allLogs = logs || [];
        data = [{
          total_accesses: allLogs.length,
          unique_users: new Set(allLogs.map(l => l.user_id)).size,
          unique_students: new Set(allLogs.map(l => l.student_id)).size,
          by_action: allLogs.reduce((acc: Record<string, number>, l) => {
            acc[l.action] = (acc[l.action] || 0) + 1;
            return acc;
          }, {}),
          by_record_type: allLogs.reduce((acc: Record<string, number>, l) => {
            acc[l.record_type] = (acc[l.record_type] || 0) + 1;
            return acc;
          }, {}),
          period: { start: startDate, end: endDate },
        }];
        break;
      }
      default:
        return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
    }

    return NextResponse.json({
      reportType,
      format: format || 'json',
      generatedAt: new Date().toISOString(),
      recordCount: data.length,
      data,
    });
  } catch (error) {
    logger.error('FERPA report generation failed', error as Error);
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/ferpa/reports', _POST);
