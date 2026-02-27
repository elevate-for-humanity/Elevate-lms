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
  
  // Sign out
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw APIErrors.external('Supabase Auth');
  }

  return NextResponse.json({
    success: true,
    message: 'Signed out successfully',
  });
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const POST = withApiAudit('/api/auth/signout', _POST);
