import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Admin read-only queries for timeclock compliance monitoring
 */

export interface ActiveShift {
  id: string;
  apprentice_id: string;
  partner_id: string;
  site_id: string;
  clock_in_at: string;
  lunch_start_at: string | null;
  lunch_end_at: string | null;
  work_date: string;
}

export interface AutoClockOutEntry {
  id: string;
  apprentice_id: string;
  partner_id: string;
  site_id: string;
  clock_in_at: string;
  clock_out_at: string;
  auto_clock_out_reason: string;
  work_date: string;
  hours_worked: number;
}

export interface LunchViolation {
  id: string;
  apprentice_id: string;
  partner_id: string;
  work_date: string;
  clock_in_at: string;
  clock_out_at: string;
  lunch_start_at: string | null;
  lunch_end_at: string | null;
  hours_worked: number;
  violation_type: 'missing_lunch' | 'excessive_lunch';
  lunch_duration_minutes?: number;
}

export interface WeeklyCapWarning {
  apprentice_id: string;
  week_ending: string;
  total_hours: number;
  max_hours: number;
  percentage_used: number;
}

/**
 * Get all currently active shifts (clocked in but not out)
 */
export async function getActiveShifts(): Promise<ActiveShift[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('progress_entries')
    .select('id, apprentice_id, partner_id, site_id, clock_in_at, lunch_start_at, lunch_end_at, work_date')
    .not('clock_in_at', 'is', null)
    .is('clock_out_at', null)
    .order('clock_in_at', { ascending: false });

  if (error) {
    logger.error('[Timeclock Queries] getActiveShifts error:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all auto clock-out entries
 */
export async function getAutoClockOuts(
  options: { since?: string; limit?: number } = {}
): Promise<AutoClockOutEntry[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let query = supabase
    .from('progress_entries')
    .select('id, apprentice_id, partner_id, site_id, clock_in_at, clock_out_at, auto_clock_out_reason, work_date, hours_worked')
    .eq('auto_clocked_out', true)
    .order('clock_out_at', { ascending: false });

  if (options.since) {
    query = query.gte('clock_out_at', options.since);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('[Timeclock Queries] getAutoClockOuts error:', error);
    return [];
  }

  return data || [];
}

/**
 * Get lunch violations:
 * - Missing lunch after 6+ hours
 * - Lunch exceeding 60 minutes
 */
export async function getLunchViolations(
  options: { since?: string; limit?: number } = {}
): Promise<LunchViolation[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let query = supabase
    .from('progress_entries')
    .select('id, apprentice_id, partner_id, work_date, clock_in_at, clock_out_at, lunch_start_at, lunch_end_at, hours_worked')
    .not('clock_out_at', 'is', null)
    .gte('hours_worked', 6)
    .order('work_date', { ascending: false });

  if (options.since) {
    query = query.gte('work_date', options.since);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('[Timeclock Queries] getLunchViolations error:', error);
    return [];
  }

  const violations: LunchViolation[] = [];

  for (const entry of data || []) {
    // Missing lunch violation
    if (!entry.lunch_start_at) {
      violations.push({
        ...entry,
        violation_type: 'missing_lunch',
      });
      continue;
    }

    // Excessive lunch violation
    if (entry.lunch_start_at && entry.lunch_end_at) {
      const lunchStart = new Date(entry.lunch_start_at);
      const lunchEnd = new Date(entry.lunch_end_at);
      const lunchMinutes = (lunchEnd.getTime() - lunchStart.getTime()) / (1000 * 60);

      if (lunchMinutes > 60) {
        violations.push({
          ...entry,
          violation_type: 'excessive_lunch',
          lunch_duration_minutes: Math.round(lunchMinutes),
        });
      }
    }
  }

  return violations;
}

/**
 * Get weekly cap warnings (apprentices at 90%+ of max hours)
 */
export async function getWeeklyCapWarnings(): Promise<WeeklyCapWarning[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  // Get current week ending (Saturday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  const weekEnding = new Date(today);
  weekEnding.setDate(today.getDate() + daysUntilSaturday);
  const weekEndingStr = weekEnding.toISOString().split('T')[0];

  // Get all entries for current week grouped by apprentice
  const { data, error } = await supabase
    .from('progress_entries')
    .select('apprentice_id, hours_worked, max_hours_per_week, week_ending')
    .eq('week_ending', weekEndingStr)
    .not('hours_worked', 'is', null);

  if (error) {
    logger.error('[Timeclock Queries] getWeeklyCapWarnings error:', error);
    return [];
  }

  // Aggregate by apprentice
  const apprenticeHours: Record<string, { total: number; max: number }> = {};

  for (const entry of data || []) {
    if (!apprenticeHours[entry.apprentice_id]) {
      apprenticeHours[entry.apprentice_id] = {
        total: 0,
        max: entry.max_hours_per_week || 40,
      };
    }
    apprenticeHours[entry.apprentice_id].total += entry.hours_worked || 0;
  }

  // Filter to those at 90%+ capacity
  const warnings: WeeklyCapWarning[] = [];

  for (const [apprenticeId, hours] of Object.entries(apprenticeHours)) {
    const percentage = (hours.total / hours.max) * 100;
    if (percentage >= 90) {
      warnings.push({
        apprentice_id: apprenticeId,
        week_ending: weekEndingStr,
        total_hours: Math.round(hours.total * 100) / 100,
        max_hours: hours.max,
        percentage_used: Math.round(percentage * 10) / 10,
      });
    }
  }

  return warnings.sort((a, b) => b.percentage_used - a.percentage_used);
}

/**
 * Get daily hours summary for an apprentice
 */
export async function getApprenticeDailySummary(
  apprenticeId: string,
  startDate: string,
  endDate: string
): Promise<Array<{ work_date: string; total_hours: number; segments: number }>> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('progress_entries')
    .select('work_date, hours_worked')
    .eq('apprentice_id', apprenticeId)
    .gte('work_date', startDate)
    .lte('work_date', endDate)
    .not('hours_worked', 'is', null)
    .order('work_date', { ascending: true });

  if (error) {
    logger.error('[Timeclock Queries] getApprenticeDailySummary error:', error);
    return [];
  }

  // Aggregate by date
  const dailyTotals: Record<string, { total: number; segments: number }> = {};

  for (const entry of data || []) {
    if (!dailyTotals[entry.work_date]) {
      dailyTotals[entry.work_date] = { total: 0, segments: 0 };
    }
    dailyTotals[entry.work_date].total += entry.hours_worked || 0;
    dailyTotals[entry.work_date].segments += 1;
  }

  return Object.entries(dailyTotals).map(([date, data]) => ({
    work_date: date,
    total_hours: Math.round(data.total * 100) / 100,
    segments: data.segments,
  }));
}

/**
 * Get compliance dashboard summary
 */
export async function getComplianceSummary(): Promise<{
  active_shifts: number;
  auto_clock_outs_today: number;
  lunch_violations_week: number;
  weekly_cap_warnings: number;
}> {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const [activeShifts, autoClockOuts, lunchViolations, capWarnings] = await Promise.all([
    getActiveShifts(),
    getAutoClockOuts({ since: today }),
    getLunchViolations({ since: weekAgoStr }),
    getWeeklyCapWarnings(),
  ]);

  return {
    active_shifts: activeShifts.length,
    auto_clock_outs_today: autoClockOuts.length,
    lunch_violations_week: lunchViolations.length,
    weekly_cap_warnings: capWarnings.length,
  };
}
