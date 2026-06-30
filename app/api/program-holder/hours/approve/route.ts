/**
 * POST /api/program-holder/hours/approve
 *
 * Allows a program_holder to approve or reject pending OJL hour entries
 * that belong to their program. Admins and super_admins can approve any entry.
 *
 * Body: { hour_id: string, action: 'approve' | 'reject', rejection_reason?: string }
 *
 * Ownership check: hour_entries.program_holder_id must match the caller's
 * resolved program_holder_id. Admins bypass this check.
 *
 * On approve: sets status='approved', approved_by, approved_at, approved_by_role
 * On reject:  sets status='rejected', rejection_reason
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await request.json().catch(() => null);
    const { hour_id, action, rejection_reason } = body ?? {};

    if (!hour_id || !action) {
      return NextResponse.json({ error: 'hour_id and action are required' }, { status: 400 });
    }
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
    }
    if (action === 'reject' && !rejection_reason?.trim()) {
      return NextResponse.json({ error: 'rejection_reason is required when rejecting' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, program_holder_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['program_holder', 'admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isAdmin = ['admin', 'super_admin'].includes(profile.role);

    // Resolve program_holder_id — prefer profiles link, fall back to program_holders table
    let programHolderId: string | null = profile.program_holder_id ?? null;
    if (!programHolderId && !isAdmin) {
      const { data: fallback } = await supabase
        .from('program_holders')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      programHolderId = fallback?.id ?? null;
    }

    if (!programHolderId && !isAdmin) {
      return NextResponse.json({ error: 'Program holder record not found' }, { status: 403 });
    }

    // Load the hour entry
    const db = await requireAdminClient();
    const { data: hourEntry } = await db
      .from('hour_entries')
      .select('id, user_id, status, source_type, program_holder_id, hours_claimed')
      .eq('id', hour_id)
      .maybeSingle();

    if (!hourEntry) {
      return NextResponse.json({ error: 'Hour entry not found' }, { status: 404 });
    }

    if (hourEntry.status !== 'pending') {
      return NextResponse.json(
        { error: `Hour entry is already ${hourEntry.status}` },
        { status: 409 },
      );
    }

    // Ownership check — program_holder can only act on their own entries
    if (!isAdmin && hourEntry.program_holder_id !== programHolderId) {
      return NextResponse.json(
        { error: 'Forbidden — this entry does not belong to your program' },
        { status: 403 },
      );
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      const { error: updateErr } = await db
        .from('hour_entries')
        .update({
          status: 'approved',
          approved_by: user.email,
          approved_at: now,
          approved_by_role: profile.role,
        })
        .eq('id', hour_id)
        .eq('status', 'pending');

      if (updateErr) {
        logger.error('[program-holder/hours/approve] approve failed', updateErr);
        return NextResponse.json({ error: 'Failed to approve hours' }, { status: 500 });
      }
    } else {
      const { error: updateErr } = await db
        .from('hour_entries')
        .update({
          status: 'rejected',
          rejection_reason: rejection_reason.trim(),
          approved_by: user.email,
          approved_at: now,
          approved_by_role: profile.role,
        })
        .eq('id', hour_id)
        .eq('status', 'pending');

      if (updateErr) {
        logger.error('[program-holder/hours/approve] reject failed', updateErr);
        return NextResponse.json({ error: 'Failed to reject hours' }, { status: 500 });
      }
    }

    await auditLog({
      action: AuditAction.ENROLLMENT_UPDATED,
      entity: AuditEntity.ENROLLMENT,
      entityId: hour_id,
      actorId: user.id,
      metadata: {
        action,
        program_holder_id: programHolderId,
        role: profile.role,
        hours_claimed: hourEntry.hours_claimed,
        source_type: hourEntry.source_type,
        rejection_reason: action === 'reject' ? rejection_reason : undefined,
      },
    }).catch(() => {});

    return NextResponse.json({ ok: true, action, hour_id });
  } catch (err) {
    logger.error('[program-holder/hours/approve] Unexpected error', err as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/program-holder/hours/approve', _POST, { critical: true });
