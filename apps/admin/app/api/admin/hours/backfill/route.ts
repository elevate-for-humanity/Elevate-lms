/**
 * POST /api/admin/hours/backfill
 *
 * Admin-only manual hours entry for apprenticeship progress_entries.
 *
 * Use case: a student could not sign in at all (login bug), so the timeclock
 * never recorded their shifts. An admin records the student-reported hours
 * after the fact. This is the ONLY manual-entry path: there was no admin
 * backfill route before this (the timeclock writes progress_entries, the
 * review queue only approves/rejects student-submitted rows).
 *
 * Body:
 *   {
 *     "student": { "phone": "(269) 479-5318" } | { "email": "..." } | { "user_id": "..." },
 *     "program_slug": "cosmetology-apprenticeship",   // optional; otherwise the apprentice record's program
 *     "source": "student-reported via text to Elizabeth, 2026-11-23",
 *     "entries": [
 *       { "work_date": "2026-11-19", "clock_in": "09:55", "clock_out": "17:35", "notes": "..." }
 *     ]
 *   }
 *
 * Rules: times are wall-clock in America/Indiana/Indianapolis; hours are
 * computed from the exact reported times with NO lunch deduction (none was
 * reported); work_date may not be in the future; rows are created verified
 * (the admin attests the student-reported hours) with the provenance in
 * notes; an existing progress_entries row for the same apprentice + program
 * + work_date fails the whole request (409) so a backfill can never
 * duplicate a timeclock row. No hours are ever invented here — entries come
 * only from the request body.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { getTimeclockWorkDate } from '@/lib/timeclock/work-date';
import {
  BACKFILL_TIME_ZONE,
  computeBackfillEntry,
  normalizePhoneDigits,
} from '@/lib/admin/hours-backfill.mjs';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_ENTRIES = 31;

type BackfillEntryInput = {
  work_date: string;
  clock_in: string;
  clock_out: string;
  notes?: string;
};

async function resolveStudentProfile(
  db: NonNullable<Awaited<ReturnType<typeof requireAdminClient>>>,
  student: { phone?: string; email?: string; user_id?: string },
) {
  if (student.user_id) {
    const { data, error } = await db
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('id', student.user_id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
  if (student.email) {
    const { data, error } = await db
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('email', student.email.toLowerCase().trim())
      .maybeSingle();
    if (error) throw error;
    return data;
  }
  if (student.phone) {
    const digits = normalizePhoneDigits(student.phone);
    if (digits.length < 10) return null;
    // Phone formatting varies ("(269) 479-5318", "+12694795318"); the last
    // four digits are contiguous in every common format, so filter on them
    // and confirm the full normalized number in code.
    const { data, error } = await db
      .from('profiles')
      .select('id, full_name, email, phone')
      .ilike('phone', `%${digits.slice(-4)}`)
      .limit(10);
    if (error) throw error;
    const matches = (data ?? []).filter(
      (row) => normalizePhoneDigits(row.phone).endsWith(digits),
    );
    if (matches.length > 1) throw new Error('AMBIGUOUS_PHONE');
    return matches[0] ?? null;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  let body: {
    student?: { phone?: string; email?: string; user_id?: string };
    program_slug?: string;
    source?: string;
    entries?: BackfillEntryInput[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const entries = body.entries ?? [];
  if (!body.student || entries.length === 0 || entries.length > MAX_ENTRIES) {
    return NextResponse.json(
      { error: 'student and 1-31 entries are required' },
      { status: 400 },
    );
  }
  const source = String(body.source ?? 'admin backfill of student-reported hours').slice(0, 500);

  // Resolve the student, then their apprentice record, then the program.
  let profile;
  try {
    profile = await resolveStudentProfile(db, body.student);
  } catch (error) {
    if (error instanceof Error && error.message === 'AMBIGUOUS_PHONE') {
      return NextResponse.json(
        { error: 'More than one profile matches that phone number; use email or user_id' },
        { status: 409 },
      );
    }
    logger.error('[hours/backfill] Student lookup failed', error);
    return NextResponse.json({ error: 'Student lookup failed' }, { status: 500 });
  }
  if (!profile) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const { data: apprentices, error: apprenticeError } = await db
    .from('apprentices')
    .select('id, user_id, program_id, status, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5);
  if (apprenticeError) {
    logger.error('[hours/backfill] Apprentice lookup failed', apprenticeError);
    return NextResponse.json({ error: 'Apprentice lookup failed' }, { status: 500 });
  }
  const apprentice =
    (apprentices ?? []).find((row) => row.status === 'active') ?? apprentices?.[0];
  if (!apprentice) {
    return NextResponse.json(
      { error: 'No apprentice record for this student; enroll them first' },
      { status: 404 },
    );
  }

  let programId: string | null = null;
  if (body.program_slug) {
    const { data: program, error: programError } = await db
      .from('programs')
      .select('id, slug')
      .eq('slug', body.program_slug)
      .maybeSingle();
    if (programError) {
      logger.error('[hours/backfill] Program lookup failed', programError);
      return NextResponse.json({ error: 'Program lookup failed' }, { status: 500 });
    }
    if (!program) {
      return NextResponse.json(
        { error: `Unknown program_slug: ${body.program_slug}` },
        { status: 400 },
      );
    }
    programId = program.id;
  } else {
    programId = apprentice.program_id;
  }
  if (!programId) {
    return NextResponse.json(
      { error: 'Program could not be resolved; pass program_slug' },
      { status: 400 },
    );
  }

  // Compute every row first; one bad entry fails the whole request.
  const today = getTimeclockWorkDate(new Date(), BACKFILL_TIME_ZONE);
  let computed;
  try {
    computed = entries.map((entry) => ({
      input: entry,
      row: computeBackfillEntry({
        workDate: entry.work_date,
        clockIn: entry.clock_in,
        clockOut: entry.clock_out,
      }),
    }));
    for (const { row } of computed) {
      if (row.work_date > today) {
        return NextResponse.json(
          { error: `work_date ${row.work_date} is in the future` },
          { status: 400 },
        );
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid entry' },
      { status: 400 },
    );
  }

  // Fail closed on duplicates: never double-count a shift the timeclock
  // (or an earlier backfill) already recorded.
  const workDates = computed.map(({ row }) => row.work_date);
  const { data: existing, error: existingError } = await db
    .from('progress_entries')
    .select('work_date')
    .eq('apprentice_id', apprentice.id)
    .eq('program_id', programId)
    .in('work_date', workDates);
  if (existingError) {
    logger.error('[hours/backfill] Duplicate check failed', existingError);
    return NextResponse.json({ error: 'Duplicate check failed' }, { status: 500 });
  }
  if (existing?.length) {
    return NextResponse.json(
      {
        error: 'Hours already recorded for these dates; refusing to duplicate',
        existing_work_dates: existing.map((row) => row.work_date),
      },
      { status: 409 },
    );
  }

  // Partner follows the apprentice's most recent entry for this program
  // (the timeclock stamps partner_id from the host shop); null when there
  // is no earlier entry.
  const { data: lastEntry } = await db
    .from('progress_entries')
    .select('partner_id')
    .eq('apprentice_id', apprentice.id)
    .eq('program_id', programId)
    .order('work_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  const partnerId = lastEntry?.partner_id ?? null;

  const now = new Date().toISOString();
  const rows = computed.map(({ input, row }) => ({
    apprentice_id: apprentice.id,
    partner_id: partnerId,
    program_id: programId,
    status: 'verified',
    work_date: row.work_date,
    week_ending: row.week_ending,
    hours_worked: row.hours_worked,
    clock_in_at: row.clock_in_at,
    clock_out_at: row.clock_out_at,
    tasks_completed:
      'Admin backfill — student-reported hours recorded while the student could not sign in.',
    notes: [
      `Admin backfill. Source: ${source}.`,
      `Student-reported ${input.clock_in}–${input.clock_out} (${BACKFILL_TIME_ZONE}).`,
      input.notes ? `Entry note: ${input.notes}` : null,
    ]
      .filter(Boolean)
      .join(' '),
    verified_by: auth.userId,
    verified_at: now,
  }));

  const { data: inserted, error: insertError } = await db
    .from('progress_entries')
    .insert(rows)
    .select('id, work_date, hours_worked');
  if (insertError || !inserted) {
    logger.error('[hours/backfill] Insert failed', insertError);
    return NextResponse.json({ error: 'Failed to record hours' }, { status: 500 });
  }

  const hoursTotal = Math.round(inserted.reduce((sum, row) => sum + Number(row.hours_worked), 0) * 100) / 100;
  await logAdminAudit({
    action: AdminAction.HOURS_BACKFILLED,
    actorId: auth.userId,
    entityType: 'progress_entries',
    entityId: apprentice.id,
    metadata: {
      student_user_id: profile.id,
      student_email: profile.email,
      program_id: programId,
      work_dates: workDates,
      hours_total: hoursTotal,
      source,
    },
    req: request,
  }).catch((error) => logger.warn('[hours/backfill] Audit log failed', error));

  logger.info('[hours/backfill] Hours recorded', {
    apprenticeId: apprentice.id,
    programId,
    workDates,
    hoursTotal,
    adminId: auth.userId,
  });

  return NextResponse.json(
    {
      ok: true,
      student: { user_id: profile.id, apprentice_id: apprentice.id, program_id: programId },
      hours_total: hoursTotal,
      inserted: inserted.map((row) => ({
        id: row.id,
        work_date: row.work_date,
        hours_worked: row.hours_worked,
      })),
    },
    { status: 201 },
  );
}
