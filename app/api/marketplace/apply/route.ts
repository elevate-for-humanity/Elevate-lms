export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

// Using Node.js runtime for email compatibility
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import {
  rateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  RateLimitPresets,
} from '@/lib/rateLimit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

  // Rate limiting: 3 applications per hour per IP
  const identifier = getClientIdentifier(req.headers);
  const rateLimitResult = await rateLimit(identifier, {
    limit: 3,
    window: 60 * 60 * 1000,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many applications. Please try again later.' },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { displayName, bio, payoutEmail, payoutMethod, productDescription } =
      await req.json();

    if (!displayName || !bio || !payoutEmail || !productDescription) {
      return NextResponse.json(
        { error: 'All fields required' },
        { status: 400 }
      );
    }

    // Check if user already has a creator profile
    const { data: existing } = await supabase
      .from('marketplace_creators')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.status === 'pending'
              ? 'Application already submitted'
              : 'Creator profile already exists',
        },
        { status: 400 }
      );
    }

    // Create creator application
    const { data, error }: any = await supabase
      .from('marketplace_creators')
      .insert({
        user_id: user.id,
        display_name: displayName,
        bio,
        payout_email: payoutEmail,
        payout_method: payoutMethod,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, creator: data });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Application failed' },
      { status: 500 }
    );
  }
}
