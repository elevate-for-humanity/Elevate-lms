import { logger } from '@/lib/logger';
/**
 * UI-3 Wage Matching Integration
 *
 * Integrates with Indiana DWD UI-3 system for automated wage verification.
 * UI-3 provides quarterly wage data for employment verification.
 */

import { createClient } from '@supabase/supabase-js';

export interface UI3WageRecord {
  ssn: string;
  quarter: string; // Format: YYYY-Q#
  employer_fein: string;
  employer_name: string;
  total_wages: number;
  hours_worked?: number;
  employment_start_date?: string;
  employment_end_date?: string;
}

export interface UI3MatchResult {
  student_id: string;
  enrollment_id: string;
  match_found: boolean;
  match_date: string;
  quarters_matched: UI3WageRecord[];
  employment_verified: boolean;
  wage_verified: boolean;
  notes?: string;
}

/**
 * Submit wage verification request to UI-3 system
 *
 * In production, this would connect to Indiana DWD's UI-3 API.
 * For now, this is a placeholder that logs the request.
 */
export async function submitUI3Request(
  students: Array<{
    student_id: string;
    ssn_last_4?: string;
    full_ssn?: string; // Encrypted, only for authorized requests
    enrollment_id: string;
    completion_date: string;
  }>
): Promise<{ request_id: string; status: string }> {
  // In production, this would:
  // 1. Encrypt SSNs
  // 2. Submit to DWD UI-3 API
  // 3. Receive request ID
  // 4. Poll for results

  logger.info('Submitting UI-3 wage match request:', {
    student_count: students.length,
    timestamp: new Date().toISOString(),
  });

  // Placeholder response
  return {
    request_id: `UI3-${Date.now()}`,
    status: 'pending',
  };
}

/**
 * Process UI-3 wage match results
 *
 * Updates employment_tracking table with verified wage data.
 */
export async function processUI3Results(
  results: UI3WageRecord[]
): Promise<UI3MatchResult[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error('Supabase not configured');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const matchResults: UI3MatchResult[] = [];

  for (const record of results) {
    // Find matching student by SSN
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('ssn_last_4', record.ssn.slice(-4))
      .single();

    if (!profile) continue;

    // Get enrollment for this student
    const { data: enrollment } = await supabase
      .from('program_enrollments')
      .select('id, completion_date')
      .eq('student_id', profile.id)
      .order('completion_date', { ascending: false })
      .limit(1)
      .single();

    if (!enrollment) continue;

    // Determine which quarter this is (2nd or 4th after completion)
    const completionDate = new Date(enrollment.completion_date);
    const recordQuarter = parseQuarter(record.quarter);
    const monthsAfterCompletion = getMonthsDifference(
      completionDate,
      recordQuarter
    );

    const is2ndQuarter =
      monthsAfterCompletion >= 4 && monthsAfterCompletion < 7;
    const is4thQuarter =
      monthsAfterCompletion >= 10 && monthsAfterCompletion < 13;

    // Update employment_tracking
    const updateData: any = {
      ui3_matched: true,
      ui3_match_date: new Date().toISOString(),
      ui3_quarterly_wages: record,
    };

    if (is2ndQuarter) {
      updateData.verified_2nd_quarter = true;
      updateData.verified_2nd_quarter_date = new Date().toISOString();
      updateData.wage_2nd_quarter = record.total_wages;
      updateData.employer_name = record.employer_name;
    }

    if (is4thQuarter) {
      updateData.verified_4th_quarter = true;
      updateData.verified_4th_quarter_date = new Date().toISOString();
      updateData.wage_4th_quarter = record.total_wages;
    }

    await supabase.from('employment_tracking').upsert({
      student_id: profile.id,
      enrollment_id: enrollment.id,
      ...updateData,
    });

    matchResults.push({
      student_id: profile.id,
      enrollment_id: enrollment.id,
      match_found: true,
      match_date: new Date().toISOString(),
      quarters_matched: [record],
      employment_verified: true,
      wage_verified: true,
    });
  }

  return matchResults;
}

/**
 * Schedule automated UI-3 wage matching
 *
 * Should run quarterly after each quarter ends.
 */
export async function scheduleUI3Matching() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all students who completed 6 months ago (for 2nd quarter check)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: students2nd } = await supabase
    .from('program_enrollments')
    .select('student_id, id, completion_date')
    .lte('completion_date', sixMonthsAgo.toISOString())
    .is('verified_2nd_quarter', null);

  // Get all students who completed 12 months ago (for 4th quarter check)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data: students4th } = await supabase
    .from('program_enrollments')
    .select('student_id, id, completion_date')
    .lte('completion_date', twelveMonthsAgo.toISOString())
    .is('verified_4th_quarter', null);

  logger.info('Automated UI-3 verification check:', {
    students_2nd_quarter: students2nd?.length || 0,
    students_4th_quarter: students4th?.length || 0,
  });

  // In production, submit these to UI-3 API
  // await submitUI3Request([...students2nd, ...students4th]);
}

/**
 * Helper: Parse quarter string to date
 */
function parseQuarter(quarter: string): Date {
  const [year, q] = quarter.split('-Q');
  const quarterNum = parseInt(q);
  const month = (quarterNum - 1) * 3;
  return new Date(parseInt(year), month, 1);
}

/**
 * Helper: Get months difference between dates
 */
function getMonthsDifference(date1: Date, date2: Date): number {
  const months = (date2.getFullYear() - date1.getFullYear()) * 12;
  return months + date2.getMonth() - date1.getMonth();
}

/**
 * Generate UI-3 compliance report
 */
export async function generateUI3Report() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error('Supabase not configured');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: tracking } = await supabase
    .from('employment_tracking')
    .select('*');

  const total = tracking?.length || 0;
  const ui3Matched = tracking?.filter((t) => t.ui3_matched).length || 0;
  const verified2nd =
    tracking?.filter((t) => t.verified_2nd_quarter).length || 0;
  const verified4th =
    tracking?.filter((t) => t.verified_4th_quarter).length || 0;

  return {
    total_records: total,
    ui3_matched: ui3Matched,
    ui3_match_rate: total > 0 ? ((ui3Matched / total) * 100).toFixed(1) : '0',
    verified_2nd_quarter: verified2nd,
    verified_4th_quarter: verified4th,
    verification_rate_2nd:
      total > 0 ? ((verified2nd / total) * 100).toFixed(1) : '0',
    verification_rate_4th:
      total > 0 ? ((verified4th / total) * 100).toFixed(1) : '0',
  };
}
