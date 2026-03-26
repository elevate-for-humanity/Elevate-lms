
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
      .from('crm_follow_ups')
      .insert({
        contact_id: body.contact_id || null,
        assigned_to: user?.id,
        title: body.title,
        description: body.description || null,
        due_date: body.due_date || null,
        priority: body.priority || 'normal',
        follow_up_type: body.follow_up_type || 'call',
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    if (user) await logAdminAudit({ action: AdminAction.CRM_FOLLOWUP_CREATED, actorId: user.id, entityType: 'crm_follow_ups', entityId: data.id, metadata: { contact_id: body.contact_id }, req: request });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    logger.error('CRM follow-up creation failed', error as Error);
    return NextResponse.json({ error: 'Failed to create follow-up' }, { status: 500 });
  }
}

async function _PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id, status } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const supabase = await createClient();
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === 'completed') updates.completed_at = new Date().toISOString();

    const { error } = await supabase.from('crm_follow_ups').update(updates).eq('id', id);
    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) await logAdminAudit({ action: AdminAction.CRM_FOLLOWUP_UPDATED, actorId: user.id, entityType: 'crm_follow_ups', entityId: id, metadata: { new_status: status }, req: request });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('CRM follow-up update failed', error as Error);
    return NextResponse.json({ error: 'Failed to update follow-up' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/admin/crm/follow-ups', _POST);
export const PATCH = withApiAudit('/api/admin/crm/follow-ups', _PATCH);
