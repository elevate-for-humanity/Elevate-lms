import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { parseBody } from '@/lib/api-helpers';
import { createSupabaseClient } from '@/lib/supabase-api';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// GET /api/wioa/iep - Get Individual Employment Plans
export async function GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = createSupabaseClient();
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let query = db
      .from('individual_employment_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) query = query.eq('user_id', userId);
    if (status) query = query.eq('status', status);

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

// POST /api/wioa/iep - Create Individual Employment Plan
export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = createSupabaseClient();
  try {
    const body = await parseBody<Record<string, any>>(request);
    const {
      userId,
      careerGoal,
      employmentGoal,
      educationLevel,
      workExperience,
      skills,
      barriers,
      strengths,
      trainingNeeds,
      supportServicesNeeded,
      targetOccupation,
      targetIndustry,
      targetWage,
      completionDate,
      milestones,
      notes,
    } = body;

    const iepData = {
      user_id: userId,
      career_goal: careerGoal,
      employment_goal: employmentGoal,
      education_level: educationLevel,
      work_experience: workExperience || [],
      skills: skills || [],
      barriers: barriers || [],
      strengths: strengths || [],
      training_needs: trainingNeeds || [],
      support_services_needed: supportServicesNeeded || [],
      target_occupation: targetOccupation,
      target_industry: targetIndustry,
      target_wage: targetWage,
      target_completion_date: completionDate,
      milestones: milestones || [],
      status: 'draft',
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error }: any = await db
      .from('individual_employment_plans')
      .insert(iepData)
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
