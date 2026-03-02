import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth/require-api-role';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { parseBody } from '@/lib/api-helpers';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// GET /api/wioa/iep - Get Individual Employment Plans
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

    let query = supabase
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

    const { data, error }: any = await supabase
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
export const GET = withApiAudit('/api/wioa/iep', _GET);
export const POST = withApiAudit('/api/wioa/iep', _POST);
