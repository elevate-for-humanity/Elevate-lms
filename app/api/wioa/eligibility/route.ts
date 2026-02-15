import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { parseBody } from '@/lib/api-helpers';
import { createSupabaseClient } from '@/lib/supabase-api';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// GET /api/wioa/eligibility - Get eligibility records
export async function GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = createSupabaseClient();
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const pending = searchParams.get('pending');

    let query = supabase.from('participant_eligibility').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (pending === 'true') {
      query = query.eq('eligibility_status', 'pending');
    } else if (status) {
      query = query.eq('eligibility_status', status);
    }

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

// POST /api/wioa/eligibility - Create eligibility record
export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = createSupabaseClient();
  try {
    const body = await parseBody<Record<string, any>>(request);
    const {
      userId,
      dateOfBirth,
      gender,
      ethnicity,
      race,
      isVeteran,
      veteranDocumentUrl,
      isDislocatedWorker,
      dislocatedWorkerDocumentUrl,
      layoffDate,
      isLowIncome,
      incomeDocumentUrl,
      householdSize,
      annualIncome,
      isYouth,
      hasDisability,
      disabilityDocumentUrl,
      disabilityType,
      notes,
    } = body;

    // Check if eligibility record already exists
    const { data: existing } = await supabase
      .from('participant_eligibility')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_EXISTS',
            message: 'Eligibility record already exists',
          },
        },
        { status: 400 }
      );
    }

    const eligibilityData = {
      user_id: userId,
      date_of_birth: dateOfBirth,
      gender,
      ethnicity,
      race: race || [],
      is_veteran: isVeteran || false,
      veteran_document_url: veteranDocumentUrl,
      is_dislocated_worker: isDislocatedWorker || false,
      dislocated_worker_document_url: dislocatedWorkerDocumentUrl,
      layoff_date: layoffDate,
      is_low_income: isLowIncome || false,
      income_document_url: incomeDocumentUrl,
      household_size: householdSize,
      annual_income: annualIncome,
      is_youth: isYouth || false,
      has_disability: hasDisability || false,
      disability_document_url: disabilityDocumentUrl,
      disability_type: disabilityType,
      eligibility_status: 'pending',
      notes,
    };

    const { data, error }: any = await supabase
      .from('participant_eligibility')
      .insert(eligibilityData)
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
