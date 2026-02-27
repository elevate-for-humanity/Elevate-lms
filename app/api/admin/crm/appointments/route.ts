export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await db
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

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data, error } = await db
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
