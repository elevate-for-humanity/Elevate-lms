import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/client';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;
const stripe = getStripe();

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile and canonical program_holder_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, program_holder_id')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let programHolderId: string | null = profile.program_holder_id ?? null;
    if (!programHolderId) {
      const { data: fallbackHolder } = await supabase
        .from('program_holders')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      programHolderId = fallbackHolder?.id ?? null;
    }

    if (!programHolderId) {
      return NextResponse.json({ error: 'Program holder record not found' }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_URL || request.nextUrl.origin;

    // Create Stripe Identity verification session
    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        user_id: userId,
        email: profile.email,
      },
      options: {
        document: {
          allowed_types: ['driving_license', 'passport', 'id_card'],
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
      return_url: `${baseUrl}/program-holder/verify-identity?session_id={VERIFICATION_SESSION_ID}`,
    });

    // Store verification session in database
    const { error: insertError } = await supabase.from('program_holder_verification').insert({
      user_id: userId,
      program_holder_id: programHolderId,
      verification_type: 'stripe_identity',
      status: 'pending',
      stripe_verification_session_id: session.id,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save verification session' }, { status: 500 });
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
export const POST = withApiAudit('/api/program-holder/create-verification', _POST);
