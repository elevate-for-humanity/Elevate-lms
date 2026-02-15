import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';

type Action = 'APPROVE' | 'REJECT' | 'LOCK';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return jsonError('Unauthorized', 401);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'SUBMITTED';
  const funding_phase = searchParams.get('funding_phase');
  const hour_type = searchParams.get('hour_type');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const userEmail = user.email;

  // Find program holders where this user is the mentor
  const { data: programHolders } = await supabase
    .from('program_holders')
    .select('id')
    .eq('email', userEmail);

  if (!programHolders || programHolders.length === 0) {
    return NextResponse.json({ entries: [] });
  }

  const holderIds = programHolders.map((ph) => ph.id);

  let q = supabase
    .from('apprentice_hours_log')
    .select(
      `
      id,
      enrollment_id,
      log_date,
      start_at,
      end_at,
      minutes,
      hour_type,
      funding_phase,
      status,
      milady_module_ref,
      activity_note,
      location_note,
      submitted_at,
      approved_at,
      approved_by,
      student_enrollments!inner(
        student_id,
        program_id,
        student_profile:profiles!student_id(
          id,
          full_name
        )
      ),
      program_holders(business_name, mentor_barber_name)
    `
    )
    .in('program_holder_id', holderIds)
    .eq('status', status)
    .order('log_date', { ascending: false })
    .order('start_at', { ascending: false });

  if (funding_phase) q = q.eq('funding_phase', funding_phase);
  if (hour_type) q = q.eq('hour_type', hour_type);
  if (from) q = q.gte('log_date', from);
  if (to) q = q.lte('log_date', to);

  const { data, error } = await q;
  if (error) return jsonError(toErrorMessage(error), 500);

  return NextResponse.json({ entries: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return jsonError('Unauthorized', 401);

  const body = await req.json();
  const action = body.action as Action;
  const entry_id = body.entry_id as string;
  const note = (body.note as string | undefined) ?? null;

  if (!entry_id) return jsonError('entry_id required');
  if (!['APPROVE', 'REJECT', 'LOCK'].includes(action))
    return jsonError('Invalid action');

  // Fetch entry + status first
  const { data: entry, error: readErr } = await supabase
    .from('apprentice_hours_log')
    .select('id,status')
    .eq('id', entry_id)
    .single();

  if (readErr) return jsonError(readErr.message, 500);
  if (!entry) return jsonError('Entry not found', 404);
  if (entry.status === 'LOCKED')
    return jsonError('Entry is locked and cannot be modified', 409);

  // Business rules:
  // - Approve/Reject only when SUBMITTED
  // - Lock only when APPROVED
  if (action === 'APPROVE' || action === 'REJECT') {
    if (entry.status !== 'SUBMITTED')
      return jsonError('Only SUBMITTED entries can be approved/rejected', 409);
  }
  if (action === 'LOCK') {
    if (entry.status !== 'APPROVED')
      return jsonError('Only APPROVED entries can be locked', 409);
  }

  const nextStatus =
    action === 'APPROVE'
      ? 'APPROVED'
      : action === 'REJECT'
        ? 'REJECTED'
        : 'LOCKED';

  const patch: Record<string, any> = {
    status: nextStatus,
    approved_by: user.id,
    approved_at: new Date().toISOString(),
    verified_by: user.email,
    verified_at: new Date().toISOString(),
  };

  const { data: updated, error: updErr } = await supabase
    .from('apprentice_hours_log')
    .update(patch)
    .eq('id', entry_id)
    .select('*')
    .single();

  if (updErr) return jsonError(updErr.message, 500);

  // Audit log: hours action
  const auditAction = action === 'APPROVE' ? AuditAction.HOURS_APPROVED 
    : action === 'REJECT' ? AuditAction.HOURS_REJECTED 
    : AuditAction.HOURS_VERIFIED;
  
  await auditLog({
    actorId: user.id,
    actorRole: 'program_holder',
    action: auditAction,
    entity: AuditEntity.HOURS,
    entityId: entry_id,
    metadata: {
      previous_status: entry.status,
      new_status: nextStatus,
      minutes: updated?.minutes,
      enrollment_id: updated?.enrollment_id,
    },
  });

  return NextResponse.json({ ok: true, entry: updated });
}
