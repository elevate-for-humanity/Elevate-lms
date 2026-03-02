import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth/require-api-role';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { parseBody } from '@/lib/api-helpers';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// GET /api/wioa/support-services - Get support service requests
async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const _authCheck = await requireApiRole(['workforce_board', 'staff', 'admin', 'super_admin']);
    if (_authCheck instanceof NextResponse) return _authCheck;
    const supabase = _authCheck.adminDb;
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const serviceType = searchParams.get('serviceType');

    let query = supabase
      .from('supportive_services')
      .select('*')
      .order('request_date', { ascending: false });

    if (userId) query = query.eq('user_id', userId);
    if (status) query = query.eq('status', status);
    if (serviceType) query = query.eq('service_type', serviceType);

    const { data, error } = await query;

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

// POST /api/wioa/support-services - Request support service
async function _POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const _authCheck = await requireApiRole(['workforce_board', 'staff', 'admin', 'super_admin']);
    if (_authCheck instanceof NextResponse) return _authCheck;
    const supabase = _authCheck.adminDb;
  try {
    const body = await parseBody<Record<string, any>>(request);
    const {
      userId,
      serviceType,
      description,
      amount,
      frequency,
      startDate,
      endDate,
      justification,
      urgency,
    } = body;

    const serviceData = {
      user_id: userId,
      service_type: serviceType, // childcare, transportation, work_clothing, tools, emergency, other
      description,
      requested_amount: amount,
      frequency, // one_time, weekly, monthly
      start_date: startDate,
      end_date: endDate,
      justification,
      urgency: urgency || 'normal', // low, normal, high, urgent
      status: 'pending',
      request_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error }: any = await supabase
      .from('supportive_services')
      .insert(serviceData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
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
export const GET = withApiAudit('/api/wioa/support-services', _GET);
export const POST = withApiAudit('/api/wioa/support-services', _POST);
