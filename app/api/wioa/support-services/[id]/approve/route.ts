import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { parseBody } from '@/lib/api-helpers';
import { createSupabaseClient } from '@/lib/supabase-api';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// POST /api/wioa/support-services/[id]/approve - Approve/deny support service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = createSupabaseClient();
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

    const { data, error }: any = await supabase
      .from('supportive_services')
      .update(updateData)
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
