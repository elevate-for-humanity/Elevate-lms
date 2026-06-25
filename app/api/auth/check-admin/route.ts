import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { API_ADMIN_ROLES } from '@/lib/rbac/role-matrix';

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isAdmin: false, error: 'Not authenticated' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || 'user';
    const isAdmin = API_ADMIN_ROLES.includes(role as any);
    const isPlatformOperator = role === 'admin' || role === 'admin';

    return NextResponse.json({
      isAdmin,
      isPlatformOperator,
      role,
      userId: user.id,
      reason: isAdmin ? 'ok' : role === 'user' ? 'profile_missing_or_default' : 'role_denied',
    });
  } catch (error) {
    logger.error('Admin check error:', error);
    return NextResponse.json({ isAdmin: false, error: 'Check failed' });
  }
}
export const GET = withApiAudit('/api/auth/check-admin', _GET);
