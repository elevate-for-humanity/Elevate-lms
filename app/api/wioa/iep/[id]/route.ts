import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth/require-api-role';

import { parseBody } from '@/lib/api-helpers';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { auditedMutation } from '@/lib/audit/transactional';
import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

// GET /api/wioa/iep/[id] - Get IEP by ID
async function _GET(
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

    const { data, error }: any = await supabase
      .from('individual_employment_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

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

// PUT /api/wioa/iep/[id] - Update IEP
async function _PUT(
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

    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await auditedMutation({
      table: 'individual_employment_plans',
      operation: 'update',
      rowData: updateData,
      filter: { id },
      audit: {
        action: 'api:put:/api/wioa/iep',
        targetType: 'individual_employment_plans',
        targetId: id,
        metadata: { fields_updated: Object.keys(body) },
      },
    });

    if (error) { logger.error('[wioa/iep] DB mutation failed', { code: error.code }); throw new Error('DB_MUTATION_FAILED'); }

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

// POST /api/wioa/iep/[id]/approve - Approve IEP
async function _POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  try {
    const { id } = await params;
    const body = await parseBody<Record<string, any>>(request);
    const { approvedBy, approvalNotes } = body;

    const { data, error } = await auditedMutation({
      table: 'individual_employment_plans',
      operation: 'update',
      rowData: {
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        approval_notes: approvalNotes,
        updated_at: new Date().toISOString(),
      },
      filter: { id },
      audit: {
        action: 'api:post:/api/wioa/iep/approve',
        actorId: approvedBy,
        targetType: 'individual_employment_plans',
        targetId: id,
        metadata: { approval_notes: approvalNotes },
      },
    });

    if (error) { logger.error('[wioa/iep] DB mutation failed', { code: error.code }); throw new Error('DB_MUTATION_FAILED'); }

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
export const GET = withApiAudit('/api/wioa/iep/[id]', _GET, { critical: true });
export const POST = withApiAudit('/api/wioa/iep/[id]', _POST, { critical: true });
export const PUT = withApiAudit('/api/wioa/iep/[id]', _PUT, { critical: true });
