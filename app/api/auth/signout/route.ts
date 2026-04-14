// PUBLIC ROUTE: sign-out endpoint — clears session
/**
 * Auth API - Sign Out
 * Logs out the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, APIErrors } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const _POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.redirect(new URL('/login?error=signout-failed', request.url), 303);
  }

  return NextResponse.redirect(new URL('/', request.url), 303);
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const POST = withApiAudit('/api/auth/signout', _POST);
