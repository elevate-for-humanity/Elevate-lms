import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { parseBody } from '@/lib/api-helpers';
import { createSupabaseClient } from '@/lib/supabase-api';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// GET /api/wioa/iep/[id] - Get IEP by ID
export async function GET(
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
export async function PUT(
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

    const { data, error }: any = await supabase
      .from('individual_employment_plans')
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

// POST /api/wioa/iep/[id]/approve - Approve IEP
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
    const { approvedBy, approvalNotes } = body;

    const { data, error }: any = await supabase
      .from('individual_employment_plans')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        approval_notes: approvalNotes,
        updated_at: new Date().toISOString(),
      })
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
