/**
 * Auth API - Sign Up
 * Creates a new user account with Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, APIErrors, ErrorCode } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import { APIError } from '@/lib/api/api-error';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();
  
  // Parse request body
  const body = await request.json();
  const { email, password, firstName, lastName } = body;

  // Validation
  if (!email || !password) {
    throw APIErrors.validation('email and password', 'Email and password are required');
  }

  if (password.length < 8) {
    throw new APIError(
      ErrorCode.VAL_OUT_OF_RANGE,
      400,
      'Password must be at least 8 characters',
      { minLength: 8, actualLength: password.length }
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

  return NextResponse.json({
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email,
      emailConfirmed: data.user.email_confirmed_at !== null,
    },
    message: data.user.email_confirmed_at 
      ? 'Account created successfully' 
      : 'Please check your email to confirm your account',
  });
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
