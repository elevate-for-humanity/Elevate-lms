import { requireAdmin } from '@/lib/auth';

// app/api/admin/export/enrollments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClients';
import { withAuth } from '@/lib/with-auth';
import { logger } from '@/lib/logger';
import { logBulkExport } from '@/lib/audit/ferpa';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

const _GET = withAuth(
  async (req: NextRequest, user) => {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    try {
      const { searchParams } = new URL(req.url);
      const format = searchParams.get('format') || 'csv';
      const fundingType = searchParams.get('funding_type');
      const status = searchParams.get('status');

      // Build query
      let query = supabaseAdmin.from('program_enrollments').select(
        `
        id,
        user_id,
        program_id,
        status,
        funding_type,
        source,
        started_at,
        completed_at,
        created_at,
        programs ( title, slug )
      `
      );

      // Apply filters
      if (fundingType) {
        query = query.eq('funding_type', fundingType);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        logger.error('Export enrollments error:', error);
        throw error;
      }

      const enrollments = data ?? [];

      if (format === 'csv') {
        const header = [
          'enrollment_id',
          'program_title',
          'program_slug',
          'user_id',
          'status',
          'funding_type',
          'source',
          'started_at',
          'completed_at',
          'created_at',
        ];

        const rows = enrollments.map((item: any) => [
          item.id,
          item.programs?.title || '',
          item.programs?.slug || '',
          item.user_id,
          item.status,
          item.funding_type || '',
          item.source || '',
          item.started_at || '',
          item.completed_at || '',
          item.created_at || '',
        ]);

        const csv =
          header.join(',') +
          '\n' +
          rows.map((r) => r.map(escapeCsvField).join(',')).join('\n');

        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `enrollments_report_${timestamp}.csv`;

        return new NextResponse(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      }

      // Log FERPA-regulated bulk export
      await logBulkExport(user.id, 'admin', 'enrollment', enrollments.length);

      // Default JSON format
      return NextResponse.json({ enrollments, count: enrollments.length });
    } catch (err) {
      logger.error('Export enrollments error:', err);
      return NextResponse.json(
        { error: 'Failed to export enrollments' },
        { status: 500 }
      );
    }
  },
  { roles: ['admin', 'super_admin'] }
);

function escapeCsvField(field: any): string {
  if (field == null) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
export const GET = withApiAudit('/api/admin/export/enrollments', _GET);
