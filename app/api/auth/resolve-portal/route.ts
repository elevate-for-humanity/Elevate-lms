/**
 * GET /api/auth/resolve-portal
 *
 * Returns the portal path for the authenticated student.
 * Called by the login page after password auth when portal_type is not cached.
 * Resolves from enrollment → program → category, caches on profile, returns path.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolvePortalForUser } from '@/lib/portal/router';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ path: '/login' }, { status: 401 });
  }

  const path = await resolvePortalForUser(supabase, user.id);
  return NextResponse.json({ path });
}
