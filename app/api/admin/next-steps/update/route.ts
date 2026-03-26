import { NextResponse } from 'next/server';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

type Payload = {
  id: string;
  patch: Record<string, any>;
};

async function _POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }
  const body = (await req.json()) as Payload;

  if (!body?.id || !body?.patch) {
    return NextResponse.json({ error: 'Missing id or patch' }, { status: 400 });
  }

  // Safety: only allow these fields to be updated
  const allowed = new Set([
    'inquiry_submitted',
    'inquiry_submitted_at',
    'icc_account_created',
    'icc_account_created_at',
    'workone_appointment_scheduled',
    'workone_appointment_date',
    'workone_appointment_time',
    'workone_location',
    'told_advisor_efh',
    'told_advisor_efh_at',
    'advisor_docs_uploaded',
    'advisor_docs_uploaded_at',
    'funding_status',
    'funding_type',
    'funding_status_updated_at',
    'efh_onboarding_call_completed',
    'efh_onboarding_call_date',
    'efh_onboarding_call_completed_at',
    'program_start_confirmed',
    'program_start_date',
    'program_start_confirmed_at',
    'staff_notes',
    'updated_at',
  ]);

  const patch: Record<string, any> = {};
  for (const [k, v] of Object.entries(body.patch)) {
    if (allowed.has(k)) patch[k] = v;
  }

  patch.updated_at = new Date().toISOString();

  // Resolve org scope from admin profile
  const { data: prof, error: profErr } = await adminClient
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profErr)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  if (!prof?.organization_id)
    return NextResponse.json(
      { error: 'No active organization found' },
      { status: 400 }
    );

  const { data, error } = await adminClient
    .from('student_next_steps')
    .update(patch)
    .eq('id', body.id)
    .eq('organization_id', prof.organization_id)
    .select('*')
    .maybeSingle();

  if (error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

  await logAdminAudit({ action: AdminAction.NEXT_STEPS_UPDATED, actorId: user.id, entityType: 'next_steps', entityId: body.id, metadata: {}, req: request });

  return NextResponse.json({ ok: true, row: data });
}
export const POST = withApiAudit('/api/admin/next-steps/update', _POST);
