import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

async function notifyHourRejected(
  adminDb: any,
  params: {
    hourId: string;
    studentUserId: string;
    actorEmail: string | null;
    reason: string | null;
  },
) {
  const { hourId, studentUserId, actorEmail, reason } = params;

  await adminDb
    .from('notifications')
    .insert({
      user_id: studentUserId,
      type: 'hours',
      title: 'Hours rejected',
      message: reason
        ? `Your submitted hours were rejected: ${reason}`
        : 'Your submitted hours were rejected. Please review and resubmit.',
      action_label: 'View hours',
      action_url: '/apprentice/hours',
      link: '/apprentice/hours',
      read: false,
      metadata: {
        hour_id: hourId,
        action: 'rejected',
        decided_by: actorEmail,
        reason,
      },
      idempotency_key: `hours-rejected-learner-${hourId}-${studentUserId}`,
    })
    .catch(() => {});

  const { data: admins } = await adminDb
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'staff'])
    .limit(200);

  if (admins?.length) {
    const rows = admins.map((admin: { id: string }) => ({
      user_id: admin.id,
      type: 'hours',
      title: 'Hours rejected',
      message: `A student's hours were rejected by ${actorEmail || 'a reviewer'}.`,
      action_label: 'Review hours',
      action_url: '/admin/notifications',
      link: '/admin/notifications',
      read: false,
      metadata: {
        hour_id: hourId,
        student_user_id: studentUserId,
        action: 'rejected',
        decided_by: actorEmail,
        reason,
      },
      idempotency_key: `hours-rejected-admin-${hourId}-${admin.id}`,
    }));
    await adminDb.from('notifications').insert(rows).catch(() => {});
  }
}

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { hour_id, reason } = await req.json();

    if (!hour_id) {
      return NextResponse.json({ error: 'Hour ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to reject hours
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('partner_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    const isAdmin = profile?.role && ['admin'].includes(profile.role);
    const isPartner = !!partnerUser;

    if (!isAdmin && !isPartner) {
      return NextResponse.json(
        { error: 'Forbidden - requires admin or partner role' },
        { status: 403 },
      );
    }

    // Validate target hour entry and ownership scope
    const { data: hourEntry } = await supabase
      .from('hour_entries')
      .select('id, user_id, status')
      .eq('id', hour_id)
      .maybeSingle();

    if (!hourEntry) {
      return NextResponse.json({ error: 'Hour entry not found' }, { status: 404 });
    }

    if (hourEntry.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending hour entries can be rejected' }, { status: 400 });
    }

    if (isPartner) {
      const { data: apprenticeship } = await supabase
        .from('apprenticeships')
        .select('id')
        .eq('apprentice_id', hourEntry.user_id)
        .eq('partner_id', partnerUser!.partner_id)
        .maybeSingle();

      if (!apprenticeship) {
        return NextResponse.json(
          { error: 'Forbidden - can only reject hours for your own apprentices' },
          { status: 403 },
        );
      }
    }

    // Reject the hours
    const { error } = await supabase
      .from('hour_entries')
      .update({
        status: 'rejected',
        rejection_reason: reason || null,
        approved_by: user.email,
        approved_at: new Date().toISOString(),
        approved_by_role: profile?.role ?? null,
      })
      .eq('id', hour_id)
      .eq('status', 'pending');

    if (error) {
      return NextResponse.json({ error: 'Failed to reject hours' }, { status: 500 });
    }

    const adminDb = await requireAdminClient();
    if (adminDb) {
      await notifyHourRejected(adminDb, {
        hourId: hour_id,
        studentUserId: hourEntry.user_id,
        actorEmail: user.email ?? null,
        reason: reason || null,
      });
    }

    // Log the rejection
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'hours_rejected',
      entity_type: 'hour_entries',
      entity_id: hour_id,
      details: { reason },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: toErrorMessage(err) || 'Failed to reject hours' },
      { status: 500 },
    );
  }
}
export const POST = withApiAudit('/api/apprenticeship/hours/reject', _POST, { critical: true });
