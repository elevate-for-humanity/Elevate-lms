/**
 * Auth API - Get Current User
 * Returns the currently authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, APIErrors } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    throw APIErrors.external('Supabase Auth', error.message);
  }

  if (!user) {
    throw APIErrors.unauthorized('Not authenticated');
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.user_metadata?.first_name,
      lastName: user.user_metadata?.last_name,
      emailConfirmed: user.email_confirmed_at !== null,
      createdAt: user.created_at,
    },
  });
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
