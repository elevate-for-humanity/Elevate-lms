
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('crm_deals')
      .insert({
        title: body.title,
        company_name: body.company_name,
        contact_id: body.contact_id || null,
        value: body.value || 0,
        stage: body.stage || 'lead',
        probability: body.probability || 50,
        expected_close_date: body.expected_close_date || null,
        assigned_to: user?.id,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    if (user) await logAdminAudit({ action: AdminAction.CRM_DEAL_CREATED, actorId: user.id, entityType: 'crm_deals', entityId: data.id, metadata: { company: body.company_name, stage: body.stage }, req: request });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    logger.error('CRM deal creation failed', error as Error);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_deals')
    .select('*, contact:crm_contacts(id, first_name, last_name, company)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }

  return NextResponse.json({ data });
}
export const GET = withApiAudit('/api/admin/crm/deals', _GET);
export const POST = withApiAudit('/api/admin/crm/deals', _POST);
