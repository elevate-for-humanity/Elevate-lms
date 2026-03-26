import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth/require-api-role';

import { parseBody } from '@/lib/api-helpers';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { auditedMutation } from '@/lib/audit/transactional';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

// POST /api/wioa/support-services/[id]/approve - Approve/deny support service
async function _POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const _authCheck = await requireApiRole(['workforce_board', 'staff', 'admin', 'super_admin']);
    if (_authCheck instanceof NextResponse) return _authCheck;
    const supabase = _authCheck.adminDb;
  try {
    const { id } = await params;
    const body = await parseBody<Record<string, any>>(request);
    const { approved, approvedAmount, approvedBy, notes, denialReason } = body;

    const updateData = {
      status: approved ? 'approved' : 'denied',
      approved_amount: approvedAmount,
      approved_by: approvedBy,
      approval_date: new Date().toISOString(),
      approval_notes: notes,
      denial_reason: denialReason,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await auditedMutation({
      table: 'supportive_services',
      operation: 'update',
      rowData: updateData,
      filter: { id },
      audit: {
        action: 'api:post:/api/wioa/support-services/approve',
        actorId: approvedBy,
        targetType: 'supportive_services',
        targetId: id,
        metadata: { approved, approved_amount: approvedAmount },
      },
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data });
  } catch (error) { 
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: toErrorMessage(error) },
      },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/wioa/support-services/[id]/approve', _POST, { critical: true });
