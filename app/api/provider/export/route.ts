// POST /api/provider/export
// provider_admin requests a CSV export of their tenant's data.
// Enqueues an async export job — returns a job ID.
// The job writes a temp file to Supabase Storage and returns a signed URL.
//
// Supported export types:
//   learners, enrollments, completions, credentials, placements
//
// All exports are:
//   - scoped to the provider's tenant_id (hard-enforced)
//   - written to audit log
//   - generated async via job_queue to handle large datasets
//   - download URLs expire after 1 hour

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiAuthGuard } from '@/lib/authGuards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAuditEvent, AuditActions } from '@/lib/audit';
import { enqueueJob } from '@/lib/jobs/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_EXPORT_TYPES = [
  'learners',
  'enrollments',
  'completions',
  'credentials',
  'placements',
] as const;

type ExportType = typeof ALLOWED_EXPORT_TYPES[number];

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard({
    requireAuth: true,
    allowedRoles: ['provider_admin', 'admin', 'super_admin'],
  });
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.export_type) {
    return NextResponse.json({ error: 'export_type is required' }, { status: 400 });
  }

  const exportType = body.export_type as ExportType;
  if (!ALLOWED_EXPORT_TYPES.includes(exportType)) {
    return NextResponse.json(
      { error: `Invalid export_type. Allowed: ${ALLOWED_EXPORT_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  // Resolve tenant_id — provider_admin uses their own, admin can specify
  let tenantId: string | null = auth.profile?.tenant_id ?? null;
  if (['admin', 'super_admin'].includes(auth.role ?? '') && body.tenant_id) {
    tenantId = body.tenant_id;
  }

  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context available' }, { status: 400 });
  }

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  // Enqueue the export job
  const jobId = await enqueueJob({
    type: 'provider_data_export',
    payload: {
      export_type: exportType,
      tenant_id: tenantId,
      requested_by: auth.user.id,
      requested_at: new Date().toISOString(),
      format: 'csv',
    },
    maxAttempts: 3,
  });

  await logAuditEvent({
    actor_user_id: auth.user.id,
    actor_role: auth.role ?? 'provider_admin',
    action: AuditActions.CREATE,
    entity: 'provider_export_job',
    entity_id: jobId,
    after: { export_type: exportType, tenant_id: tenantId },
    req,
  });

  return NextResponse.json({
    success: true,
    job_id: jobId,
    message: `Export job queued. Poll /api/provider/export/${jobId}/status for completion.`,
    export_type: exportType,
  }, { status: 202 });
}
