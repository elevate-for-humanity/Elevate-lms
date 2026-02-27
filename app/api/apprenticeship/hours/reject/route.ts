import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { hour_id, reason } = await req.json();

    if (!hour_id) {
      return NextResponse.json(
        { error: 'Hour ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to reject hours
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const { data: partnerUser } = await db
      .from('partner_users')
      .select('partner_id, role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = profile?.role && ['admin', 'super_admin'].includes(profile.role);
    const isPartner = !!partnerUser;

    if (!isAdmin && !isPartner) {
      return NextResponse.json(
        { error: 'Forbidden - requires admin or partner role' },
        { status: 403 }
      );
    }

    // Reject the hours
    const { error } = await db
      .from('training_hours')
      .update({
        status: 'rejected',
        rejected_by: user.id,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || null,
      })
      .eq('id', hour_id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to reject hours' },
        { status: 500 }
      );
    }

    // Log the rejection
    await db.from('audit_logs').insert({
      actor_id: user.id,
      action: 'hours_rejected',
      entity_type: 'training_hours',
      entity_id: hour_id,
      details: { reason },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: toErrorMessage(err) || 'Failed to reject hours' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/apprenticeship/hours/reject', _POST, { critical: true });
