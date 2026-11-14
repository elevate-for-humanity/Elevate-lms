import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireRoles } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await apiRequireRoles(request, ['admin', 'super_admin'], { adminOverride: false });
    if (auth.error) return auth.error;

    // Get target user ID from request
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Use admin client to revoke all sessions
    const adminSupabase = await requireAdminClient();

    // Sign out user from all devices
    const { error: signOutError } = await adminSupabase.auth.admin.signOut(userId);

    if (signOutError) {
      return NextResponse.json({ error: 'Failed to revoke sessions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `All sessions revoked for user ${userId}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: 'Internal server error' },
      { status: 500 },
    );
  }
}
export const POST = withApiAudit('/api/admin/revoke-all-sessions', _POST);
