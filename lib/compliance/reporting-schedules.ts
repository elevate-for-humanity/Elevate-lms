/**
 * COMPLIANCE REPORTING SCHEDULES
 *
 * Defines all mandatory reporting deadlines for program holders
 * Ensures nothing slips through the cracks
 */

export type ReportingFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
export type ReportingStatus = 'upcoming' | 'due_soon' | 'overdue' | 'submitted' | 'approved';
export type ComplianceLevel = 'critical' | 'high' | 'medium' | 'low';

export interface ReportingRequirement {
  id: string;
  name: string;
  description: string;
  frequency: ReportingFrequency;
  dueDay: number; // Day of month/quarter/year
  reminderDays: number[]; // Days before due date to send reminders
  gracePeriodDays: number; // Days after due date before escalation
  complianceLevel: ComplianceLevel;
  requiredFields: string[];
  autoGenerate: boolean; // Can system auto-generate this report?
  requiresApproval: boolean; // Does admin need to approve?
  submitsToState: boolean; // Does this go to state/federal?
}

/**
 * MONTHLY REPORTING SCHEDULE
 */
export const MONTHLY_REQUIREMENTS: ReportingRequirement[] = [
  {
    id: 'monthly_enrollment',
    name: 'Student Enrollment Report',
    description: 'All new student enrollments for the month',
    frequency: 'monthly',
    dueDay: 5, // Due by 5th of following month
    reminderDays: [7, 3, 1], // Remind 7, 3, and 1 day before
    gracePeriodDays: 2,
    complianceLevel: 'critical',
    requiredFields: [
      'student_id',
      'enrollment_date',
      'program_id',
      'funding_source',
      'eligibility_verified',
      'required_documents',
    ],
    autoGenerate: true,
    requiresApproval: true,
    submitsToState: true,
  },
  {
    id: 'monthly_progress',
    name: 'Student Progress Updates',
    description: 'Progress tracking for all active students',
    frequency: 'monthly',
    dueDay: 10,
    reminderDays: [5, 2, 1],
    gracePeriodDays: 3,
    complianceLevel: 'high',
    requiredFields: [
      'student_id',
      'completion_percentage',
      'attendance_rate',
      'current_status',
      'barriers_identified',
    ],
    autoGenerate: true,
    requiresApproval: false,
    submitsToState: false,
  },
  {
    id: 'monthly_attendance',
    name: 'Attendance Verification',
    description: 'Verify attendance for all enrolled students',
    frequency: 'monthly',
    dueDay: 15,
    reminderDays: [7, 3, 1],
    gracePeriodDays: 2,
    complianceLevel: 'critical',
    requiredFields: [
      'student_id',
      'days_present',
      'days_absent',
      'excused_absences',
      'attendance_percentage',
    ],
    autoGenerate: true,
    requiresApproval: false,
    submitsToState: true,
  },
  {
    id: 'monthly_outcomes',
    name: 'Outcome Data Submission',
    description: 'Employment outcomes and placements',
    frequency: 'monthly',
    dueDay: 20,
    reminderDays: [7, 3, 1],
    gracePeriodDays: 3,
    complianceLevel: 'critical',
    requiredFields: [
      'student_id',
      'completion_date',
      'employment_status',
      'employer_name',
      'wage',
      'placement_date',
      'related_to_training',
    ],
    autoGenerate: false, // Requires manual verification
    requiresApproval: true,
    submitsToState: true,
  },
  {
    id: 'monthly_financial',
    name: 'Financial Reconciliation',
    description: 'Reconcile all financial transactions',
    frequency: 'monthly',
    dueDay: 25,
    reminderDays: [5, 2, 1],
    gracePeriodDays: 2,
    complianceLevel: 'high',
    requiredFields: [
      'total_revenue',
      'funding_by_source',
      'expenses',
      'student_payments',
      'outstanding_balances',
    ],
    autoGenerate: true,
    requiresApproval: true,
    submitsToState: false,
  },
  {
    id: 'monthly_summary',
    name: 'Monthly Summary Report',
    description: 'Comprehensive monthly performance summary',
    frequency: 'monthly',
    dueDay: 30,
    reminderDays: [7, 3, 1],
    gracePeriodDays: 1,
    complianceLevel: 'high',
    requiredFields: [
      'total_enrollments',
      'total_completions',
      'total_placements',
      'completion_rate',
      'placement_rate',
      'average_wage',
    ],
    autoGenerate: true,
    requiresApproval: true,
    submitsToState: true,
  },
];

/**
 * QUARTERLY REPORTING SCHEDULE
 */
export const QUARTERLY_REQUIREMENTS: ReportingRequirement[] = [
  {
    id: 'quarterly_compliance',
    name: 'Compliance Self-Assessment',
    description: 'Review and certify compliance with all requirements',
    frequency: 'quarterly',
    dueDay: 15, // Due by 15th of first month of new quarter
    reminderDays: [14, 7, 3],
    gracePeriodDays: 5,
    complianceLevel: 'critical',
    requiredFields: [
      'data_quality_score',
      'reporting_timeliness',
      'student_satisfaction',
      'compliance_issues',
      'corrective_actions',
    ],
    autoGenerate: true,
    requiresApproval: true,
    submitsToState: false,
  },
  {
    id: 'quarterly_performance',
    name: 'Program Performance Review',
    description: 'Detailed analysis of program performance',
    frequency: 'quarterly',
    dueDay: 30,
    reminderDays: [14, 7, 3],
    gracePeriodDays: 5,
    complianceLevel: 'high',
    requiredFields: [
      'enrollment_trends',
      'completion_trends',
      'placement_trends',
      'wage_trends',
      'retention_rates',
      'program_improvements',
    ],
    autoGenerate: true,
    requiresApproval: true,
    submitsToState: true,
  },
  {
    id: 'quarterly_wioa',
    name: 'WIOA Quarterly Report',
    description: 'WIOA performance metrics and outcomes',
    frequency: 'quarterly',
    dueDay: 45, // Due 45 days after quarter end
    reminderDays: [21, 14, 7, 3],
    gracePeriodDays: 3,
    complianceLevel: 'critical',
    requiredFields: [
      'wioa_participants',
      'wioa_completions',
      'wioa_placements',
      'median_wage',
      'credential_attainment',
      'measurable_skill_gains',
    ],
    autoGenerate: true,
    requiresApproval: true,
    submitsToState: true,
  },
  {
    id: 'quarterly_etpl',
    name: 'ETPL Performance Report',
    description: 'Eligible Training Provider List performance data',
    frequency: 'quarterly',
    dueDay: 45,
    reminderDays: [21, 14, 7, 3],
    gracePeriodDays: 3,
    complianceLevel: 'critical',
    requiredFields: [
      'program_completion_rate',
      'employment_rate',
      'median_earnings',
      'credential_rate',
      'program_cost',
    ],
    autoGenerate: true,
    requiresApproval: true,
    submitsToState: true,
  },
];

/**
 * ANNUAL REPORTING SCHEDULE
 */
export const ANNUAL_REQUIREMENTS: ReportingRequirement[] = [
  {
    id: 'annual_outcomes',
    name: 'Annual Outcomes Report',
    description: 'Comprehensive annual performance and outcomes',
    frequency: 'annual',
    dueDay: 60, // Due 60 days after year end
    reminderDays: [45, 30, 14, 7],
    gracePeriodDays: 7,
    complianceLevel: 'critical',
    requiredFields: [
      'total_served',
      'total_completions',
      'total_placements',
      'average_wage',
      'retention_rates',
      'program_effectiveness',
      'demographic_data',
      'barrier_analysis',
    ],
    autoGenerate: true,
    requiresApproval: true,
    submitsToState: true,
  },
  {
    id: 'annual_audit',
    name: 'Annual Compliance Audit',
    description: 'Comprehensive compliance review and certification',
    frequency: 'annual',
    dueDay: 90,
    reminderDays: [60, 30, 14, 7],
    gracePeriodDays: 10,
    complianceLevel: 'critical',
    requiredFields: [
      'audit_findings',
      'compliance_score',
      'violations_identified',
      'corrective_actions',
      'certification_statement',
    ],
    autoGenerate: false,
    requiresApproval: true,
    submitsToState: true,
  },
];

/**
 * APPRENTICESHIP-SPECIFIC (If RAPIDS module enabled)
 */
export const APPRENTICESHIP_REQUIREMENTS: ReportingRequirement[] = [
  {
    id: 'rapids_monthly',
    name: 'RAPIDS Monthly Update',
    description: 'Update apprentice progress in RAPIDS system',
    frequency: 'monthly',
    dueDay: 10,
    reminderDays: [5, 2, 1],
    gracePeriodDays: 2,
    complianceLevel: 'critical',
    requiredFields: [
      'apprentice_id',
      'ojt_hours_completed',
      'rti_hours_completed',
      'current_wage',
      'status',
    ],
    autoGenerate: true,
    requiresApproval: false,
    submitsToState: true,
  },
  {
    id: 'rapids_quarterly',
    name: 'RAPIDS Quarterly Report',
    description: 'Quarterly apprenticeship performance to DOL',
    frequency: 'quarterly',
    dueDay: 30,
    reminderDays: [14, 7, 3],
    gracePeriodDays: 5,
    complianceLevel: 'critical',
    requiredFields: [
      'active_apprentices',
      'new_registrations',
      'completions',
      'cancellations',
      'average_completion_time',
    ],
    autoGenerate: true,
    requiresApproval: true,
    submitsToState: true,
  },
];

/**
 * ALERT SCHEDULE
 */
export interface AlertSchedule {
  daysBeforeDue: number;
  alertType: 'info' | 'warning' | 'critical';
  channels: ('email' | 'dashboard' | 'sms')[];
  escalateTo?: 'admin' | 'supervisor';
}

export const ALERT_SCHEDULES: Record<ComplianceLevel, AlertSchedule[]> = {
  critical: [
    {
      daysBeforeDue: 7,
      alertType: 'info',
      channels: ['email', 'dashboard'],
    },
    {
      daysBeforeDue: 3,
      alertType: 'warning',
      channels: ['email', 'dashboard', 'sms'],
    },
    {
      daysBeforeDue: 1,
      alertType: 'critical',
      channels: ['email', 'dashboard', 'sms'],
    },
    {
      daysBeforeDue: 0, // Due date
      alertType: 'critical',
      channels: ['email', 'dashboard', 'sms'],
      escalateTo: 'admin',
    },
    {
      daysBeforeDue: -1, // 1 day overdue
      alertType: 'critical',
      channels: ['email', 'dashboard', 'sms'],
      escalateTo: 'admin',
    },
  ],
  high: [
    {
      daysBeforeDue: 5,
      alertType: 'info',
      channels: ['email', 'dashboard'],
    },
    {
      daysBeforeDue: 2,
      alertType: 'warning',
      channels: ['email', 'dashboard'],
    },
    {
      daysBeforeDue: 0,
      alertType: 'critical',
      channels: ['email', 'dashboard'],
      escalateTo: 'admin',
    },
  ],
  medium: [
    {
      daysBeforeDue: 3,
      alertType: 'info',
      channels: ['email', 'dashboard'],
    },
    {
      daysBeforeDue: 1,
      alertType: 'warning',
      channels: ['email', 'dashboard'],
    },
  ],
  low: [
    {
      daysBeforeDue: 2,
      alertType: 'info',
      channels: ['dashboard'],
    },
  ],
};

/**
 * ESCALATION RULES
 */
export interface EscalationRule {
  daysOverdue: number;
  action: 'warn' | 'restrict' | 'suspend';
  notifyAdmin: boolean;
  notifyProgramHolder: boolean;
  autoExecute: boolean;
}

export const ESCALATION_RULES: Record<ComplianceLevel, EscalationRule[]> = {
  critical: [
    {
      daysOverdue: 1,
      action: 'warn',
      notifyAdmin: true,
      notifyProgramHolder: true,
      autoExecute: true,
    },
    {
      daysOverdue: 3,
      action: 'restrict',
      notifyAdmin: true,
      notifyProgramHolder: true,
      autoExecute: true, // Auto-restrict new enrollments
    },
    {
      daysOverdue: 7,
      action: 'suspend',
      notifyAdmin: true,
      notifyProgramHolder: true,
      autoExecute: false, // Requires admin approval
    },
  ],
  high: [
    {
      daysOverdue: 3,
      action: 'warn',
      notifyAdmin: true,
      notifyProgramHolder: true,
      autoExecute: true,
    },
    {
      daysOverdue: 7,
      action: 'restrict',
      notifyAdmin: true,
      notifyProgramHolder: true,
      autoExecute: true,
    },
  ],
  medium: [
    {
      daysOverdue: 5,
      action: 'warn',
      notifyAdmin: false,
      notifyProgramHolder: true,
      autoExecute: true,
    },
  ],
  low: [
    {
      daysOverdue: 7,
      action: 'warn',
      notifyAdmin: false,
      notifyProgramHolder: true,
      autoExecute: true,
    },
  ],
};

/**
 * HELPER FUNCTIONS
 */

export function getAllRequirements(): ReportingRequirement[] {
  return [
    ...MONTHLY_REQUIREMENTS,
    ...QUARTERLY_REQUIREMENTS,
    ...ANNUAL_REQUIREMENTS,
    ...APPRENTICESHIP_REQUIREMENTS,
  ];
}

export function getRequirementsByFrequency(frequency: ReportingFrequency): ReportingRequirement[] {
  return getAllRequirements().filter((req) => req.frequency === frequency);
}

export function getCriticalRequirements(): ReportingRequirement[] {
  return getAllRequirements().filter((req) => req.complianceLevel === 'critical');
}

export function calculateDueDate(
  requirement: ReportingRequirement,
  referenceDate: Date = new Date(),
): Date {
  const dueDate = new Date(referenceDate);

  switch (requirement.frequency) {
    case 'monthly':
      // Due on specific day of next month
      dueDate.setMonth(dueDate.getMonth() + 1);
      dueDate.setDate(requirement.dueDay);
      break;

    case 'quarterly':
      // Due on specific day after quarter end
      const quarterEnd = new Date(
        dueDate.getFullYear(),
        Math.floor(dueDate.getMonth() / 3) * 3 + 3,
        0,
      );
      dueDate.setTime(quarterEnd.getTime());
      dueDate.setDate(dueDate.getDate() + requirement.dueDay);
      break;

    case 'annual':
      // Due specific days after year end
      dueDate.setFullYear(dueDate.getFullYear() + 1);
      dueDate.setMonth(0);
      dueDate.setDate(requirement.dueDay);
      break;
  }

  return dueDate;
}

export function getReportingStatus(dueDate: Date, submittedDate?: Date): ReportingStatus {
  const now = new Date();
  const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (submittedDate) {
    return 'submitted';
  }

  if (daysUntilDue < 0) {
    return 'overdue';
  }

  if (daysUntilDue <= 3) {
    return 'due_soon';
  }

  return 'upcoming';
}
