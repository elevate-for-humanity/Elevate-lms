
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { id } = await params;
  try {
    const supabase = await createClient();
    const body = await parseBody<Record<string, any>>(request);
    const { status, rejection_reason } = body;

    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get existing leave request
    const { data: existing, error: existingError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (existingError) throw existingError;
    if (!existing) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      );
    }

    // Update leave request
    const { data: updated, error: updateError } = await supabase
      .from('leave_requests')
      .update({
        status,
        reviewed_by: user?.id ?? null,
        reviewed_at: new Date().toISOString(),
        rejection_reason: status === 'rejected' ? rejection_reason : null,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) throw updateError;

    // If approved, update leave balance
    if (status === 'approved') {
      const { error: balanceError } = await supabase.rpc(
        'apply_leave_request_to_balance',
        {
          p_employee_id: existing.employee_id,
          p_policy_id: existing.policy_id,
          p_year: new Date(existing.start_date).getFullYear(),
          p_hours: existing.total_hours,
        }
      );
      if (balanceError) {
        logger.error('Error updating leave balance:', balanceError);
      }
    }

    return NextResponse.json({ leaveRequest: updated });
  } catch (error) { 
    logger.error(
      'Error updating leave request:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to update leave request' },
      { status: 500 }
    );
  }
}
export const PATCH = withApiAudit('/api/hr/leave-requests/[id]', _PATCH);
