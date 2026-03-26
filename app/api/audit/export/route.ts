
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { auditExport } from '@/lib/auditLog';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';

    const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Query audit snapshot view
    const { data, error }: any = await supabase.from('audit_snapshot').select('*');

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No data available for export' },
        { status: 404 }
      );
    }

    // Log the export action
    await auditExport(
      'audit_snapshot',
      req.headers.get('x-user-id') || undefined,
      (req.headers.get('x-user-role') as any) || 'workone',
      req
    );

    if (format === 'json') {
      return NextResponse.json({ data });
    }

    // Generate CSV
    const header = Object.keys(data[0]).join(',');
    const rows = data.map((item: any) =>
      Object.values(item)
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );

    const csv = [header, ...rows].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
