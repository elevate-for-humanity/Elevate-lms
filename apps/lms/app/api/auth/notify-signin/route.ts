// AUTHENTICATED ROUTE: notifies the owner after a client-established session
// (magic link, OAuth, or invite). The client calls this once after the session
// exists; the identity comes from the server session, never the request body.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { notifyPortalAuthEvent, resolvePortalKind } from '@/lib/auth/portal-auth-notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const db = await requireAdminClient();
    await notifyPortalAuthEvent({
      event: 'signin',
      portal: await resolvePortalKind(db, user.id),
      userId: user.id,
      email: user.email,
    });
  } catch {
    // The session is already established; monitoring is best-effort.
  }

  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
