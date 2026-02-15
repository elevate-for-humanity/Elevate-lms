import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { parseBody } from '@/lib/api-helpers';
import { createSupabaseClient } from '@/lib/supabase-api';
import { toErrorMessage } from '@/lib/safe';

// GET /api/wioa/support-services - Get support service requests
export async function GET(request: NextRequest) {
  const supabase = createSupabaseClient();
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const serviceType = searchParams.get('serviceType');

    let query = supabase
      .from('support_services')
      .select('*')
      .order('request_date', { ascending: false });

    if (userId) query = query.eq('user_id', userId);
    if (status) query = query.eq('status', status);
    if (serviceType) query = query.eq('service_type', serviceType);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) { /* Error handled silently */ 
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
export async function POST(request: NextRequest) {
  const supabase = createSupabaseClient();
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
      .from('support_services')
      .insert(serviceData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: toErrorMessage(error) },
      },
      { status: 500 }
    );
  }
}
