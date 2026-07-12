import 'server-only';
/**
 * sync-to-hour-entries.ts
 *
 * Bridges progress_entries (timeclock) → hour_entries (OJL pipeline).
 *
 * Called on every clock-out. Creates or updates the corresponding
 * hour_entries row so OJL totals, dashboards, RAPIDS, and compliance
 * all reflect real worked hours immediately.
 *
 * Idempotent: uses progress_entry_id as the dedup key. Safe to call
 * multiple times for the same shift (e.g. on auto-clock-out retry).
 */

import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface SyncResult {
  hourEntryId: string;
  created: boolean;
  hoursWorked: number;
}

/**
 * Sync a completed progress_entries row into hour_entries.
 *
 * @param db         Admin Supabase client (bypasses RLS)
 * @param entryId    progress_entries.id
 */
export async function syncProgressEntryToHourEntries(
  db: SupabaseClient,
  entryId: string,
): Promise<SyncResult | null> {
  // 1. Load the progress_entry with its apprentice + program context
  const { data: entry, error: entryErr } = await db
    .from('progress_entries')
    .select(`
      id,
      apprentice_id,
      program_id,
      site_id,
      work_date,
      week_ending,
      clock_in_at,
      clock_out_at,
      hours_worked,
      status,
      auto_clocked_out,
      hour_entry_id
    `)
    .eq('id', entryId)
    .maybeSingle();

  if (entryErr || !entry) {
    logger.error('[sync-to-hour-entries] progress_entry not found', entryErr, { entryId });
    return null;
  }

  if (!entry.clock_out_at || entry.hours_worked == null) {
    logger.warn('[sync-to-hour-entries] entry not complete — skipping', { entryId });
    return null;
  }

  const hoursWorked = Number(entry.hours_worked);
  if (hoursWorked <= 0) {
    logger.warn('[sync-to-hour-entries] zero hours — skipping', { entryId });
    return null;
  }

  // 2. Resolve apprentice → user_id + program_slug
  const { data: apprentice } = await db
    .from('apprentices')
    .select('id, user_id, employer_id, shop_id')
    .eq('id', entry.apprentice_id)
    .maybeSingle();

  if (!apprentice?.user_id) {
    logger.error('[sync-to-hour-entries] apprentice or user_id not found', undefined, { entryId, apprentice_id: entry.apprentice_id });
    return null;
  }

  // Resolve program_slug from program_id
  let programSlug = 'barber-apprenticeship';
  if (entry.program_id) {
    const { data: prog } = await db
      .from('programs')
      .select('slug')
      .eq('id', entry.program_id)
      .maybeSingle();
    if (prog?.slug) programSlug = prog.slug;
  } else {
    // Fall back to active enrollment
    const { data: enroll } = await db
      .from('program_enrollments')
      .select('program_slug')
      .eq('user_id', apprentice.user_id)
      .eq('enrollment_state', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (enroll?.program_slug) programSlug = enroll.program_slug;
  }

  // 3. Upsert hour_entries row keyed on progress_entry_id
  const workDate = entry.work_date ?? new Date(entry.clock_in_at).toISOString().slice(0, 10);
  const weekEnding = entry.week_ending ?? getWeekEnding(workDate);

  const hourEntryPayload = {
    user_id:            apprentice.user_id,
    program_slug:       programSlug,
    source_type:        'timeclock',
    source_entity_name: 'Timeclock',
    work_date:          workDate,
    week_ending:        weekEnding,
    hours_claimed:      hoursWorked,
    accepted_hours:     hoursWorked,
    hours:              hoursWorked,
    category:           'ojl',
    status:             entry.auto_clocked_out ? 'pending' : 'approved',
    approval_status:    entry.auto_clocked_out ? 'pending' : 'approved',
    progress_entry_id:  entry.id,
    entered_at:         new Date().toISOString(),
    entered_by_email:   'system@elevateforhumanity.org',
    notes:              entry.auto_clocked_out
      ? 'Auto-clocked out — pending admin review'
      : `Timeclock shift: ${entry.clock_in_at} – ${entry.clock_out_at}`,
  };

  // Check if an hour_entry already exists for this progress_entry
  const { data: existing } = await db
    .from('hour_entries')
    .select('id')
    .eq('progress_entry_id', entry.id)
    .maybeSingle();

  let hourEntryId: string;
  let created = false;

  if (existing?.id) {
    // Update hours in case of correction
    const { error: updateErr } = await db
      .from('hour_entries')
      .update({
        hours_claimed:   hoursWorked,
        accepted_hours:  hoursWorked,
        hours:           hoursWorked,
        status:          hourEntryPayload.status,
        approval_status: hourEntryPayload.approval_status,
        notes:           hourEntryPayload.notes,
      })
      .eq('id', existing.id);

    if (updateErr) {
      logger.error('[sync-to-hour-entries] update failed', updateErr, { entryId });
      return null;
    }
    hourEntryId = existing.id;
  } else {
    const { data: inserted, error: insertErr } = await db
      .from('hour_entries')
      .insert(hourEntryPayload)
      .select('id')
      .single();

    if (insertErr || !inserted) {
      logger.error('[sync-to-hour-entries] insert failed', insertErr, { entryId });
      return null;
    }
    hourEntryId = inserted.id;
    created = true;
  }

  // 4. Back-link progress_entry → hour_entry
  await db
    .from('progress_entries')
    .update({ hour_entry_id: hourEntryId })
    .eq('id', entry.id);

  logger.info('[sync-to-hour-entries] synced', {
    entryId,
    hourEntryId,
    created,
    hoursWorked,
    userId: apprentice.user_id,
    programSlug,
  });

  return { hourEntryId, created, hoursWorked };
}

/** Returns the Saturday of the week containing the given date (ISO YYYY-MM-DD). */
function getWeekEnding(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay(); // 0=Sun, 6=Sat
  const daysToSat = (6 - day + 7) % 7;
  d.setDate(d.getDate() + daysToSat);
  return d.toISOString().slice(0, 10);
}
