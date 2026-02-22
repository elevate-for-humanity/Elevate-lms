import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { parseBody } from '@/lib/api-helpers';
import { createSupabaseClient } from '@/lib/supabase-api';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// GET /api/wioa/case-management - Get all cases
export async function GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = createSupabaseClient();
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const caseManagerId = searchParams.get('caseManagerId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    let query = db
      .from('case_management')
      .select('*')
      .order('priority', { ascending: false })
      .order('last_contact_date', { ascending: true, nullsFirst: true });

    if (userId) query = query.eq('user_id', userId);
    if (caseManagerId) query = query.eq('case_manager_id', caseManagerId);
    if (status) query = query.eq('case_status', status);
    if (priority) query = query.eq('priority', priority);

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

// POST /api/wioa/case-management - Create new case
export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = createSupabaseClient();
  try {
    const body = await parseBody<Record<string, any>>(request);
    const {
      userId,
      caseManagerId,
      priority,
      contactFrequency,
      intakeNotes,
      barriers,
      accommodations,
    } = body;

    const caseData = {
      user_id: userId,
      case_manager_id: caseManagerId,
      case_status: 'active',
      priority: priority || 'medium',
      intake_date: new Date().toISOString(),
      contact_frequency: contactFrequency || 'monthly',
      assessment_completed: false,
      barriers: barriers || [],
      accommodations: accommodations || [],
      notes: intakeNotes
        ? [
            {
              id: `note_${Date.now()}`,
              date: new Date().toISOString(),
              type: 'general',
              content: intakeNotes,
              confidential: false,
            },
          ]
        : [],
      activities: [],
      referrals: [],
    };

    const { data, error }: any = await db
      .from('case_management')
      .insert(caseData)
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
