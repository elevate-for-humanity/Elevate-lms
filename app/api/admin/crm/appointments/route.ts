
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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: _roleProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!_roleProfile || !['admin', 'super_admin', 'staff'].includes(_roleProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('crm_appointments')
      .insert({
        title: body.title,
        contact_id: body.contact_id || null,
        appointment_type: body.appointment_type || 'consultation',
        scheduled_at: body.scheduled_at,
        duration_minutes: body.duration_minutes || 30,
        location: body.location || null,
        assigned_to: user?.id,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    if (user) await logAdminAudit({ action: AdminAction.CRM_APPOINTMENT_CREATED, actorId: user.id, entityType: 'crm_appointments', entityId: data.id, metadata: { contact_id: body.contact_id }, req: request });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    logger.error('CRM appointment creation failed', error as Error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
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
    .from('crm_appointments')
    .select('*, contact:crm_contacts(id, first_name, last_name)')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }

  return NextResponse.json({ data });
}
export const GET = withApiAudit('/api/admin/crm/appointments', _GET);
export const POST = withApiAudit('/api/admin/crm/appointments', _POST);
