// GET   /api/placements/[id]  — fetch single placement
// PATCH /api/placements/[id]  — update verification status or details
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAuditEvent, AuditActions } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard({
    requireAuth: true,
    allowedRoles: ['admin', 'super_admin', 'staff', 'case_manager', 'provider_admin'],
  });
  if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const { data, error } = await db
    .from('placement_records')
    .select(`
      *, 
      learner:profiles!learner_id(id, full_name, email),
      employer:employers!employer_id(id, business_name, contact_name, email),
      program:programs!program_id(id, title, slug)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Placement not found' }, { status: 404 });

  return NextResponse.json({ placement: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard({
    requireAuth: true,
    allowedRoles: ['admin', 'super_admin', 'staff', 'case_manager'],
  });
  if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Request body required' }, { status: 400 });

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const { data: existing } = await db
    .from('placement_records')
    .select('id, status')
    .eq('id', id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Placement not found' }, { status: 404 });

  // Allowed update fields
  const allowed = [
    'status', 'verification_source', 'verified_at', 'hourly_wage',
    'annual_salary', 'employed_q2', 'employed_q4', 'median_earnings_q2', 'notes',
  ];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  // Auto-set verified_by and verified_at on status → verified
  if (updates.status === 'verified' && !updates.verified_at) {
    updates.verified_at = new Date().toISOString();
    updates.verified_by = auth.user.id;
  }

  const { data: updated, error } = await db
    .from('placement_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update placement' }, { status: 500 });

  await logAuditEvent({
    actor_user_id: auth.user.id,
    actor_role: auth.role ?? 'staff',
    action: AuditActions.UPDATE,
    entity: 'placement_record',
    entity_id: id,
    before: { status: existing.status },
    after: updates,
    req,
  });

  return NextResponse.json({ success: true, placement: updated });
}
