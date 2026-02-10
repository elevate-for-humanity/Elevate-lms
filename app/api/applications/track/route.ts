import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';

// Public endpoint — applicants check their own status.
// Requires both application ID (UUID) AND email to prevent enumeration.
// The confirmation email provides both values in the tracking link.
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

    // Require both ID and email — ID alone is guessable via UUID patterns,
    // email alone enables enumeration. Together they form a two-factor lookup.
    if (!id || !email) {
      return NextResponse.json(
        { error: 'Application ID and email are both required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('applications')
      .select(
        'id, first_name, last_name, email, phone, program_id, status, submitted_at'
      )
      .eq('id', id)
      .eq('email', email.toLowerCase())
      .limit(1)
      .single();

    if (error || !data) {
      // Uniform 404 regardless of which factor failed
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
