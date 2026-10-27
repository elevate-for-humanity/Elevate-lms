// Update a user's role. Called by UserManagementTable.
// Accepts { userId, role } — delegates to the same logic as /api/admin/users/role
// but keyed on userId instead of email for direct table-row operations.
// Requires admin or admin.
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireRoles } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';

const VALID_ROLES = [
  'student',
  'staff',
  'instructor',
  'admin',
  'super_admin',
  'program_holder',
  'employer',
  'partner',
  'mentor',
];

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const actor = await apiRequireRoles(request, ['admin', 'super_admin'], { adminOverride: false });
    if (actor.error) return actor.error;

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 },
      );
    }

    // Only admin can promote to admin/admin
    if (['admin', 'super_admin'].includes(role) && !['admin', 'super_admin'].includes(actor.role ?? '')) {
      return NextResponse.json(
        { error: 'Only admin can grant admin roles' },
        { status: 403 },
      );
    }

    const db = await requireAdminClient();
    const { error } = await db
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      logger.error('update-role error:', error);
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('update-role handler error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/admin/users/update-role', _POST);
