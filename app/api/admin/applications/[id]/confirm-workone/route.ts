import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getAdminClient } from '@/lib/supabase/admin';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);

  const { id } = await params;
  const body = await request.json().catch(() => ({})) as { workone_approval_ref?: string };

  const db = await getAdminClient();

  const { data: app, error: fetchErr } = await db
    .from('applications')
    .select('id, status')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) return safeDbError(fetchErr, 'Lookup failed');
  if (!app) return safeError('Application not found', 404);
  if (!['pending_workone', 'funding_review', 'submitted'].includes(app.status)) {
    return safeError(`Cannot confirm WorkOne on application with status: ${app.status}`, 409);
  }

  const { error } = await db
    .from('applications')
    .update({
      has_workone_approval:  true,
      workone_approval_ref:  body.workone_approval_ref ?? null,
      eligibility_status:    'verified',
      // Move to under_review so staff can proceed with final approval
      status:                'under_review',
      updated_at:            new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return safeDbError(error, 'Failed to confirm WorkOne approval');

  return NextResponse.json({ ok: true });
}
