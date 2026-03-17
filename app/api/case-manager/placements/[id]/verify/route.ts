/**
 * POST /api/case-manager/placements/[id]/verify
 * Mark a placement as verified.
 * Auth: case_manager who owns the record, or admin/staff.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const ALLOWED_ROLES = ['case_manager', 'admin', 'super_admin', 'staff'];

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return safeError('Unauthorized', 401);

  const db = createAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!ALLOWED_ROLES.includes(profile?.role ?? '')) {
    return safeError('Forbidden', 403);
  }

  try {
    // Verify ownership unless admin
    const { data: placement } = await db
      .from('placement_records')
      .select('id, case_manager_id, status')
      .eq('id', id)
      .maybeSingle();

    if (!placement) return safeError('Placement not found', 404);

    const isAdmin = ['admin', 'super_admin', 'staff'].includes(profile?.role ?? '');
    if (!isAdmin && placement.case_manager_id !== user.id) {
      return safeError('Forbidden', 403);
    }

    if (placement.status === 'verified') {
      return safeError('Placement is already verified', 409);
    }

    const { error } = await db
      .from('placement_records')
      .update({
        status:      'verified',
        verified_at: new Date().toISOString(),
        verified_by: user.id,
        updated_at:  new Date().toISOString(),
      })
      .eq('id', id);

    if (error) return safeInternalError(error, 'POST /api/case-manager/placements/[id]/verify');

    return NextResponse.json({ success: true });
  } catch (err) {
    return safeInternalError(err, 'POST /api/case-manager/placements/[id]/verify');
  }
}
