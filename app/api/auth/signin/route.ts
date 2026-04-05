import { safeInternalError } from '@/lib/api/safe-error';
/**
 * Auth API - Sign In
 * Authenticates user with email and password
 * Protected with rate limiting and input validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, APIErrors } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { authRateLimit } from '@/lib/rate-limit';
import { signInSchema } from '@/lib/api/validation-schemas';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const _POST = withRateLimit(
  withErrorHandling(async (request: NextRequest) => {
    const supabase = await createClient();
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = signInSchema.parse(body);
    const { email, password } = validatedData;

  // Sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

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

  return NextResponse.json({
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email,
      firstName: data.user.user_metadata?.first_name,
      lastName: data.user.user_metadata?.last_name,
    },
    session: {
      accessToken: data.session.access_token,
      expiresAt: data.session.expires_at,
    },
  });
  }),
  { limiter: authRateLimit, skipOnMissing: true }
);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const POST = withApiAudit('/api/auth/signin', _POST);
