import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  await requireAdmin();

  try {
    const body = await request.json();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: roleProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (!roleProfile || !['admin', 'staff'].includes(roleProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = await requireAdminClient();
    const { data, error } = await db
      .from('crm_deals')
      .insert({
        title: body.title,
        company_name: body.company_name,
        contact_id: body.contact_id || null,
        value: body.value || 0,
        stage: body.stage || 'lead',
        probability: body.probability || 50,
        expected_close_date: body.expected_close_date || null,
        assigned_to: user.id,
        notes: body.notes || null,
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    await logAdminAudit({
      action: AdminAction.CRM_DEAL_CREATED,
      actorId: user.id,
      entityType: 'crm_deals',
      entityId: data.id,
      metadata: { company: body.company_name, stage: body.stage },
      req: request,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    logger.error('CRM deal creation failed', error as Error);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from('crm_deals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }

  const contactIds = [...new Set((data ?? []).map((deal) => deal.contact_id).filter(Boolean))];
  const contacts = contactIds.length
    ? await supabase
        .from('crm_contacts')
        .select('id, first_name, last_name, company')
        .in('id', contactIds)
    : { data: [], error: null };
  if (contacts.error)
    return NextResponse.json({ error: 'Failed to fetch deal contacts' }, { status: 500 });
  const byId = new Map((contacts.data ?? []).map((contact) => [contact.id, contact]));
  return NextResponse.json({
    data: (data ?? []).map((deal) => ({ ...deal, contact: byId.get(deal.contact_id) ?? null })),
  });
}
export const GET = withApiAudit('/api/admin/crm/deals', _GET);
export const POST = withApiAudit('/api/admin/crm/deals', _POST);
