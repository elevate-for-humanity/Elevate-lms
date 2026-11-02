// PUBLIC ROUTE: public application status tracking by paired applicant credentials
import { NextRequest, NextResponse } from 'next/server';

import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id')?.trim();
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!id || !email) {
      return NextResponse.json(
        { error: 'Application ID and email address are required' },
        { status: 400 },
      );
    }

    const supabase = await requireAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    // Email is used only as a verifier and is never echoed back. The public
    // status response is deliberately limited to fields needed to identify the
    // application and explain its workflow state.
    let query = supabase
      .from('applications')
      .select(
        'id, first_name, program_interest, program_id, reference_number, status, created_at, submitted_at',
      )
      .eq('normalized_email', email);

    if (id.startsWith('EFH-')) {
      query = query.eq('reference_number', id);
    } else {
      query = query.eq('id', id);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Employer, Program Holder and staff references identify intake records,
    // not learner applications. Verify both credentials before returning only
    // receipt information; intake processing is not an admissions decision.
    if (!error && !data && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      const { data: intake, error: intakeError } = await supabase
        .from('application_intake')
        .select('id, application_type, created_at')
        .eq('id', id)
        .eq('payload->>email', email)
        .in('application_type', ['employer', 'program_holder', 'staff'])
        .maybeSingle();
      if (!intakeError && intake) {
        return NextResponse.json({ application: {
          id: intake.id,
          first_name: 'Applicant',
          program_interest: ({ employer: 'Employer Partnership', program_holder: 'Program Holder Partnership', staff: 'Staff Application' } as Record<string, string>)[intake.application_type],
          program_id: null,
          reference_number: intake.id,
          status: 'under_review',
          submitted_at: intake.created_at,
        } }, { headers: { 'Cache-Control': 'no-store' } });
      }
    }

    if (error || !data) {
      return NextResponse.json(
        { error: 'We could not verify those application details.' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        application: {
          id: data.id,
          first_name: data.first_name,
          program_interest: data.program_interest,
          program_id: data.program_id,
          reference_number: data.reference_number,
          status: data.status,
          submitted_at: data.submitted_at || data.created_at,
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve application' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/applications/track', _GET);
