import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { provisionPayPalSubscription } from '@/lib/billing/providers/paypal-subscriptions';

const Input = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject'), reason: z.string().trim().min(3).max(500) }),
]);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireRole(['admin', 'super_admin']);
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid review action.' }, { status: 400 });
  const { id } = await params;
  const db = await requireAdminClient();
  const { data: authorization, error } = await db
    .from('billing_migration_authorizations')
    .select('id,status,document_path,billing_schedule_id')
    .eq('id', id)
    .maybeSingle();
  if (error || !authorization)
    return NextResponse.json({ error: 'Authorization request not found.' }, { status: 404 });
  if (!authorization.document_path)
    return NextResponse.json(
      { error: 'A signed document must be uploaded before review.' },
      { status: 409 },
    );
  if (parsed.data.action === 'approve') {
    if (!authorization.billing_schedule_id)
      return NextResponse.json(
        { error: 'A replacement schedule must be linked before approval.' },
        { status: 409 },
      );
    const approved = await db
      .from('billing_migration_authorizations')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'submitted')
      .select('id')
      .maybeSingle();
    if (approved.error || !approved.data) {
      return NextResponse.json({ error: 'Authorization could not be approved.' }, { status: 500 });
    }
    const schedule = await db
      .from('billing_schedules')
      .select('*')
      .eq('id', authorization.billing_schedule_id)
      .single();
    if (schedule.error) {
      return NextResponse.json({ ok: true, status: 'approved', setupPending: true });
    }
    try {
      const paypal = await provisionPayPalSubscription(db, schedule.data);
      return NextResponse.json({
        ok: true,
        status: 'approved',
        setupPending: paypal.status !== 'active',
        approvalUrl: paypal.approvalUrl,
      });
    } catch {
      // The signed release stays approved. Admin can retry provider setup
      // without asking the learner to upload the same legal evidence again.
      return NextResponse.json({ ok: true, status: 'approved', setupPending: true });
    }
  }
  if (authorization.billing_schedule_id)
    await db
      .from('billing_schedules')
      .update({ status: 'paused', updated_at: new Date().toISOString() })
      .eq('id', authorization.billing_schedule_id);
  const rejected = await db
    .from('billing_migration_authorizations')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      rejection_reason: parsed.data.reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .in('status', ['submitted', 'rejected'])
    .select('id')
    .maybeSingle();
  if (rejected.error || !rejected.data)
    return NextResponse.json({ error: 'Authorization could not be rejected.' }, { status: 500 });
  return NextResponse.json({ ok: true, status: 'rejected' });
}
