// PUBLIC ROUTE: sign-out endpoint — clears the authenticated Supabase session.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  const destination = error ? '/login?error=signout-failed' : '/login?signed_out=1';
  return NextResponse.redirect(new URL(destination, request.url), 303);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const POST = withApiAudit('/api/auth/signout', _POST);
