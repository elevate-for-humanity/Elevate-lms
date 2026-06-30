import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

type HourType = 'RTI' | 'OJT';
type FundingPhase = 'PRE_WIOA' | 'WIOA' | 'POST_CERT';
type EntryStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'LOCKED';

function weekStartISO(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // Monday-based
  date.setUTCDate(date.getUTCDate() - diff);
  return date.toISOString().slice(0, 10);
}

async function _POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // Get enrollment_id from body or auto-lookup from user's active enrollment
  let enrollment_id = body.enrollment_id;
  if (!enrollment_id) {
    const { data: autoEnrollment } = await supabase
      .from('student_enrollments')
      .select('id, student_id, program_id')
      .eq('student_id', user.id)
      .in('status', ['active', 'enrolled', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (autoEnrollment) {
      enrollment_id = autoEnrollment.id;
    }
  }

  // Verify user owns this enrollment (skip if no enrollment found — allow self-report without enrollment)
  if (enrollment_id) {
    const { data: enrollment, error: enrollErr } = await supabase
      .from('student_enrollments')
      .select('id, student_id, program_id')
      .eq('id', enrollment_id)
      .maybeSingle();

    if (!enrollErr && enrollment && enrollment.student_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Support both simple mode (hours_claimed + entry_date) and full mode (start_at + end_at)
  const entry_date = (body.entry_date as string) ?? new Date().toISOString().slice(0, 10);
  const hours_claimed_direct = body.hours_claimed ? Number(body.hours_claimed) : null;
  const start_at = body.start_at ? new Date(body.start_at) : null;
  const end_at = body.end_at ? new Date(body.end_at) : null;
  const hour_type = (body.hour_type as HourType) ?? 'OJT';
  const funding_phase = (body.funding_phase as FundingPhase) ?? 'PRE_WIOA';
  const lms_module_ref =
    (body.milady_module_ref as string) ?? (body.lms_module_ref as string) ?? null;
  const activity_note = (body.activity_note as string) ?? (body.notes as string) ?? null;
  const location_note = (body.location_note as string) ?? null;
  const program_holder_id = body.program_holder_id ?? null;
  // Self-report entries (source_type=learner_self_report) don't require explicit attestation
  const apprentice_attest = Boolean(body.apprentice_attest) || body.source_type === 'learner_self_report';

  // Validation
  if (!apprentice_attest) {
    return NextResponse.json({ error: 'Attestation required' }, { status: 400 });
  }

  // ── Additional hours validation for simple mode (learner_self_report) ───
  if (body.hours_claimed !== undefined && body.hours_claimed !== null) {
    const parsedHours = Number(body.hours_claimed);

    if (!Number.isFinite(parsedHours)) {
      return NextResponse.json({ error: 'Enter a valid number of hours' }, { status: 400 });
    }

    if (parsedHours < 0.5) {
      return NextResponse.json({ error: 'Minimum entry is 0.5 hours' }, { status: 400 });
    }

    if (parsedHours > 12) {
      return NextResponse.json({ error: 'Daily hour limit is 12 hours' }, { status: 400 });
    }

    if ((parsedHours * 2) % 1 !== 0) {
      return NextResponse.json({ error: 'Hours must be entered in 0.5 hour increments' }, { status: 400 });
    }
  }

  // ── Date validation ───
  const entryDate = String(body.entry_date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
    return NextResponse.json({ error: 'Enter a valid date' }, { status: 400 });
  }

  // ── Category with fallback ───
  const category = String(body.category || 'Other').trim() || 'Other';

  // ── Duplicate check: same date + same category for the same user ───
  if (!start_at && !end_at && body.hours_claimed !== undefined) {
    const { data: existingEntry, error: duplicateCheckError } = await supabase
      .from('hour_entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('work_date', entryDate)
      .eq('category', category)
      .limit(1)
      .maybeSingle();

    if (duplicateCheckError) {
      logger.error('[time entries] duplicate check failed', duplicateCheckError);
      return NextResponse.json({ error: 'Unable to validate time entry' }, { status: 500 });
    }

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Hours already submitted for this date and category' },
        { status: 409 },
      );
    }
  }

  // Full-mode: both start and end required
  if (start_at !== null || end_at !== null) {
    if (!start_at || !end_at || isNaN(start_at.getTime()) || isNaN(end_at.getTime())) {
      return NextResponse.json({ error: 'Invalid start/end times' }, { status: 400 });
    }
    if (end_at <= start_at) {
      return NextResponse.json({ error: 'End must be after start' }, { status: 400 });
    }
  } else if (!hours_claimed_direct || hours_claimed_direct <= 0) {
    return NextResponse.json({ error: 'hours_claimed or start_at/end_at required' }, { status: 400 });
  }
  if (!['RTI', 'OJT'].includes(hour_type)) {
    return NextResponse.json({ error: 'Invalid hour_type' }, { status: 400 });
  }
  if (!['PRE_WIOA', 'WIOA', 'POST_CERT'].includes(funding_phase)) {
    return NextResponse.json({ error: 'Invalid funding_phase' }, { status: 400 });
  }

  // Fetch apprentice funding profile (WIOA start + post-cert date) — non-fatal if missing
  let profile: { wioa_start_date: string | null; post_cert_date: string | null } | null = null;
  if (enrollment_id) {
    const { data: profData } = await supabase
      .from('apprentice_funding_profile')
      .select('wioa_start_date, post_cert_date')
      .eq('enrollment_id', enrollment_id)
      .maybeSingle();
    profile = profData ?? null;
  }

  const wioa_start_date = profile?.wioa_start_date ?? null; // YYYY-MM-DD
  const post_cert_date = profile?.post_cert_date ?? null;

  // Rule: WIOA hours cannot be logged before the WIOA start date
  if (funding_phase === 'WIOA') {
    if (!wioa_start_date) {
      return NextResponse.json(
        { error: 'WIOA start date not set for this enrollment' },
        { status: 400 },
      );
    }
    if (entry_date < wioa_start_date) {
      return NextResponse.json(
        { error: 'Cannot log WIOA hours before WIOA start date' },
        { status: 400 },
      );
    }
    if (post_cert_date && entry_date > post_cert_date) {
      return NextResponse.json(
        {
          error: 'WIOA hours cannot be logged after certificate/post-cert date',
        },
        { status: 400 },
      );
    }
  }

  // Rule: Post-cert should not be before post_cert_date (if set)
  if (funding_phase === 'POST_CERT' && post_cert_date && entry_date < post_cert_date) {
    return NextResponse.json(
      { error: 'POST_CERT hours cannot be logged before post-cert date' },
      { status: 400 },
    );
  }

  // Weekly caps (example policy)
  const week_start = weekStartISO(new Date(entry_date + 'T00:00:00Z'));
  const week_end = new Date(week_start + 'T00:00:00Z');
  week_end.setUTCDate(week_end.getUTCDate() + 7);
  const week_end_iso = week_end.toISOString().slice(0, 10);

  const { data: totals, error: totErr } = await supabase
    .from('hour_entries')
    .select('hours_claimed, source_type, category')
    .eq('user_id', user.id)
    .gte('work_date', week_start)
    .lt('work_date', week_end_iso);

  if (totErr) return NextResponse.json({ error: 'Operation failed' }, { status: 500 });

  // Convert hours to minutes for cap checks
  const existingMinutesTotal = (totals ?? []).reduce(
    (s, r) => s + (Number(r.hours_claimed) || 0) * 60,
    0,
  );
  const existingMinutesWioaRTI = (totals ?? [])
    .filter((r) => r.category === 'wioa' && r.source_type === 'rti')
    .reduce((s, r) => s + (Number(r.hours_claimed) || 0) * 60, 0);

  const newMinutes =
    start_at && end_at
      ? Math.max(1, Math.floor((end_at.getTime() - start_at.getTime()) / 60000))
      : Math.round((hours_claimed_direct ?? 0) * 60);

  const MAX_WEEKLY_TOTAL_MIN = 40 * 60;
  const MAX_WEEKLY_WIOA_RTI_MIN = 8 * 60; // adjust to your policy

  if (existingMinutesTotal + newMinutes > MAX_WEEKLY_TOTAL_MIN) {
    return NextResponse.json({ error: 'Weekly cap exceeded (40 hrs/week)' }, { status: 400 });
  }
  if (funding_phase === 'WIOA' && hour_type === 'RTI') {
    if (existingMinutesWioaRTI + newMinutes > MAX_WEEKLY_WIOA_RTI_MIN) {
      return NextResponse.json(
        { error: 'Weekly WIOA RTI cap exceeded (8 hrs/week)' },
        { status: 400 },
      );
    }
  }

  const newHours = newMinutes / 60;

  // ── Use validated parsedHours if in simple mode, otherwise use computed newHours ───
  const finalHours = body.hours_claimed !== undefined && body.hours_claimed !== null 
    ? Number(body.hours_claimed)
    : newHours;

  const { data: created, error: insErr } = await supabase
    .from('hour_entries')
    .insert({
      user_id: user.id,
      apprentice_application_id: null,
      source_type: body.source_type || 'learner_self_report',
      category: category,
      work_date: entryDate,
      hours_claimed: finalHours,
      entered_by_email: user.email || '',
      notes:
        [activity_note, location_note, lms_module_ref ? `LMS: ${lms_module_ref}` : null]
          .filter(Boolean)
          .join(' | ') || null,
      funding_phase: body.funding_phase || 'WIOA',
      status: 'pending',
      approval_status: 'pending',
    })
    .select('*')
    .maybeSingle();

  if (insErr) {
    logger.error('[time entries] insert failed', insErr);
    return NextResponse.json({ error: 'Unable to submit time entry' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, entry: created });
}

// GET: Fetch time entries for current user
async function _GET(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const supabase = await createClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const enrollment_id = searchParams.get('enrollment_id');
  const status = searchParams.get('status');
  const funding_phase = searchParams.get('funding_phase');

  let query = supabase
    .from('hour_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('work_date', { ascending: false });

  if (status) {
    query = query.eq('status', status.toLowerCase());
  }
  if (funding_phase) {
    query = query.eq('category', funding_phase.toLowerCase());
  }

  const { data, error } = await query;

  if (error) {
    logger.error('[time entries] GET failed', error);
    return NextResponse.json({ error: 'Unable to load time entries' }, { status: 500 });
  }
  return NextResponse.json({ entries: data });
}
export const GET = withApiAudit('/api/time/entries', _GET);
export const POST = withApiAudit('/api/time/entries', _POST);
