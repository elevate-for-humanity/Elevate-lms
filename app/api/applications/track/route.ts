// PUBLIC ROUTE: public application status tracking by token
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
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    if (!id && !email) {
      return NextResponse.json({ error: 'Application ID or email is required' }, { status: 400 });
    }

    const supabase = await requireAdminClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    let query = supabase
      .from('applications')
      .select(
        'id, first_name, last_name, email, phone, program_interest, program_id, reference_number, status, created_at, submitted_at, support_notes',
      );

    if (id) {
      // Support both UUID and reference number (EFH-XXXXX)
      if (id.startsWith('EFH-')) {
        query = query.eq('reference_number', id);
      } else {
        query = query.eq('id', id);
      }
    } else if (email) {
      query = query.eq('normalized_email', email.toLowerCase().trim());
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'No matching application was found for the provided details.' }, { status: 404 });
    }

    // Normalize submitted_at — some rows use created_at, some submitted_at
    const normalized = {
      ...data,
      submitted_at: data.submitted_at || data.created_at,
    };

    return NextResponse.json({ application: normalized }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve application' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/applications/track', _GET);
