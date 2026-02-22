
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

function csvEscape(data: any) {
  const s = String(v ?? '');
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'SUBMITTED';
  const funding_phase = searchParams.get('funding_phase');
  const hour_type = searchParams.get('hour_type');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const userEmail = user.email;

  // Find program holders where this user is the mentor
  const { data: programHolders } = await db
    .from('program_holders')
    .select('id')
    .eq('email', userEmail);

  if (!programHolders || programHolders.length === 0) {
    return new NextResponse('No entries found', { status: 404 });
  }

  const holderIds = programHolders.map((ph) => ph.id);

  let q = db
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
      student_enrollments!inner(
        student_id,
        student_profile:profiles!student_id(
          full_name
        )
      )
    `
    )
    .in('program_holder_id', holderIds)
    .eq('status', status)
    .order('log_date', { ascending: false });

  if (funding_phase) q = q.eq('funding_phase', funding_phase);
  if (hour_type) q = q.eq('hour_type', hour_type);
  if (from) q = q.gte('log_date', from);
  if (to) q = q.lte('log_date', to);

  const { data, error } = await q;
  if (error)
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });

  const rows = data ?? [];

  const header = [
    'apprentice_name',
    'enrollment_id',
    'entry_date',
    'start_at',
    'end_at',
    'minutes',
    'hours',
    'hour_type',
    'funding_phase',
    'status',
    'milady_module_ref',
    'activity_note',
  ];

  const lines = [
    header.join(','),
    ...rows.map((item: any) =>
      [
        r.student_enrollments?.student_profile?.full_name ?? '',
        r.enrollment_id,
        r.log_date,
        r.start_at,
        r.end_at,
        r.minutes,
        (r.minutes / 60).toFixed(2),
        r.hour_type,
        r.funding_phase,
        r.status,
        r.milady_module_ref ?? '',
        r.activity_note ?? '',
      ]
        .map(csvEscape)
        .join(',')
    ),
  ];

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="hours_export_${status}_${Date.now()}.csv"`,
    },
  });
}
