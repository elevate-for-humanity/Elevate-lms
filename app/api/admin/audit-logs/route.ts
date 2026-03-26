

import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs, getAuditStats } from '@/lib/auditLog';
import { requireAdmin } from '@/lib/authGuards';
import { withAuth } from '@/lib/with-auth';
import { logger } from '@/lib/logger';
export const runtime = 'edge';
export const maxDuration = 60;

export const GET = withAuth(
  async (request: NextRequest, user) => {
    try {
      await requireAdmin();

      const { searchParams } = new URL(request.url);
      const action = searchParams.get('action');
      const actorId = searchParams.get('actor_id');
      const targetType = searchParams.get('target_type');
      const targetId = searchParams.get('target_id');
      const startDate = searchParams.get('start_date');
      const endDate = searchParams.get('end_date');
      const limit = searchParams.get('limit');
      const export_csv = searchParams.get('export');

      if (export_csv === 'true') {
        // Export functionality removed - use getAuditLogs and format as CSV
        const result = await getAuditLogs({
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        });

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // Simple CSV export
        const logs = result.data || [];
        const csv = [
          'Timestamp,Actor,Action,Entity,Entity ID',
          ...logs.map(
            (item: any) =>
              `${item.created_at},${item.actor_user_id || 'system'},${item.action},${item.entity},${item.entity_id || ''}`
          ),
        ].join('\n');

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="audit-logs.csv"',
          },
        });
      }

      const result = await getAuditLogs({
        action: action as any,
        actor_id: actorId || undefined,
        target_type: targetType || undefined,
        target_id: targetId || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      // Get stats
      const stats = await getAuditStats();

      return NextResponse.json({
        logs: result.logs,
        stats,
      });
    } catch (error) { 
      logger.error('Error fetching audit logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 }
      );
    }
  },
  { roles: ['admin', 'super_admin'] }
);
