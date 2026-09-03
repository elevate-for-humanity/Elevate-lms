import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * AUTOMATED COMPLIANCE GUARDRAILS
 *
 * Automatically enforces policies and disqualifies program holders
 * who violate terms. Protects master credentials.
 */

export type ViolationType =
  | 'data_quality'
  | 'reporting_timeliness'
  | 'student_outcomes'
  | 'financial_compliance'
  | 'fraud_suspected'
  | 'safety_violation'
  | 'credential_misuse'
  | 'mou_breach';

export type ViolationSeverity = 'minor' | 'major' | 'critical';

export type EnforcementAction =
  | 'warning'
  | 'probation'
  | 'restrict_enrollments'
  | 'suspend_access'
  | 'terminate_mou';

export interface GuardrailPolicy {
  id: string;
  name: string;
  description: string;
  violationType: ViolationType;
  severity: ViolationSeverity;

  // Automatic detection criteria
  detectionRule: {
    metric: string;
    operator: '<' | '>' | '=' | '!=' | '>=' | '<=';
    threshold: number;
    evaluationPeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  };

  // Automatic enforcement
  autoEnforce: boolean;
  enforcementAction: EnforcementAction;
  gracePeriodHours: number;

  // Notifications
  notifyProgramHolder: boolean;
  notifyAdmin: boolean;
  emailTemplate: string;

  // MOU reference
  mouSection: string;
  mouClause: string;
}

/**
 * CRITICAL GUARDRAILS (Auto-Disqualify)
 */
export const CRITICAL_GUARDRAILS: GuardrailPolicy[] = [
  {
    id: 'fraud_detection',
    name: 'Fraud Detection',
    description: 'Automatic detection of fraudulent activity',
    violationType: 'fraud_suspected',
    severity: 'critical',
    detectionRule: {
      metric: 'fraud_indicators',
      operator: '>',
      threshold: 3,
      evaluationPeriod: 'monthly',
    },
    autoEnforce: true,
    enforcementAction: 'suspend_access',
    gracePeriodHours: 0, // Immediate
    notifyProgramHolder: true,
    notifyAdmin: true,
    emailTemplate: 'fraud_suspension',
    mouSection: 'Section 8: Termination',
    mouClause: '8.2 - Immediate Termination for Fraud',
  },
  {
    id: 'false_reporting',
    name: 'False Reporting',
    description: 'Submitting false or misleading data',
    violationType: 'fraud_suspected',
    severity: 'critical',
    detectionRule: {
      metric: 'data_discrepancies',
      operator: '>',
      threshold: 5,
      evaluationPeriod: 'monthly',
    },
    autoEnforce: true,
    enforcementAction: 'suspend_access',
    gracePeriodHours: 24,
    notifyProgramHolder: true,
    notifyAdmin: true,
    emailTemplate: 'false_reporting_suspension',
    mouSection: 'Section 8: Termination',
    mouClause: '8.2(a) - False Reporting',
  },
  {
    id: 'credential_misuse',
    name: 'Credential Misrepresentation',
    description: 'Misusing or misrepresenting master credentials',
    violationType: 'credential_misuse',
    severity: 'critical',
    detectionRule: {
      metric: 'credential_misuse_reports',
      operator: '>',
      threshold: 0,
      evaluationPeriod: 'daily',
    },
    autoEnforce: true,
    enforcementAction: 'terminate_mou',
    gracePeriodHours: 0,
    notifyProgramHolder: true,
    notifyAdmin: true,
    emailTemplate: 'credential_misuse_termination',
    mouSection: 'Section 8: Termination',
    mouClause: '8.2(b) - Credential Misuse',
  },
  {
    id: 'student_safety',
    name: 'Student Safety Violation',
    description: 'Any violation of student safety or welfare',
    violationType: 'safety_violation',
    severity: 'critical',
    detectionRule: {
      metric: 'safety_incidents',
      operator: '>',
      threshold: 0,
      evaluationPeriod: 'daily',
    },
    autoEnforce: true,
    enforcementAction: 'suspend_access',
    gracePeriodHours: 0,
    notifyProgramHolder: true,
    notifyAdmin: true,
    emailTemplate: 'safety_violation_suspension',
    mouSection: 'Section 8: Termination',
    mouClause: '8.2(c) - Safety Violations',
  },
  {
    id: 'three_strikes',
    name: 'Three Strike Rule',
    description: 'Accumulation of three major violations',
    violationType: 'mou_breach',
    severity: 'critical',
    detectionRule: {
      metric: 'major_violations',
      operator: '>=',
      threshold: 3,
      evaluationPeriod: 'quarterly',
    },
    autoEnforce: true,
    enforcementAction: 'terminate_mou',
    gracePeriodHours: 72,
    notifyProgramHolder: true,
    notifyAdmin: true,
    emailTemplate: 'three_strikes_termination',
    mouSection: 'Section 8: Termination',
    mouClause: '8.3 - Three Strike Policy',
  },
];

/**
 * MAJOR GUARDRAILS (Auto-Restrict)
 */
export const MAJOR_GUARDRAILS: GuardrailPolicy[] = [
  {
    id: 'data_quality_low',
    name: 'Low Data Quality',
    description: 'Data quality score below acceptable threshold',
    violationType: 'data_quality',
    severity: 'major',
    detectionRule: {
      metric: 'data_quality_score',
      operator: '<',
      threshold: 70,
      evaluationPeriod: 'monthly',
    },
    autoEnforce: true,
    enforcementAction: 'restrict_enrollments',
    gracePeriodHours: 48,
    notifyProgramHolder: true,
    notifyAdmin: true,
    emailTemplate: 'data_quality_restriction',
    mouSection: 'Section 5: Data Quality Standards',
    mouClause: '5.2 - Minimum Quality Requirements',
  },
  {
    id: 'reporting_late_critical',
    name: 'Critical Report Overdue',
    description: 'Critical report more than 7 days overdue',
    violationType: 'reporting_timeliness',
    severity: 'major',
    detectionRule: {
      metric: 'days_overdue_critical',
      operator: '>',
      threshold: 7,
      evaluationPeriod: 'daily',
    },
    autoEnforce: true,
    enforcementAction: 'restrict_enrollments',
    gracePeriodHours: 24,
    notifyProgramHolder: true,
    notifyAdmin: true,
    emailTemplate: 'critical_report_overdue',
    mouSection: 'Section 6: Reporting Requirements',
    mouClause: '6.3 - Timeliness Standards',
  },
  {
    id: 'completion_rate_low',
    name: 'Low Completion Rate',
    description: 'Program completion rate below 50%',
    violationType: 'student_outcomes',
    severity: 'major',
    detectionRule: {
      metric: 'completion_rate',
      operator: '<',
      threshold: 50,
      evaluationPeriod: 'quarterly',
    },
    autoEnforce: true,
    enforcementAction: 'probation',
    gracePeriodHours: 168, // 7 days
    notifyProgramHolder: true,
    notifyAdmin: true,
    emailTemplate: 'low_completion_probation',
    mouSection: 'Section 7: Performance Standards',
    mouClause: '7.2 - Minimum Completion Rates',
  },
  {
    id: 'placement_rate_low',
    name: 'Low Placement Rate',
    description: 'Employment placement rate below 60%',
    violationType: 'student_outcomes',
    severity: 'major',
    detectionRule: {
      metric: 'placement_rate',
      operator: '<',
      threshold: 60,
      evaluationPeriod: 'quarterly',
    },
    autoEnforce: true,
    enforcementAction: 'probation',
    gracePeriodHours: 168,
    notifyProgramHolder: true,
    notifyAdmin: true,
    emailTemplate: 'low_placement_probation',
    mouSection: 'Section 7: Performance Standards',
    mouClause: '7.3 - Minimum Placement Rates',
  },
  {
    id: 'financial_discrepancy',
    name: 'Financial Discrepancy',
    description: 'Unexplained financial discrepancies detected',
    violationType: 'financial_compliance',
    severity: 'major',
    detectionRule: {
      metric: 'financial_discrepancy_amount',
      operator: '>',
      threshold: 5000,
      evaluationPeriod: 'monthly',
    },
    autoEnforce: true,
    enforcementAction: 'restrict_enrollments',
    gracePeriodHours: 72,
    notifyProgramHolder: true,
    notifyAdmin: true,
    emailTemplate: 'financial_discrepancy_restriction',
    mouSection: 'Section 9: Financial Compliance',
    mouClause: '9.4 - Financial Accuracy',
  },
];

/**
 * MINOR GUARDRAILS (Auto-Warn)
 */
export const MINOR_GUARDRAILS: GuardrailPolicy[] = [
  {
    id: 'reporting_late_minor',
    name: 'Non-Critical Report Late',
    description: 'Non-critical report overdue',
    violationType: 'reporting_timeliness',
    severity: 'minor',
    detectionRule: {
      metric: 'days_overdue_minor',
      operator: '>',
      threshold: 3,
      evaluationPeriod: 'daily',
    },
    autoEnforce: true,
    enforcementAction: 'warning',
    gracePeriodHours: 24,
    notifyProgramHolder: true,
    notifyAdmin: false,
    emailTemplate: 'minor_report_warning',
    mouSection: 'Section 6: Reporting Requirements',
    mouClause: '6.4 - Reporting Timeliness',
  },
  {
    id: 'data_quality_declining',
    name: 'Data Quality Declining',
    description: 'Data quality score trending downward',
    violationType: 'data_quality',
    severity: 'minor',
    detectionRule: {
      metric: 'data_quality_score',
      operator: '<',
      threshold: 85,
      evaluationPeriod: 'monthly',
    },
    autoEnforce: true,
    enforcementAction: 'warning',
    gracePeriodHours: 72,
    notifyProgramHolder: true,
    notifyAdmin: false,
    emailTemplate: 'data_quality_warning',
    mouSection: 'Section 5: Data Quality Standards',
    mouClause: '5.3 - Quality Monitoring',
  },
];

/**
 * DISQUALIFICATION CRITERIA
 */
export interface DisqualificationCriteria {
  id: string;
  name: string;
  description: string;
  automatic: boolean;
  appealable: boolean;
  reinstatementPossible: boolean;
  reinstatementConditions?: string[];
}

export const DISQUALIFICATION_CRITERIA: DisqualificationCriteria[] = [
  {
    id: 'fraud',
    name: 'Fraudulent Activity',
    description: 'Any confirmed fraudulent activity or false reporting',
    automatic: true,
    appealable: false,
    reinstatementPossible: false,
  },
  {
    id: 'credential_misuse',
    name: 'Credential Misuse',
    description: 'Misrepresenting or misusing master credentials',
    automatic: true,
    appealable: false,
    reinstatementPossible: false,
  },
  {
    id: 'safety_violation',
    name: 'Safety Violation',
    description: 'Student safety or welfare violation',
    automatic: true,
    appealable: true,
    reinstatementPossible: true,
    reinstatementConditions: [
      'Complete safety training',
      'Implement corrective action plan',
      'Pass safety audit',
      '6 months probation period',
    ],
  },
  {
    id: 'three_strikes',
    name: 'Three Strikes',
    description: 'Accumulation of three major violations',
    automatic: true,
    appealable: true,
    reinstatementPossible: true,
    reinstatementConditions: [
      '90 days suspension period',
      'Address all violations',
      'Submit improvement plan',
      'Pass compliance review',
    ],
  },
  {
    id: 'persistent_non_compliance',
    name: 'Persistent Non-Compliance',
    description: 'Repeated failure to meet compliance requirements',
    automatic: true,
    appealable: true,
    reinstatementPossible: true,
    reinstatementConditions: [
      '60 days suspension',
      'Compliance training',
      'Demonstrate improvement',
    ],
  },
  {
    id: 'financial_fraud',
    name: 'Financial Fraud',
    description: 'Misuse of funds or financial fraud',
    automatic: true,
    appealable: false,
    reinstatementPossible: false,
  },
];

/**
 * EMAIL TEMPLATES
 */
export const EMAIL_TEMPLATES = {
  fraud_suspension: {
    subject: 'IMMEDIATE SUSPENSION - Fraudulent Activity Detected',
    body: `
Dear {{program_holder_name}},

This email serves as immediate notice that your access to the ${PLATFORM_DEFAULTS.orgName} Program Holder Network has been SUSPENDED effective immediately.

REASON: Fraudulent activity detected

VIOLATION DETAILS:
{{violation_details}}

MOU REFERENCE:
Section 8.2 - Immediate Termination for Fraud

YOUR ACCESS HAS BEEN:
- Suspended immediately
- New enrollments blocked
- Reporting access restricted
- Under investigation

NEXT STEPS:
1. You will be contacted within 24 hours for investigation
2. Provide documentation to support your case
3. MOU termination proceedings may begin

This is a serious violation that jeopardizes our master credentials and all program holders in our network.

If you believe this is an error, contact us immediately at:
Email: compliance@${PLATFORM_DEFAULTS.canonicalDomain}
Phone: ${PLATFORM_DEFAULTS.supportPhone}

${PLATFORM_DEFAULTS.orgName} Compliance Team
    `,
  },

  false_reporting_suspension: {
    subject: 'SUSPENSION NOTICE - False Reporting Detected',
    body: `
Dear {{program_holder_name}},

Your access has been SUSPENDED due to false or misleading data reporting.

VIOLATION: False Reporting
DETECTED: {{detection_date}}
GRACE PERIOD: 24 hours to respond

ISSUES IDENTIFIED:
{{violation_details}}

MOU REFERENCE:
Section 8.2(a) - False Reporting

IMMEDIATE ACTIONS REQUIRED:
1. Correct all false data within 24 hours
2. Provide explanation for discrepancies
3. Submit corrective action plan

CONSEQUENCES IF NOT RESOLVED:
- MOU termination
- Loss of access to credentials
- Possible legal action

Contact compliance team immediately:
Email: compliance@${PLATFORM_DEFAULTS.canonicalDomain}
Phone: ${PLATFORM_DEFAULTS.supportPhone}

${PLATFORM_DEFAULTS.orgName} Compliance Team
    `,
  },

  credential_misuse_termination: {
    subject: 'MOU TERMINATION - Credential Misuse',
    body: `
Dear {{program_holder_name}},

Your Memorandum of Understanding (MOU) with ${PLATFORM_DEFAULTS.orgName} is hereby TERMINATED effective immediately.

REASON: Misuse of Master Credentials

VIOLATION:
{{violation_details}}

MOU REFERENCE:
Section 8.2(b) - Credential Misuse

EFFECTIVE IMMEDIATELY:
- All access revoked
- Cannot operate under our credentials
- Must cease all use of ETPL/RAPIDS/WIOA credentials
- Student data must be transferred

LEGAL NOTICE:
Continued use of our credentials after termination may result in legal action.

This decision is FINAL and NOT APPEALABLE per MOU Section 8.2(b).

For data transfer procedures, contact:
Email: compliance@${PLATFORM_DEFAULTS.canonicalDomain}
Phone: ${PLATFORM_DEFAULTS.supportPhone}

${PLATFORM_DEFAULTS.orgName} Legal & Compliance Team
    `,
  },

  three_strikes_termination: {
    subject: 'MOU TERMINATION NOTICE - Three Strike Policy',
    body: `
Dear {{program_holder_name}},

Per MOU Section 8.3 (Three Strike Policy), your MOU is being TERMINATED.

VIOLATIONS:
Strike 1: {{strike_1_details}}
Strike 2: {{strike_2_details}}
Strike 3: {{strike_3_details}}

MOU REFERENCE:
Section 8.3 - Three Strike Policy

GRACE PERIOD: 72 hours to appeal

APPEAL PROCESS:
1. Submit written appeal within 72 hours
2. Provide evidence of corrective actions
3. Demonstrate commitment to compliance

IF NO APPEAL OR APPEAL DENIED:
- Access terminated
- Credentials revoked
- Student data transfer required

REINSTATEMENT POSSIBLE:
- 90-day suspension period
- Address all violations
- Submit improvement plan
- Pass compliance review

To appeal, contact:
Email: appeals@${PLATFORM_DEFAULTS.canonicalDomain}
Phone: ${PLATFORM_DEFAULTS.supportPhone}

${PLATFORM_DEFAULTS.orgName} Compliance Team
    `,
  },

  data_quality_restriction: {
    subject: 'ACCESS RESTRICTED - Low Data Quality',
    body: `
Dear {{program_holder_name}},

Your account has been RESTRICTED due to low data quality scores.

CURRENT DATA QUALITY SCORE: {{current_score}}/100
REQUIRED MINIMUM: 70/100

MOU REFERENCE:
Section 5.2 - Minimum Quality Requirements

RESTRICTIONS IN EFFECT:
- New enrollments blocked
- Existing students can continue
- Must improve data quality to restore access

GRACE PERIOD: 48 hours to improve

REQUIRED ACTIONS:
1. Review data quality report (attached)
2. Correct all flagged issues
3. Submit corrected data
4. Achieve 70+ quality score

HOW TO IMPROVE:
- Complete missing required fields
- Fix validation errors
- Update outdated information
- Verify student data accuracy

Access will be automatically restored when quality score reaches 70+.

Questions? Contact:
Email: support@${PLATFORM_DEFAULTS.canonicalDomain}
Phone: ${PLATFORM_DEFAULTS.supportPhone}

${PLATFORM_DEFAULTS.orgName} Compliance Team
    `,
  },

  critical_report_overdue: {
    subject: 'URGENT - Critical Report Overdue - Access Restricted',
    body: `
Dear {{program_holder_name}},

Your account has been RESTRICTED due to overdue critical reporting.

OVERDUE REPORT: {{report_name}}
DUE DATE: {{due_date}}
DAYS OVERDUE: {{days_overdue}}

MOU REFERENCE:
Section 6.3 - Timeliness Standards

RESTRICTIONS IN EFFECT:
- New enrollments blocked until report submitted
- Existing operations can continue
- Additional late fees may apply

GRACE PERIOD: 24 hours to submit

SUBMIT IMMEDIATELY:
1. Log into dashboard
2. Complete {{report_name}}
3. Submit for approval

CONSEQUENCES IF NOT SUBMITTED:
- Escalation to Strike 1
- Possible suspension
- MOU review

Submit now at: {{dashboard_link}}

Questions? Contact:
Email: support@${PLATFORM_DEFAULTS.canonicalDomain}
Phone: ${PLATFORM_DEFAULTS.supportPhone}

${PLATFORM_DEFAULTS.orgName} Compliance Team
    `,
  },
};

/**
 * HELPER FUNCTIONS
 */

export function getAllGuardrails(): GuardrailPolicy[] {
  return [...CRITICAL_GUARDRAILS, ...MAJOR_GUARDRAILS, ...MINOR_GUARDRAILS];
}

export function getCriticalGuardrails(): GuardrailPolicy[] {
  return CRITICAL_GUARDRAILS;
}

export function getGuardrailsByViolationType(type: ViolationType): GuardrailPolicy[] {
  return getAllGuardrails().filter((g) => g.violationType === type);
}

export function shouldAutoEnforce(guardrail: GuardrailPolicy): boolean {
  return guardrail.autoEnforce;
}

export function getEnforcementAction(guardrail: GuardrailPolicy): EnforcementAction {
  return guardrail.enforcementAction;
}

export function getEmailTemplate(templateName: string): {
  subject: string;
  body: string;
} {
  return (
    EMAIL_TEMPLATES[templateName as keyof typeof EMAIL_TEMPLATES] || {
      subject: 'Compliance Notice',
      body: 'Please contact compliance team.',
    }
  );
}
