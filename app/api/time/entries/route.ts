import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { toError, toErrorMessage } from '@/lib/safe';

type HourType = 'RTI' | 'OJT';
type FundingPhase = 'PRE_WIOA' | 'WIOA' | 'POST_CERT';
type EntryStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'LOCKED';

function weekStartISO(d: Date) {
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  const day = date.getUTCDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // Monday-based
  date.setUTCDate(date.getUTCDate() - diff);
  return date.toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // Get enrollment_id from body or look it up from user
  const enrollment_id = body.enrollment_id;
  if (!enrollment_id) {
    return NextResponse.json(
      { error: 'enrollment_id required' },
      { status: 400 }
    );
  }

  // Verify user owns this enrollment
  const { data: enrollment, error: enrollErr } = await supabase
    .from('student_enrollments')
    .select('id, student_id, program_id')
    .eq('id', enrollment_id)
    .single();

  if (enrollErr || !enrollment) {
    return NextResponse.json(
      { error: 'Enrollment not found' },
      { status: 404 }
    );
  }

  if (enrollment.student_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const start_at = new Date(body.start_at);
  const end_at = new Date(body.end_at);
  const entry_date =
    (body.entry_date as string) ?? start_at.toISOString().slice(0, 10);
  const hour_type = body.hour_type as HourType;
  const funding_phase = body.funding_phase as FundingPhase;
  const milady_module_ref = (body.milady_module_ref as string) ?? null;
  const activity_note = (body.activity_note as string) ?? null;
  const location_note = (body.location_note as string) ?? null;
  const program_holder_id = body.program_holder_id ?? null;
  const apprentice_attest = Boolean(body.apprentice_attest);

  // Validation
  if (!apprentice_attest) {
    return NextResponse.json(
      { error: 'Attestation required' },
      { status: 400 }
    );
  }
  if (
    !(start_at instanceof Date) ||
    !(end_at instanceof Date) ||
    isNaN(start_at.getTime()) ||
    isNaN(end_at.getTime())
  ) {
    return NextResponse.json(
      { error: 'Invalid start/end times' },
      { status: 400 }
    );
  }
  if (end_at <= start_at) {
    return NextResponse.json(
      { error: 'End must be after start' },
      { status: 400 }
    );
  }
  if (!['RTI', 'OJT'].includes(hour_type)) {
    return NextResponse.json({ error: 'Invalid hour_type' }, { status: 400 });
  }
  if (!['PRE_WIOA', 'WIOA', 'POST_CERT'].includes(funding_phase)) {
    return NextResponse.json(
      { error: 'Invalid funding_phase' },
      { status: 400 }
    );
  }

  // Fetch apprentice funding profile (WIOA start + post-cert date)
  const { data: profile, error: profErr } = await supabase
    .from('apprentice_funding_profile')
    .select('wioa_start_date, post_cert_date')
    .eq('enrollment_id', enrollment_id)
    .maybeSingle();

  if (profErr)
    return NextResponse.json({ error: profErr.message }, { status: 500 });

  const wioa_start_date = profile?.wioa_start_date ?? null; // YYYY-MM-DD
  const post_cert_date = profile?.post_cert_date ?? null;

  // Rule: WIOA hours cannot be logged before the WIOA start date
  if (funding_phase === 'WIOA') {
    if (!wioa_start_date) {
      return NextResponse.json(
        { error: 'WIOA start date not set for this enrollment' },
        { status: 400 }
      );
    }
    if (entry_date < wioa_start_date) {
      return NextResponse.json(
        { error: 'Cannot log WIOA hours before WIOA start date' },
        { status: 400 }
      );
    }
    if (post_cert_date && entry_date > post_cert_date) {
      return NextResponse.json(
        {
          error: 'WIOA hours cannot be logged after certificate/post-cert date',
        },
        { status: 400 }
      );
    }
  }

  // Rule: Post-cert should not be before post_cert_date (if set)
  if (
    funding_phase === 'POST_CERT' &&
    post_cert_date &&
    entry_date < post_cert_date
  ) {
    return NextResponse.json(
      { error: 'POST_CERT hours cannot be logged before post-cert date' },
      { status: 400 }
    );
  }

  // Weekly caps (example policy)
  const week_start = weekStartISO(new Date(entry_date + 'T00:00:00Z'));
  const week_end = new Date(week_start + 'T00:00:00Z');
  week_end.setUTCDate(week_end.getUTCDate() + 7);
  const week_end_iso = week_end.toISOString().slice(0, 10);

  const { data: totals, error: totErr } = await supabase
    .from('apprentice_hours_log')
    .select('minutes, hour_type, funding_phase')
    .eq('enrollment_id', enrollment_id)
    .gte('log_date', week_start)
    .lt('log_date', week_end_iso);

  if (totErr)
    return NextResponse.json({ error: totErr.message }, { status: 500 });

  const existingMinutesTotal = (totals ?? []).reduce(
    (s, r) => s + (r.minutes ?? 0),
    0
  );
  const existingMinutesWioaRTI = (totals ?? [])
    .filter((r) => r.funding_phase === 'WIOA' && r.hour_type === 'RTI')
    .reduce((s, r) => s + (r.minutes ?? 0), 0);

  const newMinutes = Math.max(
    1,
    Math.floor((end_at.getTime() - start_at.getTime()) / 60000)
  );

  const MAX_WEEKLY_TOTAL_MIN = 40 * 60;
  const MAX_WEEKLY_WIOA_RTI_MIN = 8 * 60; // adjust to your policy

  if (existingMinutesTotal + newMinutes > MAX_WEEKLY_TOTAL_MIN) {
    return NextResponse.json(
      { error: 'Weekly cap exceeded (40 hrs/week)' },
      { status: 400 }
    );
  }
  if (funding_phase === 'WIOA' && hour_type === 'RTI') {
    if (existingMinutesWioaRTI + newMinutes > MAX_WEEKLY_WIOA_RTI_MIN) {
      return NextResponse.json(
        { error: 'Weekly WIOA RTI cap exceeded (8 hrs/week)' },
        { status: 400 }
      );
    }
  }

  const { data: created, error: insErr } = await supabase
    .from('apprentice_hours_log')
    .insert({
      enrollment_id,
      program_holder_id,
      log_date: entry_date,
      start_at: start_at.toISOString(),
      end_at: end_at.toISOString(),
      hour_type,
      funding_phase,
      milady_module_ref,
      activity_note,
      location_note,
      apprentice_attest: true,
      status: 'SUBMITTED',
      submitted_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (insErr)
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, entry: created });
}

// GET: Fetch time entries for current user
export async function GET(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const enrollment_id = searchParams.get('enrollment_id');
  const status = searchParams.get('status');
  const funding_phase = searchParams.get('funding_phase');

  let query = supabase
    .from('apprentice_hours_log')
    .select(
      `
      *,
      student_enrollments!inner(student_id, program_id),
      program_holders(business_name, mentor_barber_name)
    `
    )
    .eq('student_enrollments.student_id', user.id)
    .order('log_date', { ascending: false });

  if (enrollment_id) {
    query = query.eq('enrollment_id', enrollment_id);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (funding_phase) {
    query = query.eq('funding_phase', funding_phase);
  }

  const { data, error } = await query;

  if (error)
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  return NextResponse.json({ entries: data });
}
