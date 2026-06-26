import { SupabaseClient } from '@supabase/supabase-js';
import { getApprovedHoursByType } from '../hours/get-approved-hours';

export interface PayrollEntry {
  userId: string;
  email: string;
  totalHours: number;
  wageRate: number;
  grossPay: number;
  periodStart: string;
  periodEnd: string;
}

/**
 * Payroll Engine - Foundation
 * Calculates gross pay based on approved OJL (On-the-Job Learning) hours.
 */
export async function calculateGrossPay(
  db: SupabaseClient,
  userId: string,
  periodStart: string,
  periodEnd: string
): Promise<PayrollEntry | null> {
  // 1. Fetch the user's profile to get their wage rate
  const { data: profile, error: profileErr } = await db
    .from('profiles')
    .select('email, base_wage_rate')
    .eq('id', userId)
    .single();

  if (profileErr || !profile) return null;

  const wageRate = profile.base_wage_rate || 15.00; // Default to $15/hr if not set

  // 2. Fetch approved hours for the period
  const { data: hours, error: hoursErr } = await db
    .from('hour_entries')
    .select('accepted_hours, hours_claimed')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .gte('work_date', periodStart)
    .lte('work_date', periodEnd);

  if (hoursErr || !hours) return null;

  const totalHours = hours.reduce((sum, row) => 
    sum + (Number(row.accepted_hours) || Number(row.hours_claimed) || 0), 0
  );

  return {
    userId,
    email: profile.email,
    totalHours,
    wageRate,
    grossPay: totalHours * wageRate,
    periodStart,
    periodEnd
  };
}

/**
 * TO DO: Integrate with Stripe Connect for automated payouts.
 * TO DO: Sync with QuickBooks using the existing lib/quickbooks-sync logic.
 */
