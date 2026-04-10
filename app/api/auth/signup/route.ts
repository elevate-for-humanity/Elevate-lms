import { safeInternalError } from '@/lib/api/safe-error';
/**
 * Auth API - Sign Up
 * Creates a new user account with Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, APIErrors, ErrorCode } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { APIError } from '@/lib/api/api-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { validatePassword } from '@/lib/auth/password-validation';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const _POST = withErrorHandling(async (request: NextRequest) => {
  // Rate limit signup to prevent account creation abuse
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  
  // Parse request body
  const body = await request.json();
  const { email, password, firstName, lastName } = body;

  // Validation
  if (!email || !password) {
    throw APIErrors.validation('email and password', 'Email and password are required');
  }

  // Server-side password validation (NIST 800-63B)
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    throw new APIError(
      ErrorCode.VAL_OUT_OF_RANGE,
      400,
      passwordCheck.errors[0] || 'Password does not meet requirements',
      { errors: passwordCheck.errors }
    );
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw APIErrors.validation('email', 'Invalid email format');
  }

  // Create user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      throw APIErrors.conflict('Email already registered');
    }
    throw APIErrors.external('Supabase Auth');
  }

  if (!data.user) {
    throw APIErrors.internal('Failed to create user');
  }

  // Auto-confirm email so users can log in immediately without waiting for a confirmation email
  if (!data.user.email_confirmed_at) {
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await adminClient.auth.admin.updateUserById(data.user.id, { email_confirm: true });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email,
      emailConfirmed: true,
    },
    message: 'Account created successfully',
  });
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const POST = withApiAudit('/api/auth/signup', _POST);
