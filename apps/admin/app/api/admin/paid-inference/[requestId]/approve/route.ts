import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { approvePaidInference } from '@/lib/ai/paid-inference-gateway';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { requestId } = await params;
  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data: paidRequest, error: loadError } = await db
    .from('paid_inference_requests')
    .select('id,status,provider,model,operation,projected_cost_micros,course_id,lesson_id,created_at')
    .eq('id', requestId)
    .maybeSingle();
  if (loadError) return safeInternalError(loadError, 'Failed to load paid inference request');
  if (!paidRequest) return safeError('Paid inference request not found', 404);
  if (paidRequest.status !== 'approval_required') {
    return safeError(`Request cannot be approved from '${paidRequest.status}'`, 409);
  }

  try {
    const approved = await approvePaidInference(db, requestId, auth.id);
    if (!approved) return safeError('Request state changed before approval', 409);

    await db.from('audit_logs').insert({
      actor_id: auth.id,
      action: 'approve_paid_inference',
      resource_type: 'paid_inference_request',
      resource_id: requestId,
      metadata: {
        provider: paidRequest.provider,
        model: paidRequest.model,
        operation: paidRequest.operation,
        projected_cost_micros: paidRequest.projected_cost_micros,
        course_id: paidRequest.course_id,
        lesson_id: paidRequest.lesson_id,
      },
    });

    return NextResponse.json({
      ok: true,
      request_id: requestId,
      status: 'approved',
      projected_cost_micros: paidRequest.projected_cost_micros,
      dispatch_started: false,
    });
  } catch (error) {
    return safeInternalError(error, 'Paid inference approval failed');
  }
}
