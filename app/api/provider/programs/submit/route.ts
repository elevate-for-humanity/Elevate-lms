// POST /api/provider/programs/submit
// provider_admin submits a program for Elevate review before it can be published.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAuditEvent, AuditActions } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard();

  const body = await req.json().catch(() => null);
  if (!body?.program_id) {
    return NextResponse.json({ error: 'program_id is required' }, { status: 400 });
  }

  const { program_id } = body;
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  // Verify the program belongs to the submitter's tenant
  const { data: program, error: programErr } = await db
    .from('programs')
    .select('id, title, tenant_id, is_published')
    .eq('id', program_id)
    .single();

  if (programErr || !program) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 });
  }

  // provider_admin can only submit their own tenant's programs
  if (auth.role === 'provider_admin' && program.tenant_id !== auth.profile?.tenant_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (program.is_published) {
    return NextResponse.json({ error: 'Program is already published' }, { status: 409 });
  }

  // Upsert approval record — idempotent, resets to submitted if previously rejected
  const { data: approval, error: approvalErr } = await db
    .from('provider_program_approvals')
    .upsert({
      tenant_id: program.tenant_id,
      program_id,
      status: 'submitted',
      submitted_by: auth.id,
      submitted_at: new Date().toISOString(),
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      program_snapshot: { title: program.title },
    }, { onConflict: 'tenant_id,program_id' })
    .select()
    .single();

  if (approvalErr) {
    return NextResponse.json({ error: 'Failed to submit program for review' }, { status: 500 });
  }

  await logAuditEvent({
    actor_user_id: auth.id,
    actor_role: auth.role ?? 'provider_admin',
    action: AuditActions.CREATE,
    entity: 'provider_program_approval',
    entity_id: approval.id,
    after: approval,
    req,
  });

  return NextResponse.json({ approval }, { status: 201 });
}
