/**
 * WIOA/ETPL Automated Reporting System
 *
 * Handles quarterly data submission to Indiana INTraining portal
 * and WIOA Title I performance measures.
 */

import { createClient } from '@supabase/supabase-js';
import { setAuditContext } from '@/lib/audit-context';

export interface StudentOutcomeData {
  student_id: string;
  ssn_last_4?: string;
  state_id?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  program_name: string;
  program_code: string;
  enrollment_date: string;
  completion_date?: string;
  credential_attained?: string;
  credential_date?: string;
  employment_status_at_exit?: 'employed' | 'unemployed' | 'not_in_labor_force';
  employer_name?: string;
  job_title?: string;
  wage_at_placement?: number;
  hours_per_week?: number;
  employment_date?: string;
  // Follow-up data
  employed_2nd_quarter?: boolean;
  wage_2nd_quarter?: number;
  employed_4th_quarter?: boolean;
  wage_4th_quarter?: number;
  // WIOA measures
  measurable_skill_gains?: boolean;
  skill_gain_type?: string;
}

export interface QuarterlyReport {
  quarter: string; // Q1, Q2, Q3, Q4
  year: number;
  start_date: string;
  end_date: string;
  due_date: string;
  students: StudentOutcomeData[];
  summary: {
    total_enrolled: number;
    total_completed: number;
    total_credentials: number;
    total_employed: number;
    average_wage: number;
    completion_rate: number;
    employment_rate: number;
    credential_rate: number;
  };
}

export interface WIOAPerformanceMetrics {
  reporting_period: string;
  employment_2nd_quarter: {
    numerator: number;
    denominator: number;
    rate: number;
  };
  employment_4th_quarter: {
    numerator: number;
    denominator: number;
    rate: number;
  };
  median_earnings_2nd_quarter: number;
  credential_attainment: {
    numerator: number;
    denominator: number;
    rate: number;
  };
  measurable_skill_gains: {
    numerator: number;
    denominator: number;
    rate: number;
  };
}

/**
 * Get quarter dates
 */
export function getQuarterDates(quarter: string, year: number) {
  const quarters = {
    Q1: { start: `${year}-07-01`, end: `${year}-09-30`, due: `${year}-10-31` },
    Q2: {
      start: `${year}-10-01`,
      end: `${year}-12-31`,
      due: `${year + 1}-01-31`,
    },
    Q3: {
      start: `${year + 1}-01-01`,
      end: `${year + 1}-03-31`,
      due: `${year + 1}-04-30`,
    },
    Q4: {
      start: `${year + 1}-04-01`,
      end: `${year + 1}-06-30`,
      due: `${year + 1}-07-31`,
    },
  };
  return quarters[quarter as keyof typeof quarters];
}

/**
 * Generate quarterly report
 */
export async function generateQuarterlyReport(
  quarter: string,
  year: number
): Promise<QuarterlyReport> {
  const dates = getQuarterDates(quarter, year);

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error('Supabase not configured');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  await setAuditContext(supabase, { systemActor: 'wioa_reporting' });

  // Get all students who enrolled or completed during quarter
  const { data: enrollments, error } = await supabase
    .from('program_enrollments')
    .select(
      `
      *,
      profiles!inner(first_name, last_name, date_of_birth),
      programs!inner(name, code)
    `
    )
    .or(
      `enrollment_date.gte.${dates.start},enrollment_date.lte.${dates.end},completion_date.gte.${dates.start},completion_date.lte.${dates.end}`
    )
    .order('enrollment_date', { ascending: true });

  if (error) throw error;

  const students: StudentOutcomeData[] = (enrollments || []).map((e: any) => ({
    student_id: e.student_id,
    first_name: e.profiles.first_name,
    last_name: e.profiles.last_name,
    date_of_birth: e.profiles.date_of_birth,
    program_name: e.programs.name,
    program_code: e.programs.code,
    enrollment_date: e.enrollment_date,
    completion_date: e.completion_date,
    credential_attained: e.credential_attained,
    credential_date: e.credential_date,
    employment_status_at_exit: e.employment_status_at_exit,
    employer_name: e.employer_name,
    job_title: e.job_title,
    wage_at_placement: e.wage_at_placement,
    hours_per_week: e.hours_per_week,
    employment_date: e.employment_date,
    employed_2nd_quarter: e.employed_2nd_quarter,
    wage_2nd_quarter: e.wage_2nd_quarter,
    employed_4th_quarter: e.employed_4th_quarter,
    wage_4th_quarter: e.wage_4th_quarter,
    measurable_skill_gains: e.measurable_skill_gains,
    skill_gain_type: e.skill_gain_type,
  }));

  // Calculate summary statistics
  const completed = students.filter((s) => s.completion_date);
  const withCredentials = students.filter((s) => s.credential_attained);
  const employed = students.filter(
    (s) => s.employment_status_at_exit === 'employed'
  );
  const wages = employed
    .filter((s) => s.wage_at_placement)
    .map((s) => s.wage_at_placement!);
  const avgWage =
    wages.length > 0 ? wages.reduce((a, b) => a + b, 0) / wages.length : 0;

  return {
    quarter,
    year,
    start_date: dates.start,
    end_date: dates.end,
    due_date: dates.due,
    students,
    summary: {
      total_enrolled: students.length,
      total_completed: completed.length,
      total_credentials: withCredentials.length,
      total_employed: employed.length,
      average_wage: avgWage,
      completion_rate:
        students.length > 0 ? (completed.length / students.length) * 100 : 0,
      employment_rate:
        completed.length > 0 ? (employed.length / completed.length) * 100 : 0,
      credential_rate:
        completed.length > 0
          ? (withCredentials.length / completed.length) * 100
          : 0,
    },
  };
}

/**
 * Export quarterly report to INTraining CSV format
 */
export function exportToINTrainingCSV(report: QuarterlyReport): string {
  const headers = [
    'Student ID',
    'SSN Last 4',
    'State ID',
    'First Name',
    'Last Name',
    'Date of Birth',
    'Program Name',
    'Program Code',
    'Enrollment Date',
    'Completion Date',
    'Credential Attained',
    'Credential Date',
    'Employment Status at Exit',
    'Employer Name',
    'Job Title',
    'Wage at Placement',
    'Hours Per Week',
    'Employment Date',
  ];

  const rows = report.students.map((s) => [
    s.student_id,
    s.ssn_last_4 || '',
    s.state_id || '',
    s.first_name,
    s.last_name,
    s.date_of_birth,
    s.program_name,
    s.program_code,
    s.enrollment_date,
    s.completion_date || '',
    s.credential_attained || '',
    s.credential_date || '',
    s.employment_status_at_exit || '',
    s.employer_name || '',
    s.job_title || '',
    s.wage_at_placement || '',
    s.hours_per_week || '',
    s.employment_date || '',
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

/**
 * Calculate WIOA Title I performance measures
 */
export async function calculateWIOAPerformance(
  startDate: string,
  endDate: string
): Promise<WIOAPerformanceMetrics> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error('Supabase not configured');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  await setAuditContext(supabase, { systemActor: 'wioa_reporting' });

  // Get all completers in the period
  const { data: completers } = await supabase
    .from('program_enrollments')
    .select('*')
    .gte('completion_date', startDate)
    .lte('completion_date', endDate)
    .not('completion_date', 'is', null);

  const total = completers?.length || 0;

  // Employment 2nd quarter after exit
  const employed2nd =
    completers?.filter((c) => c.employed_2nd_quarter).length || 0;

  // Employment 4th quarter after exit
  const employed4th =
    completers?.filter((c) => c.employed_4th_quarter).length || 0;

  // Median earnings 2nd quarter
  const wages2nd =
    completers
      ?.filter((c) => c.wage_2nd_quarter)
      .map((c) => c.wage_2nd_quarter)
      .sort((a, b) => a - b) || [];
  const medianEarnings =
    wages2nd.length > 0 ? wages2nd[Math.floor(wages2nd.length / 2)] : 0;

  // Credential attainment
  const withCredentials =
    completers?.filter((c) => c.credential_attained).length || 0;

  // Measurable skill gains
  const withSkillGains =
    completers?.filter((c) => c.measurable_skill_gains).length || 0;

  return {
    reporting_period: `${startDate} to ${endDate}`,
    employment_2nd_quarter: {
      numerator: employed2nd,
      denominator: total,
      rate: total > 0 ? (employed2nd / total) * 100 : 0,
    },
    employment_4th_quarter: {
      numerator: employed4th,
      denominator: total,
      rate: total > 0 ? (employed4th / total) * 100 : 0,
    },
    median_earnings_2nd_quarter: medianEarnings,
    credential_attainment: {
      numerator: withCredentials,
      denominator: total,
      rate: total > 0 ? (withCredentials / total) * 100 : 0,
    },
    measurable_skill_gains: {
      numerator: withSkillGains,
      denominator: total,
      rate: total > 0 ? (withSkillGains / total) * 100 : 0,
    },
  };
}

/**
 * Schedule follow-up for wage verification
 */
export async function scheduleWageFollowUp(enrollmentId: string) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('completion_date')
    .eq('id', enrollmentId)
    .single();

  if (!enrollment?.completion_date) return;

  const completionDate = new Date(enrollment.completion_date);

  // Schedule 2nd quarter follow-up (6 months after completion)
  const followUp2nd = new Date(completionDate);
  followUp2nd.setMonth(followUp2nd.getMonth() + 6);

  // Schedule 4th quarter follow-up (12 months after completion)
  const followUp4th = new Date(completionDate);
  followUp4th.setMonth(followUp4th.getMonth() + 12);

  await supabase.from('followup_schedule').insert([
    {
      enrollment_id: enrollmentId,
      follow_up_type: '2nd_quarter_employment',
      scheduled_date: followUp2nd.toISOString(),
      status: 'pending',
    },
    {
      enrollment_id: enrollmentId,
      follow_up_type: '4th_quarter_employment',
      scheduled_date: followUp4th.toISOString(),
      status: 'pending',
    },
  ]);
}

/**
 * Get upcoming reporting deadlines
 */
export function getUpcomingDeadlines(): Array<{
  quarter: string;
  year: number;
  due_date: string;
  days_until_due: number;
}> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const deadlines = [];

  for (let year = currentYear - 1; year <= currentYear + 1; year++) {
    for (const quarter of ['Q1', 'Q2', 'Q3', 'Q4']) {
      const dates = getQuarterDates(quarter, year);
      const dueDate = new Date(dates.due);
      const daysUntilDue = Math.ceil(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilDue > -30 && daysUntilDue < 90) {
        deadlines.push({
          quarter,
          year,
          due_date: dates.due,
          days_until_due: daysUntilDue,
        });
      }
    }
  }

  return deadlines.sort((a, b) => a.days_until_due - b.days_until_due);
}
