import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { parseBody, getErrorMessage } from '@/lib/api-helpers';
import { createSupabaseClient } from '@/lib/supabase-api';
import { toError, toErrorMessage } from '@/lib/safe';

// GET /api/wioa/employment - Get employment records
export async function GET(request: NextRequest) {
  const supabase = createSupabaseClient();
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let query = supabase
      .from('employment_outcomes')
      .select('*')
      .order('start_date', { ascending: false });

    if (userId) query = query.eq('user_id', userId);
    if (status) query = query.eq('employment_status', status);

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

// POST /api/wioa/employment - Record employment outcome
export async function POST(request: NextRequest) {
  const supabase = createSupabaseClient();
  try {
    const body = await parseBody<Record<string, any>>(request);
    const {
      userId,
      employerName,
      employerContact,
      jobTitle,
      occupation,
      industry,
      startDate,
      hourlyWage,
      hoursPerWeek,
      employmentType,
      benefits,
      relatedToTraining,
      verificationMethod,
      verificationDocument,
      notes,
    } = body;

    const employmentData = {
      user_id: userId,
      employer_name: employerName,
      employer_contact: employerContact,
      job_title: jobTitle,
      occupation,
      industry,
      start_date: startDate,
      hourly_wage: hourlyWage,
      hours_per_week: hoursPerWeek,
      employment_type: employmentType,
      benefits: benefits || [],
      related_to_training: relatedToTraining || false,
      employment_status: 'employed',
      verification_method: verificationMethod,
      verification_document: verificationDocument,
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error }: any = await supabase
      .from('employment_outcomes')
      .insert(employmentData)
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
