import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';

// Public endpoint — applicants check their own status.
// Requires both email AND application ID to prevent enumeration.
export async function GET(request: NextRequest) {
  try {
    const ip = getIdentifier(request);
    const { ok } = await checkRateLimit({
      key: `app-track:${ip}`,
      limit: 5,
      windowSeconds: 300, // 5 lookups per 5 minutes
    });
    if (!ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Always filter by email. If ID is also provided, require both to match.
    let query = supabase
      .from('applications')
      .select(
        'id, first_name, last_name, email, phone, program_id, status, submitted_at'
      )
      .eq('email', email.toLowerCase());

    if (id) {
      query = query.eq('id', id);
    }

    const { data, error } = await query
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // Uniform 404 whether email exists or not — prevents enumeration
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ application: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve application' },
      { status: 500 }
    );
  }
}
