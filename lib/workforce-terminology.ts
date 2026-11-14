import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * Workforce Development Terminology
 *
 * Standard terms used across Elevate for Humanity LMS
 * to align with WRG, WIOA, JRI, EmployIndy, and DOL requirements
 */

export const WORKFORCE_TERMS = {
  // People
  STUDENT: 'Participant',
  LEARNER: 'Participant',
  TEACHER: 'Trainer',
  INSTRUCTOR: 'Instructor',
  PROGRAM_HOLDER: 'Training Provider',
  PARTNER: 'Worksite Partner',
  CASE_MANAGER: 'Career Coach',
  NAVIGATOR: 'Case Manager',

  // Training
  COURSE: 'Training Track',
  CLASS: 'Training Session',
  CLASS_TIME: 'Training Hours',
  LESSON: 'Module',
  COURSEWORK: 'Training Activities',

  // Status
  ENROLLED: 'Active',
  COMPLETED: 'Completed',
  DROPPED: 'Withdrawn',
  BEHIND: 'At Risk',
  NOT_ENGAGED: 'Not Engaged',
  ON_TRACK: 'On Track',

  // Documentation
  NOTES: 'Case Notes',
  PROGRESS_NOTE: 'Service Contact',
  FOLLOW_UP: 'Follow-Up Date',

  // Programs
  FUNDING_PROGRAM: 'Funding Program',
  WORKFORCE_PROGRAM: 'Workforce Development Program',
} as const;

/**
 * Convert internal status to workforce-friendly display text
 */
export function formatTrainingStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Active',
    completed: 'Completed',
    dropped: 'Withdrawn',
    expired: 'Expired',
    suspended: 'Suspended',
    refunded: 'Withdrawn',
  };
  return statusMap[status?.toLowerCase()] || status;
}

/**
 * Convert internal case status to workforce-friendly display text
 */
export function formatCaseStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'on track': 'On Track',
    behind: 'At Risk',
    dropped: 'Not Engaged',
  };
  return statusMap[status?.toLowerCase()] || status;
}

/**
 * Get status badge color class
 */
export function getTrainingStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    active: 'bg-blue-100 text-blue-800',
    withdrawn: 'bg-gray-100 text-gray-800',
    expired: 'bg-red-100 text-red-800',
    suspended: 'bg-yellow-100 text-yellow-800',
  };
  const formatted = formatTrainingStatus(status).toLowerCase();
  return colorMap[formatted] || 'bg-gray-100 text-gray-800';
}

/**
 * Get case status badge color class
 */
export function getCaseStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'on track': 'bg-green-100 text-green-800',
    'at risk': 'bg-yellow-100 text-yellow-800',
    'not engaged': 'bg-red-100 text-red-800',
  };
  const formatted = formatCaseStatus(status).toLowerCase();
  return colorMap[formatted] || 'bg-gray-100 text-gray-800';
}

/**
 * CSV Headers for workforce reports
 */
export const CSV_HEADERS = {
  USAGE_REPORT: [
    'participant_email',
    'training_track',
    'start_date',
    'training_minutes',
    'course_progress_percent',
    'training_status',
    'last_lms_login',
    'training_provider',
    'case_status',
    'most_recent_case_note',
  ],
  CASELOAD_REPORT: [
    'participant_email',
    'training_track',
    'funding_program',
    'training_status',
    'case_status',
    'most_recent_case_note',
    'last_note_at',
    'training_provider',
  ],
} as const;

/**
 * Email templates for workforce communications
 */
export const EMAIL_TEMPLATES = {
  LOGIN_REMINDER_SUBJECT: 'Reminder: Log in to your Elevate training this week',
  WEEKLY_CASELOAD_SUBJECT: (programName: string) => `Weekly Caseload Summary – ${programName}`,
  AT_RISK_SUBJECT: 'We noticed a pause in your Elevate training',
} as const;

/**
 * Monthly report template for funders
 */
export function generateMonthlyReportText(stats: {
  totalParticipants: number;
  programCount: number;
  activeParticipants: number;
  completions: number;
  atRisk: number;
  needingSupport: number;
}): string {
  return `During this reporting period, ${PLATFORM_DEFAULTS.orgName} served ${stats.totalParticipants} participants across ${stats.programCount} funded training programs (WRG, WIOA, JRI, EmployIndy, and other aligned initiatives).

${stats.activeParticipants} participants actively engaged in training and logged LMS activity during the month.

${stats.completions} participants successfully completed at least one training track and were issued verifiable digital certificates (with QR-coded verification and documented case notes).

${stats.atRisk} participants were flagged as At Risk (Behind) based on log-in and course progress thresholds, triggering outreach and follow-up from program holders and Elevate staff.

${stats.needingSupport} participants required additional support (schedule, transportation, or technology barriers) and are being monitored through weekly caseload reports and case notes in the Elevate system.

All participation, case notes, and follow-up actions are recorded in the ${PLATFORM_DEFAULTS.orgName} LMS and can be exported for state and federal workforce reporting, including WRG, WIOA, JRI, and local workforce board documentation.`;
}
