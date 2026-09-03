/**
 * GET /api/admin/certifications/export
 *
 * Streams all user_certifications rows as a CSV download.
 * Columns: id, user_id, email, full_name, certification_name,
 *          certification_type, status, earned_date, expires_at, created_at
 *
 * Optional query params:
 *   status  — filter by status (pending|active|expired|revoked)
 *   type_id — filter by certification_type_id
 */

import { NextRequest } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toRow(cols: unknown[]): string {
  return cols.map(escapeCSV).join(',');
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status  = searchParams.get('status')  ?? undefined;
  const type_id = searchParams.get('type_id') ?? undefined;

  try {
    const db = await requireAdminClient();

    let query = db
      .from('user_certifications')
      .select(`
        id,
        user_id,
        certification_name,
        certification_type,
        status,
        earned_date,
        expires_at,
        created_at,
        profiles:user_id ( email, full_name )
      `)
      .order('created_at', { ascending: false });

    if (status)  query = query.eq('status', status);
    if (type_id) query = query.eq('certification_type_id', type_id);

    const { data, error } = await query;
    if (error) return safeInternalError(error, 'Failed to fetch certifications');

    const HEADERS = [
      'id', 'user_id', 'email', 'full_name',
      'certification_name', 'certification_type',
      'status', 'earned_date', 'expires_at', 'created_at',
    ];

    const rows = (data ?? []).map((row: any) => toRow([
      row.id,
      row.user_id,
      row.profiles?.email ?? '',
      row.profiles?.full_name ?? '',
      row.certification_name ?? '',
      row.certification_type ?? '',
      row.status,
      row.earned_date ?? '',
      row.expires_at ?? '',
      row.created_at,
    ]));

    const csv = [HEADERS.join(','), ...rows].join('\n');
    const filename = `certifications-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return safeInternalError(err, 'Export failed');
  }
}
