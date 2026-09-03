/**
 * TIERED ALERT SYSTEM
 *
 * Progressive warnings before enforcement actions
 * Gives program holders multiple chances to comply
 * Handles mass scale automatically
 *
 * Integrated with Indiana DWD compliance requirements:
 * - ETPL reporting schedules
 * - WIOA performance standards
 * - WorkOne partnership requirements
 * - Workforce Ready Grant requirements
 */

import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  INDIANA_REPORTING_SCHEDULES,
  INDIANA_ALERT_TRIGGERS,
  INDIANA_EMAIL_TEMPLATES,
  type IndianaReportType,
} from './indiana-compliance';

export type AlertLevel = 'info' | 'reminder' | 'warning' | 'urgent' | 'critical' | 'final';
export type AlertChannel = 'email' | 'sms' | 'dashboard' | 'phone';

export interface Alert {
  id: string;
  programHolderId: string;
  level: AlertLevel;
  title: string;
  message: string;
  actionRequired: string;
  deadline: Date;
  channels: AlertChannel[];
  escalatesTo?: AlertLevel;
  escalationHours: number;
  sent: boolean;
  sentAt?: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
}

/**
 * PROGRESSIVE ALERT TIMELINE
 *
 * Example: Report due on Day 30
 * - Day 23: Info alert (7 days before)
 * - Day 27: Reminder (3 days before)
 * - Day 29: Warning (1 day before)
 * - Day 30: Urgent (due date)
 * - Day 31: Critical (1 day overdue)
 * - Day 33: Final warning (3 days overdue)
 * - Day 35: Auto-enforcement (5 days overdue)
 */

export interface AlertTimeline {
  daysBeforeDue: number; // Negative = overdue
  level: AlertLevel;
  channels: AlertChannel[];
  subject: string;
  template: string;
  requiresAcknowledgment: boolean;
  escalationHours: number; // Hours until next alert if not acknowledged
}

/**
 * CRITICAL REPORTS (State/Federal Submissions)
 */
export const CRITICAL_REPORT_ALERTS: AlertTimeline[] = [
  {
    daysBeforeDue: 7,
    level: 'info',
    channels: ['email', 'dashboard'],
    subject: 'Upcoming: {{report_name}} Due in 7 Days',
    template: 'critical_report_7day_info',
    requiresAcknowledgment: false,
    escalationHours: 72,
  },
  {
    daysBeforeDue: 3,
    level: 'reminder',
    channels: ['email', 'dashboard', 'sms'],
    subject: 'Reminder: {{report_name}} Due in 3 Days',
    template: 'critical_report_3day_reminder',
    requiresAcknowledgment: true,
    escalationHours: 48,
  },
  {
    daysBeforeDue: 1,
    level: 'warning',
    channels: ['email', 'dashboard', 'sms'],
    subject: '⚠️ Warning: {{report_name}} Due Tomorrow',
    template: 'critical_report_1day_warning',
    requiresAcknowledgment: true,
    escalationHours: 24,
  },
  {
    daysBeforeDue: 0,
    level: 'urgent',
    channels: ['email', 'dashboard', 'sms', 'phone'],
    subject: '🚨 URGENT: {{report_name}} Due TODAY',
    template: 'critical_report_due_today',
    requiresAcknowledgment: true,
    escalationHours: 12,
  },
  {
    daysBeforeDue: -1,
    level: 'critical',
    channels: ['email', 'dashboard', 'sms', 'phone'],
    subject: '🚨 CRITICAL: {{report_name}} OVERDUE - Action Required',
    template: 'critical_report_1day_overdue',
    requiresAcknowledgment: true,
    escalationHours: 24,
  },
  {
    daysBeforeDue: -3,
    level: 'final',
    channels: ['email', 'dashboard', 'sms', 'phone'],
    subject: '🚨 FINAL WARNING: {{report_name}} - Enforcement in 48 Hours',
    template: 'critical_report_final_warning',
    requiresAcknowledgment: true,
    escalationHours: 48,
  },
];

/**
 * HIGH PRIORITY REPORTS
 */
export const HIGH_PRIORITY_ALERTS: AlertTimeline[] = [
  {
    daysBeforeDue: 5,
    level: 'info',
    channels: ['email', 'dashboard'],
    subject: 'Upcoming: {{report_name}} Due in 5 Days',
    template: 'high_priority_5day_info',
    requiresAcknowledgment: false,
    escalationHours: 72,
  },
  {
    daysBeforeDue: 2,
    level: 'reminder',
    channels: ['email', 'dashboard'],
    subject: 'Reminder: {{report_name}} Due in 2 Days',
    template: 'high_priority_2day_reminder',
    requiresAcknowledgment: true,
    escalationHours: 48,
  },
  {
    daysBeforeDue: 0,
    level: 'urgent',
    channels: ['email', 'dashboard', 'sms'],
    subject: '⚠️ URGENT: {{report_name}} Due Today',
    template: 'high_priority_due_today',
    requiresAcknowledgment: true,
    escalationHours: 24,
  },
  {
    daysBeforeDue: -2,
    level: 'critical',
    channels: ['email', 'dashboard', 'sms'],
    subject: '🚨 {{report_name}} OVERDUE - Submit Immediately',
    template: 'high_priority_overdue',
    requiresAcknowledgment: true,
    escalationHours: 48,
  },
  {
    daysBeforeDue: -5,
    level: 'final',
    channels: ['email', 'dashboard', 'sms'],
    subject: 'FINAL NOTICE: {{report_name}} - Enforcement Pending',
    template: 'high_priority_final_warning',
    requiresAcknowledgment: true,
    escalationHours: 72,
  },
];

/**
 * PERFORMANCE ALERTS (Declining Metrics)
 */
export const PERFORMANCE_ALERTS: AlertTimeline[] = [
  {
    daysBeforeDue: 14,
    level: 'info',
    channels: ['email', 'dashboard'],
    subject: 'Performance Notice: {{metric_name}} Trending Down',
    template: 'performance_early_warning',
    requiresAcknowledgment: false,
    escalationHours: 168, // 7 days
  },
  {
    daysBeforeDue: 7,
    level: 'warning',
    channels: ['email', 'dashboard'],
    subject: '⚠️ Performance Warning: {{metric_name}} Below Threshold',
    template: 'performance_warning',
    requiresAcknowledgment: true,
    escalationHours: 168,
  },
  {
    daysBeforeDue: 0,
    level: 'critical',
    channels: ['email', 'dashboard', 'sms'],
    subject: '🚨 Performance Critical: Immediate Action Required',
    template: 'performance_critical',
    requiresAcknowledgment: true,
    escalationHours: 72,
  },
  {
    daysBeforeDue: -7,
    level: 'final',
    channels: ['email', 'dashboard', 'sms', 'phone'],
    subject: 'FINAL WARNING: Performance - Probation in 7 Days',
    template: 'performance_final_warning',
    requiresAcknowledgment: true,
    escalationHours: 168,
  },
];

/**
 * EMAIL TEMPLATES FOR ALERTS
 */
export const ALERT_EMAIL_TEMPLATES = {
  // CRITICAL REPORT - 7 DAYS
  critical_report_7day_info: {
    subject: 'Upcoming: {{report_name}} Due in 7 Days',
    body: `
Hi {{contact_name}},

This is a friendly reminder that your {{report_name}} is due in 7 days.

📅 DUE DATE: {{due_date}}
📋 REPORT: {{report_name}}
⏰ TIME REMAINING: 7 days

WHAT YOU NEED TO DO:
1. Log into your dashboard
2. Review pre-filled data
3. Add any missing information
4. Submit for approval

The system has already generated most of the report for you. You just need to review and submit.

[Complete Report Now] {{dashboard_link}}

Questions? Reply to this email or call ${PLATFORM_DEFAULTS.supportPhone}.

Thanks,
${PLATFORM_DEFAULTS.orgName} Compliance Team
    `,
  },

  // CRITICAL REPORT - 3 DAYS
  critical_report_3day_reminder: {
    subject: 'Reminder: {{report_name}} Due in 3 Days',
    body: `
Hi {{contact_name}},

Your {{report_name}} is due in 3 days. Please prioritize this.

📅 DUE DATE: {{due_date}} at 11:59 PM
📋 REPORT: {{report_name}}
⏰ TIME REMAINING: 3 days
⚠️ IMPORTANCE: Critical (State/Federal Submission)

CURRENT STATUS:
{{completion_status}}

ACTION REQUIRED:
Please acknowledge this email and confirm you're working on it.

[Complete Report Now] {{dashboard_link}}
[Acknowledge Receipt] {{acknowledge_link}}

⚠️ IMPORTANT: This report affects our master credentials. Late submission could impact all program holders in our network.

Need help? Contact us immediately:
Email: support@${PLATFORM_DEFAULTS.canonicalDomain}
Phone: ${PLATFORM_DEFAULTS.supportPhone}

${PLATFORM_DEFAULTS.orgName} Compliance Team
    `,
  },

  // CRITICAL REPORT - 1 DAY
  critical_report_1day_warning: {
    subject: '⚠️ Warning: {{report_name}} Due Tomorrow',
    body: `
Hi {{contact_name}},

⚠️ WARNING: Your {{report_name}} is due TOMORROW.

📅 DUE DATE: {{due_date}} at 11:59 PM
⏰ TIME REMAINING: Less than 24 hours
🚨 PRIORITY: URGENT

CURRENT STATUS:
{{completion_status}}

IF NOT SUBMITTED BY DEADLINE:
- New enrollments will be automatically restricted
- Account will be flagged for review
- May count as Strike 1 under MOU Section 8.3

SUBMIT NOW:
[Complete Report Immediately] {{dashboard_link}}

This is your final reminder before the deadline.

Need emergency assistance? Call ${PLATFORM_DEFAULTS.supportPhone} NOW.

${PLATFORM_DEFAULTS.orgName} Compliance Team
    `,
  },

  // CRITICAL REPORT - DUE TODAY
  critical_report_due_today: {
    subject: '🚨 URGENT: {{report_name}} Due TODAY',
    body: `
Hi {{contact_name}},

🚨 URGENT: Your {{report_name}} is DUE TODAY.

📅 DEADLINE: TODAY at 11:59 PM ({{hours_remaining}} hours remaining)
🚨 STATUS: URGENT - SUBMIT IMMEDIATELY

CURRENT STATUS:
{{completion_status}}

AUTOMATIC CONSEQUENCES IF NOT SUBMITTED:
✓ 11:59 PM Tonight: Report marked overdue
✓ Tomorrow Morning: New enrollments automatically blocked
✓ 3 Days Overdue: Account restricted
✓ 7 Days Overdue: Strike 1 issued

SUBMIT RIGHT NOW:
[Complete Report] {{dashboard_link}}

We're here to help. Call us if you need assistance:
${PLATFORM_DEFAULTS.supportPhone}

${PLATFORM_DEFAULTS.orgName} Compliance Team
    `,
  },

  // CRITICAL REPORT - 1 DAY OVERDUE
  critical_report_1day_overdue: {
    subject: '🚨 CRITICAL: {{report_name}} OVERDUE - Action Required',
    body: `
Hi {{contact_name}},

🚨 CRITICAL ALERT: Your {{report_name}} is now OVERDUE.

📅 WAS DUE: {{due_date}}
⏰ OVERDUE BY: 1 day
🚨 STATUS: CRITICAL

AUTOMATIC ACTIONS TAKEN:
✓ New enrollments have been BLOCKED
✓ Account flagged for compliance review
✓ Admin team has been notified

GRACE PERIOD: 48 hours to submit before Strike 1

SUBMIT IMMEDIATELY:
[Complete Report Now] {{dashboard_link}}

WHY THIS MATTERS:
This report goes to the state. Late submission jeopardizes our master credentials that you and all other program holders depend on.

RESTORE ACCESS:
Submit the report and access will be automatically restored within 1 hour.

Call us NOW if you need help:
${PLATFORM_DEFAULTS.supportPhone} (Emergency Line)

${PLATFORM_DEFAULTS.orgName} Compliance Team
    `,
  },

  // CRITICAL REPORT - FINAL WARNING
  critical_report_final_warning: {
    subject: '🚨 FINAL WARNING: {{report_name}} - Enforcement in 48 Hours',
    body: `
Hi {{contact_name}},

🚨 FINAL WARNING: This is your last notice before enforcement action.

📅 ORIGINAL DUE DATE: {{due_date}}
⏰ OVERDUE BY: {{days_overdue}} days
🚨 ENFORCEMENT IN: 48 hours

CURRENT RESTRICTIONS:
✓ New enrollments BLOCKED
✓ Account under compliance review
✓ Strike 1 pending

WHAT HAPPENS IN 48 HOURS IF NOT SUBMITTED:
✓ Strike 1 officially issued (MOU Section 8.3)
✓ Account placed on probation
✓ Weekly compliance calls required
✓ Additional restrictions may apply

SUBMIT IMMEDIATELY TO AVOID STRIKE:
[Complete Report Now] {{dashboard_link}}

MOU REFERENCE:
Section 6.3 - Timeliness Standards
Section 8.3 - Three Strike Policy

This is your FINAL opportunity to submit before formal enforcement.

Emergency Contact:
Phone: ${PLATFORM_DEFAULTS.supportPhone}
Email: compliance@${PLATFORM_DEFAULTS.canonicalDomain}

${PLATFORM_DEFAULTS.orgName} Compliance Team
    `,
  },

  // PERFORMANCE - EARLY WARNING
  performance_early_warning: {
    subject: 'Performance Notice: {{metric_name}} Trending Down',
    body: `
Hi {{contact_name}},

We've noticed your {{metric_name}} is trending downward. This is an early heads-up to help you course-correct.

📊 CURRENT: {{current_value}}
📉 TREND: Declining
⚠️ THRESHOLD: {{threshold_value}}
📅 REVIEW DATE: {{review_date}}

WHY THIS MATTERS:
If {{metric_name}} falls below {{threshold_value}}, your account may be placed on probation per MOU Section 7.

RECOMMENDATIONS:
{{improvement_recommendations}}

RESOURCES AVAILABLE:
- Best practices guide
- Peer benchmarking data
- Support call with success team

[View Detailed Report] {{dashboard_link}}
[Schedule Support Call] {{calendar_link}}

We're here to help you succeed. Let's address this early.

${PLATFORM_DEFAULTS.orgName} Success Team
    `,
  },

  // PERFORMANCE - WARNING
  performance_warning: {
    subject: '⚠️ Performance Warning: {{metric_name}} Below Threshold',
    body: `
Hi {{contact_name}},

⚠️ WARNING: Your {{metric_name}} has fallen below the required threshold.

📊 CURRENT: {{current_value}}
⚠️ REQUIRED: {{threshold_value}}
📉 GAP: {{gap_value}}
📅 REVIEW DATE: {{review_date}} ({{days_until_review}} days)

MOU REFERENCE:
Section 7 - Performance Standards

CONSEQUENCES IF NOT IMPROVED:
- Account placed on probation
- Weekly check-ins required
- Possible enrollment restrictions

ACTION PLAN:
1. Review performance report (attached)
2. Implement improvement strategies
3. Schedule call with success team
4. Show improvement by {{review_date}}

[View Performance Report] {{dashboard_link}}
[Schedule Support Call] {{calendar_link}}

We want you to succeed. Let's work together to improve these numbers.

${PLATFORM_DEFAULTS.orgName} Success Team
    `,
  },

  // PERFORMANCE - CRITICAL
  performance_critical: {
    subject: '🚨 Performance Critical: Immediate Action Required',
    body: `
Hi {{contact_name}},

🚨 CRITICAL: Your {{metric_name}} requires immediate attention.

📊 CURRENT: {{current_value}}
⚠️ REQUIRED: {{threshold_value}}
📉 GAP: {{gap_value}}
🚨 STATUS: Critical

MOU REFERENCE:
Section 7.2 - Minimum Performance Standards

AUTOMATIC ACTIONS:
✓ Account flagged for review
✓ Mandatory improvement plan required
✓ Weekly compliance calls scheduled

REQUIRED ACTIONS (Next 7 Days):
1. Submit improvement plan
2. Attend compliance call
3. Demonstrate progress

CONSEQUENCES IF NOT IMPROVED:
- Probation status
- Enrollment restrictions
- Possible Strike 1

[Submit Improvement Plan] {{dashboard_link}}
[View Support Resources] {{resources_link}}

Mandatory Call Scheduled:
📅 {{call_date}} at {{call_time}}
📞 We'll call you at {{phone_number}}

This is serious. Let's fix it together.

${PLATFORM_DEFAULTS.orgName} Compliance Team
    `,
  },

  // PERFORMANCE - FINAL WARNING
  performance_final_warning: {
    subject: 'FINAL WARNING: Performance - Probation in 7 Days',
    body: `
Hi {{contact_name}},

🚨 FINAL WARNING: Your {{metric_name}} has not improved. Probation in 7 days.

📊 CURRENT: {{current_value}}
⚠️ REQUIRED: {{threshold_value}}
⏰ TIME TO IMPROVE: 7 days

MOU REFERENCE:
Section 7.2 - Minimum Performance Standards
Section 8.3 - Three Strike Policy

WHAT HAPPENS IN 7 DAYS:
✓ Account placed on probation
✓ Strike 1 issued
✓ Enrollment restrictions
✓ Weekly compliance calls
✓ 90-day improvement period

LAST CHANCE TO AVOID PROBATION:
Show measurable improvement in the next 7 days.

REQUIRED ACTIONS:
1. Implement improvement plan immediately
2. Attend all scheduled calls
3. Submit weekly progress reports
4. Demonstrate commitment to improvement

[View Improvement Plan] {{dashboard_link}}
[Schedule Emergency Call] {{calendar_link}}

This is your final opportunity before formal probation.

Emergency Contact:
Phone: ${PLATFORM_DEFAULTS.supportPhone}
Email: compliance@${PLATFORM_DEFAULTS.canonicalDomain}

${PLATFORM_DEFAULTS.orgName} Compliance Team
    `,
  },
};

/**
 * MASS ALERT PROCESSING
 *
 * Handles sending alerts to hundreds of program holders efficiently
 */
export interface MassAlertJob {
  id: string;
  type: 'daily_check' | 'weekly_check' | 'monthly_check' | 'quarterly_check';
  scheduledFor: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalProgramHolders: number;
  alertsSent: number;
  errors: number;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * AUTOMATED DAILY CHECKS
 *
 * Runs every day at 6 AM to check all program holders
 */
export const DAILY_AUTOMATED_CHECKS = [
  'Check all upcoming deadlines (next 7 days)',
  'Check all overdue reports',
  'Check data quality scores',
  'Check for fraud indicators',
  'Check for safety violations',
  'Send appropriate alerts based on status',
  'Escalate critical issues to admin',
  'Auto-enforce policies where applicable',
  // Indiana-specific checks
  'Check Indiana ETPL renewal dates (90 days before expiration)',
  'Check Indiana student data submission deadlines',
  'Check Indiana federal reporting deadlines',
  'Check Indiana ETPL performance standards (employment rate, credential rate)',
  'Check Indiana WIOA performance measures',
  'Check Indiana data quality thresholds (90% complete)',
];

/**
 * BATCH PROCESSING CONFIGURATION
 */
export const BATCH_CONFIG = {
  batchSize: 50, // Process 50 program holders at a time
  delayBetweenBatches: 1000, // 1 second delay between batches
  maxConcurrent: 5, // Max 5 concurrent email sends
  retryAttempts: 3, // Retry failed sends 3 times
  retryDelay: 5000, // 5 seconds between retries
};

/**
 * HELPER FUNCTIONS
 */

export function getAlertTimeline(reportType: 'critical' | 'high' | 'performance'): AlertTimeline[] {
  switch (reportType) {
    case 'critical':
      return CRITICAL_REPORT_ALERTS;
    case 'high':
      return HIGH_PRIORITY_ALERTS;
    case 'performance':
      return PERFORMANCE_ALERTS;
  }
}

export function getNextAlert(
  daysUntilDue: number,
  reportType: 'critical' | 'high' | 'performance',
): AlertTimeline | null {
  const timeline = getAlertTimeline(reportType);

  // Find the next alert that should be sent
  const nextAlert = timeline.find((alert) => alert.daysBeforeDue <= daysUntilDue);

  return nextAlert || null;
}

export function shouldSendAlert(lastAlertSent: Date | null, nextAlert: AlertTimeline): boolean {
  if (!lastAlertSent) return true;

  const hoursSinceLastAlert = (Date.now() - lastAlertSent.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastAlert >= nextAlert.escalationHours;
}

export function formatEmailTemplate(template: string, variables: Record<string, string>): string {
  let formatted = template;

  Object.entries(variables).forEach(([key, value]) => {
    formatted = formatted.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  return formatted;
}

/**
 * INDIANA-SPECIFIC ALERT FUNCTIONS
 */

export function getIndianaAlertForReport(
  reportType: IndianaReportType,
  daysUntilDue: number,
): AlertTimeline | null {
  const schedule = INDIANA_REPORTING_SCHEDULES[reportType];

  // Determine alert level based on report type and days until due
  if (reportType === 'federal_reporting') {
    // Federal reporting is critical - immediate removal if late
    if (daysUntilDue <= 0) {
      return {
        daysBeforeDue: daysUntilDue,
        level: 'critical',
        channels: ['email', 'dashboard', 'sms', 'phone'],
        subject: 'URGENT: Indiana Federal Reporting Overdue - Immediate Removal',
        template: 'federal_reporting_overdue',
        requiresAcknowledgment: true,
        escalationHours: 0, // No escalation - immediate action
      };
    } else if (daysUntilDue <= 7) {
      return {
        daysBeforeDue: daysUntilDue,
        level: 'urgent',
        channels: ['email', 'dashboard', 'sms'],
        subject: 'Indiana Federal Reporting Due in {{days}} Days',
        template: 'federal_reporting_reminder',
        requiresAcknowledgment: true,
        escalationHours: 24,
      };
    }
  }

  if (reportType === 'student_data_submission') {
    // Student data submission - removal after 30 days
    if (daysUntilDue <= -30) {
      return {
        daysBeforeDue: daysUntilDue,
        level: 'critical',
        channels: ['email', 'dashboard', 'sms', 'phone'],
        subject: 'CRITICAL: Indiana Student Data 30+ Days Overdue - Removal Imminent',
        template: 'student_data_critical',
        requiresAcknowledgment: true,
        escalationHours: 0,
      };
    } else if (daysUntilDue <= 0) {
      return {
        daysBeforeDue: daysUntilDue,
        level: 'urgent',
        channels: ['email', 'dashboard', 'sms'],
        subject: 'URGENT: Indiana Student Data Submission Overdue',
        template: 'student_data_overdue',
        requiresAcknowledgment: true,
        escalationHours: 24,
      };
    } else if (daysUntilDue <= 7) {
      return {
        daysBeforeDue: daysUntilDue,
        level: 'reminder',
        channels: ['email', 'dashboard'],
        subject: 'Indiana Student Data Submission Due in {{days}} Days',
        template: 'student_data_submission_reminder',
        requiresAcknowledgment: false,
        escalationHours: 72,
      };
    }
  }

  if (reportType === 'etpl_renewal') {
    // ETPL renewal - program expires if not renewed
    if (daysUntilDue <= 0) {
      return {
        daysBeforeDue: daysUntilDue,
        level: 'critical',
        channels: ['email', 'dashboard', 'sms', 'phone'],
        subject: 'CRITICAL: Indiana ETPL Expired - Program Removed',
        template: 'etpl_expired',
        requiresAcknowledgment: true,
        escalationHours: 0,
      };
    } else if (daysUntilDue <= 30) {
      return {
        daysBeforeDue: daysUntilDue,
        level: 'urgent',
        channels: ['email', 'dashboard', 'sms'],
        subject: 'URGENT: Indiana ETPL Renewal Due in {{days}} Days',
        template: 'etpl_renewal_urgent',
        requiresAcknowledgment: true,
        escalationHours: 72,
      };
    } else if (daysUntilDue <= 90) {
      return {
        daysBeforeDue: daysUntilDue,
        level: 'reminder',
        channels: ['email', 'dashboard'],
        subject: 'Indiana ETPL Renewal Window Open',
        template: 'etpl_renewal_reminder',
        requiresAcknowledgment: false,
        escalationHours: 168, // 1 week
      };
    }
  }

  // Default to standard timeline for other report types
  if (daysUntilDue <= 0) {
    return {
      daysBeforeDue: daysUntilDue,
      level: 'urgent',
      channels: ['email', 'dashboard', 'sms'],
      subject: 'Indiana {{report_name}} Overdue',
      template: 'generic_overdue',
      requiresAcknowledgment: true,
      escalationHours: 24,
    };
  } else if (daysUntilDue <= 7) {
    return {
      daysBeforeDue: daysUntilDue,
      level: 'reminder',
      channels: ['email', 'dashboard'],
      subject: 'Indiana {{report_name}} Due in {{days}} Days',
      template: 'generic_reminder',
      requiresAcknowledgment: false,
      escalationHours: 72,
    };
  }

  return null;
}

export function checkIndianaPerformanceStandards(
  employmentRate: number,
  credentialRate: number,
  wageGain: number,
  enrollmentCount: number,
  dataQuality: number,
): {
  needsAlert: boolean;
  alertLevel: AlertLevel;
  failures: string[];
} {
  const failures: string[] = [];
  let alertLevel: AlertLevel = 'info';

  // Check employment rate
  if (employmentRate < 0.6) {
    failures.push(
      `Employment rate ${(employmentRate * 100).toFixed(1)}% critically below 70% standard`,
    );
    alertLevel = 'critical';
  } else if (employmentRate < 0.7) {
    failures.push(`Employment rate ${(employmentRate * 100).toFixed(1)}% below 70% standard`);
    alertLevel = alertLevel === 'critical' ? 'critical' : 'warning';
  }

  // Check credential rate
  if (credentialRate < 0.5) {
    failures.push(
      `Credential rate ${(credentialRate * 100).toFixed(1)}% critically below 60% standard`,
    );
    alertLevel = 'critical';
  } else if (credentialRate < 0.6) {
    failures.push(`Credential rate ${(credentialRate * 100).toFixed(1)}% below 60% standard`);
    alertLevel = alertLevel === 'critical' ? 'critical' : 'warning';
  }

  // Check wage gain
  if (wageGain < 0) {
    failures.push('Wage gain is negative');
    alertLevel = 'critical';
  }

  // Check enrollment
  if (enrollmentCount < 10) {
    failures.push(`Enrollment count ${enrollmentCount} below minimum 10`);
    alertLevel = alertLevel === 'critical' ? 'critical' : 'reminder';
  }

  // Check data quality
  if (dataQuality < 0.8) {
    failures.push(`Data quality ${(dataQuality * 100).toFixed(1)}% critically below 90% standard`);
    alertLevel = 'critical';
  } else if (dataQuality < 0.9) {
    failures.push(`Data quality ${(dataQuality * 100).toFixed(1)}% below 90% standard`);
    alertLevel = alertLevel === 'critical' ? 'critical' : 'reminder';
  }

  return {
    needsAlert: failures.length > 0,
    alertLevel,
    failures,
  };
}
