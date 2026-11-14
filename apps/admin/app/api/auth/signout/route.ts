// PUBLIC ROUTE: sign-out endpoint — clears the authenticated Supabase session.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: NextRequest) {
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
        portal: 'Admin',
        userId: user.id,
        email: user.email,
        extra: { role: await resolvePortalKind(db, user.id) },
      });
    } catch {
      // Sign-out succeeded; monitoring is best-effort and isolated.
    }
  }

  const destination = error ? '/login?error=signout-failed' : '/login?signed_out=1';
  return NextResponse.redirect(new URL(destination, request.url), 303);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const POST = withApiAudit('/api/auth/signout', _POST);
