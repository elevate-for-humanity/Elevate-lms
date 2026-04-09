/**
 * Shared handler for apprentice hours logging across disciplines.
 * Used by cosmetology, nail-tech, and esthetician API routes.
 *
 * Validation rules (IPLA compliance):
 *   - Max 10 hours per calendar day (hard cap — IPLA audit standard)
 *   - No future-dated entries
 *   - No entries older than 14 days (prevents retroactive fraud)
 *   - Daily cap checked against existing approved + pending entries
 *   - Single entry max: 10h (matches daily cap)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

const MAX_HOURS_PER_DAY = 10;  // IPLA audit standard
const MAX_BACKDATE_DAYS = 14;  // Prevent retroactive fraud

export async function handleLogHours(request: NextRequest, discipline: string) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    const body = await request.json();
    const { date, hours, minutes = 0, category, notes } = body;

    // ── Field presence ────────────────────────────────────────────────────────
    if (!date) return safeError('Date is required', 400);
    if (hours === undefined || hours === null) return safeError('Hours are required', 400);

    const parsedHours   = parseFloat(hours);
    const parsedMinutes = parseInt(minutes, 10) || 0;

    if (isNaN(parsedHours) || parsedHours <= 0) {
      return safeError('Hours must be a positive number', 400);
    }

    if (parsedHours > MAX_HOURS_PER_DAY) {
      return safeError(`Cannot log more than ${MAX_HOURS_PER_DAY} hours in a single entry`, 400);
    }

    // ── Date validation ───────────────────────────────────────────────────────
    const entryDate = new Date(date);
    if (isNaN(entryDate.getTime())) return safeError('Invalid date format', 400);

    const today = new Date();
    today.setUTCHours(23, 59, 59, 999);

    if (entryDate > today) {
      return safeError('Cannot log hours for a future date', 400);
    }

    const oldestAllowed = new Date();
    oldestAllowed.setDate(oldestAllowed.getDate() - MAX_BACKDATE_DAYS);
    oldestAllowed.setUTCHours(0, 0, 0, 0);

    if (entryDate < oldestAllowed) {
      return safeError(
        `Cannot log hours more than ${MAX_BACKDATE_DAYS} days in the past. Contact your supervisor to correct older records.`,
        400
      );
    }

    // ── Daily cap enforcement ─────────────────────────────────────────────────
    const dateStr = entryDate.toISOString().split('T')[0];

    const { data: existingToday, error: existingErr } = await supabase
      .from('apprentice_hours')
      .select('hours')
      .eq('user_id', user.id)
      .eq('discipline', discipline)
      .eq('date', dateStr)
      .in('status', ['approved', 'pending']);

    if (existingErr) {
      logger.error(`[pwa/${discipline}/log-hours] daily cap query failed`, existingErr);
      return safeError('Failed to validate hours. Please try again.', 500);
    }

    const hoursAlreadyLogged = (existingToday ?? []).reduce((s, r) => s + (r.hours ?? 0), 0);
    const hoursAfterEntry    = hoursAlreadyLogged + parsedHours;

    if (hoursAfterEntry > MAX_HOURS_PER_DAY) {
      const remaining = Math.max(0, MAX_HOURS_PER_DAY - hoursAlreadyLogged);
      return safeError(
        remaining > 0
          ? `You have already logged ${hoursAlreadyLogged}h on this date. You can log up to ${remaining.toFixed(1)} more hours (${MAX_HOURS_PER_DAY}h daily maximum).`
          : `You have already reached the ${MAX_HOURS_PER_DAY}-hour daily maximum for this date.`,
        400
      );
    }

    // ── Insert ────────────────────────────────────────────────────────────────
    const totalMinutes = Math.round(parsedHours * 60 + parsedMinutes);

    const { error: insertErr } = await supabase
      .from('apprentice_hours')
      .insert({
        user_id:       user.id,
        discipline,
        date:          dateStr,
        hours:         parsedHours,
        minutes:       parsedMinutes,
        total_minutes: totalMinutes,
        category:      category || 'practical',
        notes:         notes?.trim() || null,
        status:        'pending',
        submitted_at:  new Date().toISOString(),
      });

    if (insertErr) {
      logger.error(`[pwa/${discipline}/log-hours] insert error`, insertErr);
      return safeError('Failed to save hours. Please try again.', 500);
    }

    logger.info(`[pwa/${discipline}/log-hours] hours logged`, {
      user_id:            user.id,
      date:               dateStr,
      hours:              parsedHours,
      discipline,
      daily_total_after:  hoursAfterEntry,
    });

    return NextResponse.json({
      success:        true,
      dailyTotal:     Math.round(hoursAfterEntry * 10) / 10,
      dailyRemaining: Math.max(0, Math.round((MAX_HOURS_PER_DAY - hoursAfterEntry) * 10) / 10),
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to log hours');
  }
}
