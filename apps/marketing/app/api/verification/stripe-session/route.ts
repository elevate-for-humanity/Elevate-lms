import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { getStripe } from '@/lib/stripe/client';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  await hydrateProcessEnv();
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Identity verification is temporarily unavailable.' }, { status: 503 });

  const db = await requireAdminClient();
  const { data: existing } = await db
    .from('id_verifications')
    .select('id,status,stripe_verification_session_id')
    .eq('user_id', user.id)
    .in('status', ['pending', 'processing', 'approved', 'verified'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing && ['approved', 'verified'].includes(existing.status)) {
    return NextResponse.json({ success: true, status: 'verified' });
  }

  try {
    if (existing?.stripe_verification_session_id && ['pending', 'processing'].includes(existing.status)) {
      const resumable = await stripe.identity.verificationSessions.retrieve(
        existing.stripe_verification_session_id,
      );
      if (resumable.url) {
        return NextResponse.json({ success: true, status: 'processing', url: resumable.url });
      }
    }

    const origin = new URL(PLATFORM_DEFAULTS.siteUrl).origin;
    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      options: {
        document: {
          allowed_types: ['driving_license', 'id_card', 'passport'],
          require_id_number: true,
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
      metadata: { user_id: user.id, purpose: 'learner_identity' },
      return_url: `${origin}/onboarding/learner/verify-identity?provider=stripe&status=processing`,
    });

    const { error } = await db.from('id_verifications').insert({
      user_id: user.id,
      status: 'processing',
      provider: 'stripe_identity',
      stripe_verification_session_id: session.id,
      metadata: { purpose: 'learner_identity' },
    });
    if (error) throw error;

    return NextResponse.json({ success: true, status: 'processing', url: session.url });
  } catch (error) {
    logger.error('[verification/stripe-session] unable to create session', error);
    return NextResponse.json({ error: 'Unable to start secure identity verification.' }, { status: 500 });
  }
}
