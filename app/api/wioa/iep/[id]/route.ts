import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { parseBody } from '@/lib/api-helpers';
import { createSupabaseClient } from '@/lib/supabase-api';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { auditedMutation } from '@/lib/audit/transactional';

// GET /api/wioa/iep/[id] - Get IEP by ID
async function _GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = createSupabaseClient();
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
const supabase = createSupabaseClient();
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
export const GET = withApiAudit('/api/wioa/iep/[id]', _GET, { critical: true });
export const POST = withApiAudit('/api/wioa/iep/[id]', _POST, { critical: true });
export const PUT = withApiAudit('/api/wioa/iep/[id]', _PUT, { critical: true });
