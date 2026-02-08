export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { auditExport } from '@/lib/auditLog';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';

    const supabase = createAdminClient();

    // Query audit snapshot view
    const { data, error }: any = await supabase.from('audit_snapshot').select('*');

    if (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
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
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
