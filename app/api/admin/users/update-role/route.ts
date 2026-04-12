// Update a user's role. Called by UserManagementTable.
// Accepts { userId, role } — delegates to the same logic as /api/admin/users/role
// but keyed on userId instead of email for direct table-row operations.
// Requires admin or super_admin.
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';

const VALID_ROLES = [
  'student', 'staff', 'instructor', 'admin', 'super_admin',
  'program_holder', 'employer', 'partner', 'mentor',
];

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: actor } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    // Only super_admin can promote to admin/super_admin
    if (['admin', 'super_admin'].includes(role) && actor.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super_admin can grant admin roles' }, { status: 403 });
    }

    const db = getAdminClient();
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
