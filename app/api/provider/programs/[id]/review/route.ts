// POST /api/provider/programs/[id]/review
// Admin/staff approves or rejects a provider program submission.
// On approval, sets programs.is_published = true.
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAuditEvent, AuditActions } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard({
    requireAuth: true,
    allowedRoles: ['admin', 'super_admin', 'staff'],
  });
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);

  if (!body?.decision || !['approved', 'rejected'].includes(body.decision)) {
    return NextResponse.json({ error: 'decision must be approved or rejected' }, { status: 400 });
  }

  const { decision, review_notes } = body;
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  // Fetch the approval record
  const { data: approval, error: fetchErr } = await db
    .from('provider_program_approvals')
    .select('id, program_id, tenant_id, status')
    .eq('id', id)
    .single();

  if (fetchErr || !approval) {
    return NextResponse.json({ error: 'Approval record not found' }, { status: 404 });
  }

  if (!['submitted', 'under_review'].includes(approval.status)) {
    return NextResponse.json(
      { error: `Cannot review an approval with status: ${approval.status}` },
      { status: 409 }
    );
  }

  // Update approval record
  const { data: updated, error: updateErr } = await db
    .from('provider_program_approvals')
    .update({
      status: decision,
      reviewed_by: auth.user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: review_notes ?? null,
    })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to update approval' }, { status: 500 });
  }

  // On approval: publish the program
  if (decision === 'approved') {
    const { error: publishErr } = await db
      .from('programs')
      .update({ is_published: true })
      .eq('id', approval.program_id);

    if (publishErr) {
      return NextResponse.json({ error: 'Approval recorded but failed to publish program' }, { status: 500 });
    }
  }

  await logAuditEvent({
    actor_user_id: auth.user.id,
    actor_role: auth.role ?? 'admin',
    action: AuditActions.UPDATE,
    entity: 'provider_program_approval',
    entity_id: id,
    before: { status: approval.status },
    after: { status: decision, review_notes },
    req,
  });

  return NextResponse.json({ success: true, approval: updated });
}
