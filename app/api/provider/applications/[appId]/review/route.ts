import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { appId } = params;
  if (!appId) return safeError('Missing application ID', 400);

  let body: { action: string; reviewNotes?: string };
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid request body', 400);
  }

  const { action, reviewNotes } = body;
  if (!['approve', 'reject'].includes(action)) {
    return safeError('action must be "approve" or "reject"', 400);
  }

  try {
    const supabase = await createClient();

    // Fetch the application
    const { data: app, error: fetchError } = await supabase
      .from('provider_applications')
      .select('id, status, org_name, contact_email, tenant_id')
      .eq('id', appId)
      .maybeSingle();

    if (fetchError || !app) return safeError('No matching application was found.', 404);
    if (app.status !== 'pending') {
      return safeError(`Application is already ${app.status}`, 409);
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { error: updateError } = await supabase
      .from('provider_applications')
      .update({
        status: newStatus,
        review_notes: reviewNotes ?? null,
        reviewed_by: auth.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', appId);

    if (updateError) return safeDbError(updateError, 'Failed to update application');

    return NextResponse.json({
      ok: true,
      status: newStatus,
      appId,
    });
  } catch (error) {
    return safeInternalError(error as Error, 'Review action failed');
  }
}
