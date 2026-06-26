import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError, safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ExportType = 'learners' | 'enrollments' | 'completions' | 'credentials' | 'placements';
const EXPORT_TYPES = new Set<ExportType>(['learners', 'enrollments', 'completions', 'credentials', 'placements']);
const EXPORT_ROLES = new Set(['provider_admin', 'admin', 'staff']);

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return 'status\nno rows\n';
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
}

async function fetchRows(db: any, exportType: ExportType, tenantId: string): Promise<Record<string, unknown>[]> {
  if (exportType === 'learners') {
    const { data } = await db
      .from('profiles')
      .select('id, full_name, email, phone, city, state, role, created_at')
      .eq('tenant_id', tenantId)
      .eq('role', 'student')
      .order('created_at', { ascending: false });
    return data ?? [];
  }

  if (exportType === 'enrollments') {
    const { data } = await db
      .from('program_enrollments')
      .select('id, user_id, program_id, status, funding_source, enrolled_at, completed_at')
      .eq('tenant_id', tenantId)
      .order('enrolled_at', { ascending: false });
    return data ?? [];
  }

  if (exportType === 'placements') {
    const { data } = await db
      .from('placement_records')
      .select('id, learner_id, employer_id, program_id, hire_date, job_title, employment_type, hourly_wage, annual_salary, status, created_at')
      .eq('tenant_id', tenantId)
      .order('hire_date', { ascending: false });
    return data ?? [];
  }

  if (exportType === 'credentials') {
    const { data: learners } = await db.from('profiles').select('id').eq('tenant_id', tenantId).eq('role', 'student');
    const learnerIds = (learners ?? []).map((learner: { id: string }) => learner.id);
    if (!learnerIds.length) return [];
    const { data } = await db
      .from('learner_credentials')
      .select('id, learner_id, credential_id, status, issued_at, expires_at, verified_at, verification_source')
      .in('learner_id', learnerIds)
      .order('issued_at', { ascending: false });
    return data ?? [];
  }

  const { data: programs } = await db.from('programs').select('id').eq('tenant_id', tenantId);
  const programIds = (programs ?? []).map((program: { id: string }) => program.id);
  if (!programIds.length) return [];
  const { data } = await db
    .from('program_completion')
    .select('id, user_id, program_id, completed_at, credential_earned, certificate_issued_at')
    .in('program_id', programIds)
    .order('completed_at', { ascending: false });
  return data ?? [];
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;
  if (!auth.role || !EXPORT_ROLES.has(auth.role)) return safeError('Forbidden', 403);

  const body = (await request.json().catch(() => null)) as { export_type?: ExportType; tenant_id?: string } | null;
  const exportType = body?.export_type ?? 'learners';
  if (!EXPORT_TYPES.has(exportType)) return safeError('Unsupported export_type', 400);

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  try {
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('tenant_id')
      .eq('id', auth.id)
      .maybeSingle();
    if (profileError) return safeDbError(profileError, 'Provider export profile lookup failed');

    const ownTenantId = (profile as { tenant_id?: string } | null)?.tenant_id;
    const tenantId = auth.role === 'provider_admin' ? ownTenantId : body?.tenant_id ?? ownTenantId;
    if (!tenantId) return safeError('tenant_id is required for provider export', 400);

    const { data: exportJob, error: insertError } = await db
      .from('provider_exports')
      .insert({ provider_id: auth.id, export_type: exportType, status: 'processing' })
      .select('id, export_type, status, created_at')
      .maybeSingle();
    if (insertError) return safeDbError(insertError, 'Provider export job creation failed');

    const rows = await fetchRows(db, exportType, tenantId);
    const csv = toCsv(rows as Record<string, unknown>[]);
    const filename = `exports/${tenantId}/${exportType}_${Date.now()}.csv`;
    const { error: uploadError } = await db.storage.from('provider_exports').upload(filename, Buffer.from(csv, 'utf8'), {
      contentType: 'text/csv',
      upsert: false,
    });
    if (uploadError) {
      await db.from('provider_exports').update({ status: 'failed', error: 'Export upload failed' }).eq('id', exportJob.id);
      return safeDbError(uploadError, 'Provider export upload failed');
    }

    const { data: signed, error: signedError } = await db.storage.from('provider_exports').createSignedUrl(filename, 3600);
    if (signedError) return safeDbError(signedError, 'Provider export signed URL failed');

    const { data: completed, error: updateError } = await db
      .from('provider_exports')
      .update({ status: 'complete', file_path: filename, completed_at: new Date().toISOString() })
      .eq('id', exportJob.id)
      .select('id, export_type, status, file_path, completed_at')
      .maybeSingle();
    if (updateError) return safeDbError(updateError, 'Provider export completion update failed');

    return NextResponse.json({ ok: true, export: completed, rows: rows.length, download_url: signed?.signedUrl ?? null }, { status: 201 });
  } catch (error) {
    return safeInternalError(error, 'Provider export failed');
  }
}
