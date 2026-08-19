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

    // Public tracking intentionally requires two matching applicant-held values.
    // Email-only lookup exposes too much applicant PII to anyone who knows an
    // address, while ID-only lookup makes leaked reference numbers sufficient.
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

    let query = supabase
      .from('applications')
      .select(
        'id, first_name, last_name, email, phone, program_interest, program_id, reference_number, status, created_at, submitted_at, support_notes',
      )
      .eq('normalized_email', email);

    // Support both UUID and reference number (EFH-XXXXX), but always require
    // the email to match the same row before returning applicant information.
    if (id.startsWith('EFH-')) {
      query = query.eq('reference_number', id);
    } else {
      query = query.eq('id', id);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      // Deliberately do not reveal whether the ID or email was the mismatch.
      return NextResponse.json(
        { error: 'We could not verify those application details.' },
        { status: 404 },
      );
    }

    // Preserve the canonical persisted workflow status. The tracker UI owns
    // presentation for current workflow states and has a safe fallback for
    // future states so new statuses cannot silently blank the applicant view.
    const normalized = {
      ...data,
      submitted_at: data.submitted_at || data.created_at,
    };

    return NextResponse.json({ application: normalized }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve application' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/applications/track', _GET);
