import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;



async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const { data: programs } = await supabase
      .from('programs')
      .select(
        'id, title, slug, description, category, status, tuition, duration_weeks, total_hours',
      )
      .eq('status', 'active')
      .order('title');

    const programList = programs || [];

    // CSV Export
    if (format === 'csv') {
      const headers = [
        'ID',
        'Title',
        'Slug',
        'Category',
        'Status',
        'Tuition',
        'Duration (weeks)',
        'Total Hours',
      ];
      const rows = programList.map((p) =>
        [
          p.id,
          `"${(p.title || '').replace(/"/g, '""')}"`,
          p.slug,
          p.category,
          p.status,
          p.tuition,
          p.duration_weeks,
          p.total_hours,
        ].join(','),
      );
      const csv = [headers.join(','), ...rows].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="catalog-export.csv"',
        },
      });
    }

    // XLSX Export (as CSV with xlsx extension - basic implementation)
    if (format === 'xlsx') {
      const headers = [
        'ID',
        'Title',
        'Slug',
        'Category',
        'Status',
        'Tuition',
        'Duration (weeks)',
        'Total Hours',
      ];
      const rows = programList.map((p) =>
        [
          p.id,
          p.title,
          p.slug,
          p.category,
          p.status,
          p.tuition,
          p.duration_weeks,
          p.total_hours,
        ].join('\t'),
      );
      const tsv = [headers.join('\t'), ...rows].join('\n');

      return new NextResponse(tsv, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="catalog-export.xlsx"',
        },
      });
    }

    // PDF export is not yet implemented — use CSV or XLSX format instead.
    if (format === 'pdf') {
      return NextResponse.json(
        { error: 'PDF export is not available. Use CSV or XLSX format.' },
        { status: 501 },
      );
    }

    // Default: JSON
    return NextResponse.json({
      programs: programList,
      exportedAt: new Date().toISOString(),
      count: programList.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  return GET(request);
}
export const GET = withApiAudit('/api/admin/catalog/export', _GET);
export const POST = withApiAudit('/api/admin/catalog/export', _POST);
