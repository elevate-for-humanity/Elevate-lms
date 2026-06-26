import { NextResponse } from 'next/server';
import { ApplicationUpdateSchema } from '@/lib/validators/course';
import { getApplication, updateApplication, deleteApplication } from '@/lib/db/courses';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { logger } from '@/lib/logger';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function _GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!UUID_RE.test(id)) return safeError('Invalid application ID', 400);
  try {
    const data = await getApplication(id);
    if (!data) return safeError('Not found', 404);
    return NextResponse.json({ data });
  } catch (err) {
    return safeInternalError(err, 'Failed to load application');
  }
}

async function _PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!UUID_RE.test(id)) return safeError('Invalid application ID', 400);

  try {
    const before = await getApplication(id);
    if (!before) return safeError('Not found', 404);

    const body = await request.json().catch(() => null);
    const parsed = ApplicationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    if (Object.keys(parsed.data).length === 0) {
      return safeError('No fields to update', 400);
    }

    // Approval must go through POST /approve — it runs the full pipeline
    // (user creation, enrollment, post-approval actions, audit).
    if (parsed.data.status === 'approved') {
      return safeError(
        'Use POST /api/admin/applications/[id]/approve to approve applications.',
        400,
      );
    }

    const updateData: Record<string, unknown> = { ...parsed.data };
    if (updateData.status === 'rejected') updateData.reviewer_id = auth.id;

    const data = await updateApplication(id, updateData as any);

    // Audit log (non-fatal)
    const db = await requireAdminClient();
    if (db) {
      await db
        .from('audit_logs')
        .insert({
          actor_id: auth.id,
          action: updateData.status === 'rejected' ? 'reject' : 'status_change',
          resource_type: 'application',
          resource_id: id,
          before_state: before,
          after_state: data,
        })
        .catch(() => {});
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error('Application PATCH error', err);
    return safeInternalError(err, 'Failed to update application');
  }
}

async function _DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!UUID_RE.test(id)) return safeError('Invalid application ID', 400);

  try {
    const before = await getApplication(id);
    if (!before) return safeError('Not found', 404);

    const data = await deleteApplication(id);

    const db = await requireAdminClient();
    if (db) {
      await db
        .from('audit_logs')
        .insert({
          actor_id: auth.id,
          action: 'delete',
          resource_type: 'application',
          resource_id: id,
          before_state: before,
        })
        .catch(() => {});
    }

    return NextResponse.json({ data });
  } catch (err) {
    return safeInternalError(err, 'Failed to delete application');
  }
}

export const GET = withApiAudit('/api/admin/applications/[id]', _GET);
export const PATCH = withApiAudit('/api/admin/applications/[id]', _PATCH);
export const DELETE = withApiAudit('/api/admin/applications/[id]', _DELETE);
