import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STAGE_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  advisor_review: 'Advisor review',
  needs_icc: 'Needs Indiana Career Connect account',
  needs_workone: 'Needs WorkOne appointment',
  funding_review: 'Funding review',
  approved: 'Approved',
  enrolled: 'Enrolled',
  closed: 'Closed',
};

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing token.' }, { status: 400 });
    }

    // Basic UUID format check to prevent injection
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
      return NextResponse.json({ error: 'Invalid token format.' }, { status: 400 });
    }

    const supabase = await getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
    }

    const { data, error } = await supabase
      .from('applications')
      .select('full_name, email, program_interest, intake_stage, created_at, updated_at')
      .eq('public_status_token', token)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    const stage = data.intake_stage || 'submitted';

    return NextResponse.json({
      success: true,
      application: {
        fullName: data.full_name,
        email: data.email,
        programInterest: data.program_interest,
        stage,
        stageLabel: STAGE_LABELS[stage] || stage,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
