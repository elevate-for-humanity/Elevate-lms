import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const { data, error } = await db
    .from('applications')
    .select('id, first_name, last_name, email, phone, program_interest, status, reference_number, source, created_at')
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) return NextResponse.json({ error: 'Failed to export applicants' }, { status: 500 });

  const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Program Interest', 'Status', 'Reference #', 'Source', 'Applied At'];
  const rows = (data ?? []).map((r) => [
    r.id,
    r.first_name ?? '',
    r.last_name ?? '',
    r.email ?? '',
    r.phone ?? '',
    r.program_interest ?? '',
    r.status ?? '',
    r.reference_number ?? '',
    r.source ?? '',
    r.created_at ? new Date(r.created_at).toISOString() : '',
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const date = new Date().toISOString().split('T')[0];

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="applicants-${date}.csv"`,
    },
  });
}
