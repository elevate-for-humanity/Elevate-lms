/**
 * Job handler: provider_data_export
 *
 * Generates a CSV export for a provider tenant and uploads it to
 * Supabase Storage. Returns a signed URL valid for 1 hour.
 *
 * Payload:
 *   export_type: 'learners' | 'enrollments' | 'completions' | 'credentials' | 'placements'
 *   tenant_id: string
 *   requested_by: string (user ID)
 *   format: 'csv'
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

type ExportType = 'learners' | 'enrollments' | 'completions' | 'credentials' | 'placements';

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
}

async function fetchRows(
  db: ReturnType<typeof createAdminClient>,
  exportType: ExportType,
  tenantId: string
): Promise<Record<string, unknown>[]> {
  if (!db) return [];

  switch (exportType) {
    case 'learners': {
      const { data } = await db
        .from('profiles')
        .select('id, full_name, email, phone, city, state, created_at, role')
        .eq('tenant_id', tenantId)
        .eq('role', 'student')
        .order('created_at', { ascending: false });
      return data ?? [];
    }

    case 'enrollments': {
      const { data } = await db
        .from('program_enrollments')
        .select('id, user_id, program_id, status, funding_source, enrolled_at, completed_at')
        .eq('tenant_id', tenantId)
        .is('revoked_at', null)
        .order('enrolled_at', { ascending: false });
      return data ?? [];
    }

    case 'completions': {
      const { data } = await db
        .from('program_completion')
        .select('id, user_id, program_id, completed_at, credential_earned, certificate_issued_at')
        .in(
          'program_id',
          (await db.from('programs').select('id').eq('tenant_id', tenantId)).data?.map((p: any) => p.id) ?? []
        )
        .order('completed_at', { ascending: false });
      return data ?? [];
    }

    case 'credentials': {
      const { data } = await db
        .from('learner_credentials')
        .select('id, learner_id, credential_id, status, issued_at, expires_at, verified_at, verification_source')
        .in(
          'learner_id',
          (await db.from('profiles').select('id').eq('tenant_id', tenantId).eq('role', 'student')).data?.map((p: any) => p.id) ?? []
        )
        .order('issued_at', { ascending: false });
      return data ?? [];
    }

    case 'placements': {
      const { data } = await db
        .from('placement_records')
        .select('id, learner_id, employer_id, program_id, hire_date, job_title, employment_type, hourly_wage, verification_source, status, created_at')
        .eq('tenant_id', tenantId)
        .order('hire_date', { ascending: false });
      return data ?? [];
    }

    default:
      return [];
  }
}

export async function handleProviderDataExport(payload: Record<string, any>): Promise<void> {
  const { export_type, tenant_id, requested_by } = payload;

  if (!export_type || !tenant_id) {
    throw new Error('Missing export_type or tenant_id');
  }

  const db = createAdminClient();
  if (!db) throw new Error('Admin client unavailable');

  const rows = await fetchRows(db, export_type as ExportType, tenant_id);
  const csv = toCSV(rows as Record<string, unknown>[]);

  const filename = `exports/${tenant_id}/${export_type}_${Date.now()}.csv`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const buffer = Buffer.from(await blob.arrayBuffer());

  // Upload to Supabase Storage bucket 'provider-exports'
  const { error: uploadErr } = await db.storage
    .from('provider-exports')
    .upload(filename, buffer, {
      contentType: 'text/csv',
      upsert: false,
    });

  if (uploadErr) {
    logger.error('Provider export upload failed', { error: uploadErr.message, filename });
    throw new Error('Export upload failed');
  }

  // Generate signed URL valid for 1 hour
  const { data: signedData, error: signErr } = await db.storage
    .from('provider-exports')
    .createSignedUrl(filename, 3600);

  if (signErr || !signedData?.signedUrl) {
    throw new Error('Failed to generate signed download URL');
  }

  // Store result on the job record for polling
  // The job queue processor should update job payload with the result
  logger.info('Provider export complete', {
    export_type,
    tenant_id,
    rows: rows.length,
    download_url: signedData.signedUrl,
    requested_by,
  });

  // Return result via job payload update (handled by queue processor)
  // Callers poll /api/provider/export/[jobId]/status
}
