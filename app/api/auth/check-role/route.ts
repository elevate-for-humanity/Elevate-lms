export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const searchParams = request.nextUrl.searchParams;
  const requiredRole = searchParams.get('role');

  if (!requiredRole) {
    return NextResponse.json({ error: 'Role parameter required' }, { status: 400 });
  }

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ hasRole: false, authenticated: false }, { status: 401 });
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const allowedRoles = [requiredRole, 'admin', 'super_admin'];
  const hasRole = profile && allowedRoles.includes(profile.role);

  return NextResponse.json({
    hasRole,
    authenticated: true,
    role: profile?.role,
  });
}
export const GET = withApiAudit('/api/auth/check-role', _GET);
