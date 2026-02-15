export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 503 }
      );
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

    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

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
      return_url: `${process.env.NEXT_PUBLIC_URL}/program-holder/verify-identity?session_id={VERIFICATION_SESSION_ID}`,
    });

    // Store verification session in database
    await supabase.from('program_holder_verification').insert({
      program_holder_id: userId,
      verification_type: 'stripe_identity',
      status: 'pending',
      stripe_verification_session_id: session.id,
      created_at: new Date().toISOString(),
    });

    // Update program holder status
    await supabase
      .from('program_holders')
      .update({
        verification_status: 'pending',
      })
      .eq('user_id', userId);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          (err instanceof Error ? err.message : String(err)) ||
          'Failed to create verification session',
      },
      { status: 500 }
    );
  }
}
