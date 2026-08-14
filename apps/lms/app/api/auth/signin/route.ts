// PUBLIC ROUTE: sign-in endpoint — no auth possible
/**
 * Auth API - Sign In
 * Authenticates user with email and password.
 * Protected with rate limiting and input validation.
 *
 * Session tokens are persisted only through Supabase's shared-domain cookie
 * response. They are intentionally not echoed into JSON.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, APIErrors } from '@/lib/api';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { signInSchema } from '@/lib/api/validation-schemas';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const _POST = withErrorHandling(async (request: NextRequest) => {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited as NextResponse;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Authentication service is temporarily unavailable.', code: 'AUTH_UNAVAILABLE' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body', code: 'BAD_REQUEST' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const validated = signInSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Invalid sign-in request.', code: 'VALIDATION_ERROR' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const { email, password } = validated.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw APIErrors.unauthorized('Invalid email or password');
    }
    if (error.message.includes('Email not confirmed')) {
      throw APIErrors.unauthorized('Please confirm your email before signing in');
    }
    throw APIErrors.external('Supabase Auth');
  }

  if (!data.user || !data.session) {
    throw APIErrors.internal('Authentication failed');
  }

  return NextResponse.json(
    {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.user_metadata?.first_name,
        lastName: data.user.user_metadata?.last_name,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, private, max-age=0',
      },
    },
  );
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const POST = withApiAudit('/api/auth/signin', _POST);
