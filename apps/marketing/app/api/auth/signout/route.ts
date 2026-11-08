// PUBLIC ROUTE: sign-out endpoint — clears session
/**
 * Auth API - Sign Out
 * Logs out the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, APIErrors } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const _POST = withErrorHandling(async (request: NextRequest) => {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();

  // Capture identity before clearing the session so the owner knows who left.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.auth.signOut();

  if (!error && user) {
    try {
      const { notifyPortalAuthEvent, resolvePortalKind } = await import(
        '@/lib/auth/portal-auth-notify'
      );
      const { requireAdminClient } = await import('@/lib/supabase/admin');
      const db = await requireAdminClient();
      await notifyPortalAuthEvent({
        event: 'signout',
        portal: await resolvePortalKind(db, user.id),
        userId: user.id,
        email: user.email,
      });
    } catch {
      // Sign-out succeeded; monitoring is best-effort and isolated.
    }
  }

  if (error) {
    return NextResponse.redirect(new URL('/login?error=signout-failed', request.url), 303);
  }

  return NextResponse.redirect(new URL('/', request.url), 303);
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const POST = withApiAudit('/api/auth/signout', _POST);
