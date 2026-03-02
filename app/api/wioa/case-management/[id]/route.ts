import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth/require-api-role';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { parseBody } from '@/lib/api-helpers';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// GET /api/wioa/case-management/[id] - Get case by ID
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
      .from('case_management')
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

// PUT /api/wioa/case-management/[id] - Update case
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

    const { data, error }: any = await supabase
      .from('case_management')
      .update(body)
      .eq('id', id)
      .select()
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
export const GET = withApiAudit('/api/wioa/case-management/[id]', _GET);
export const PUT = withApiAudit('/api/wioa/case-management/[id]', _PUT);
