import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { searchParams } = new URL(request.url);
  const participantId = searchParams.get('participant_id');
  const status = searchParams.get('status');
  const componentType = searchParams.get('component_type');

  let query = db
    .from('fssa_program_components')
    .select(
      'id, participant_id, component_type, start_date, end_date, required_hours, completed_hours, status, provider_name, notes, created_at',
    )
    .order('start_date', { ascending: false });

  if (participantId) query = query.eq('participant_id', participantId);
  if (status) query = query.eq('status', status);
  if (componentType) query = query.eq('component_type', componentType);

  const { data, error } = await query;
  if (error) return safeDbError(error, 'Failed to fetch FSSA program components');

  return NextResponse.json({ components: data ?? [] });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.participant_id || !body?.component_type || !body?.start_date) {
    return safeError('participant_id, component_type, and start_date are required', 400);
  }

  const VALID_TYPES = [
    'job_search', 'job_search_training', 'vocational_training',
    'work_experience', 'community_service', 'education',
    'self_employment', 'job_retention', 'other',
  ];
  if (!VALID_TYPES.includes(body.component_type)) {
    return safeError(`component_type must be one of: ${VALID_TYPES.join(', ')}`, 400);
  }

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data, error } = await db
    .from('fssa_program_components')
    .insert({
      participant_id: body.participant_id,
      component_type: body.component_type,
      start_date: body.start_date,
      end_date: body.end_date ?? null,
      required_hours: body.required_hours ?? null,
      completed_hours: body.completed_hours ?? 0,
      status: body.status ?? 'active',
      provider_name: body.provider_name ?? null,
      notes: body.notes ?? null,
      assigned_by: auth.id,
    })
    .select('id')
    .maybeSingle();

  if (error) return safeDbError(error, 'Failed to create program component');
  return NextResponse.json({ success: true, id: data?.id });
}

export async function PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.id) return safeError('id is required', 400);

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const allowed = [
    'end_date', 'required_hours', 'completed_hours', 'status', 'provider_name', 'notes',
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) return safeError('No valid fields to update', 400);

  const { error } = await db
    .from('fssa_program_components')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', body.id);

  if (error) return safeDbError(error, 'Failed to update program component');
  return NextResponse.json({ success: true });
}
