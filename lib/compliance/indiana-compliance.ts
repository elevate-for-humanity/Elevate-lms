/**
 * Indiana-Specific Compliance Requirements
 *
 * Based on Indiana DWD regulations for ETPL, WorkOne, WRG, and WIOA programs.
 * Sources:
 * - INTraining and ETP List Policy (2020-16-PC3)
 * - WIOA Title I regulations
 * - Indiana DWD active policies
 */

export type IndianaCredential =
  | 'ETPL' // Eligible Training Provider List
  | 'WIOA' // Workforce Innovation and Opportunity Act
  | 'WorkOne' // Indiana's American Job Center network
  | 'WRG' // Workforce Ready Grant
  | 'SNAP_ET' // SNAP Employment & Training
  | 'JRI' // Job Ready Indy
  | 'DOL_RAPIDS'; // Department of Labor Registered Apprenticeship

export type IndianaReportType =
  | 'student_data_submission' // Quarterly student outcome data
  | 'federal_reporting' // Annual federal performance reporting
  | 'etpl_renewal' // Annual ETPL renewal application
  | 'program_performance' // Quarterly program performance metrics
  | 'wioa_performance' // WIOA Title I performance measures
  | 'enrollment_verification' // Monthly enrollment verification
  | 'completion_verification' // Monthly completion verification
  | 'placement_verification'; // Quarterly placement verification

/**
 * Indiana DWD Reporting Schedules
 *
 * Based on INTraining provider requirements and WIOA regulations.
 */
export const INDIANA_REPORTING_SCHEDULES = {
  // Student Data Submission - Required Quarterly
  student_data_submission: {
    frequency: 'quarterly' as const,
    dueDate: 'Last day of month following quarter end',
    quarters: [
      {
        name: 'Q1',
        months: ['July', 'August', 'September'],
        dueDate: 'October 31',
      },
      {
        name: 'Q2',
        months: ['October', 'November', 'December'],
        dueDate: 'January 31',
      },
      {
        name: 'Q3',
        months: ['January', 'February', 'March'],
        dueDate: 'April 30',
      },
      { name: 'Q4', months: ['April', 'May', 'June'], dueDate: 'July 31' },
    ],
    requiredFields: [
      'Student SSN or State ID',
      'Program enrollment date',
      'Program completion date',
      'Credential attained',
      'Employment status at exit',
      'Wages at placement',
    ],
    submissionMethod: 'INTraining Portal CSV upload',
    contactEmail: 'INTraining@dwd.in.gov',
    lateSubmissionConsequence: 'Program may be removed from ETPL after 30 days',
  },

  // Federal Reporting - Required Annually
  federal_reporting: {
    frequency: 'annual' as const,
    dueDate: 'September 30 (for prior program year July 1 - June 30)',
    programYear: 'July 1 - June 30',
    requiredMetrics: [
      'Employment Rate 2nd Quarter After Exit',
      'Employment Rate 4th Quarter After Exit',
      'Median Earnings 2nd Quarter After Exit',
      'Credential Attainment Rate',
      'Measurable Skill Gains',
    ],
    submissionMethod: 'INTraining Portal',
    contactEmail: 'INTraining@dwd.in.gov',
    lateSubmissionConsequence: 'Immediate removal from ETPL',
  },

  // ETPL Renewal - Required Annually
  etpl_renewal: {
    frequency: 'annual' as const,
    dueDate: 'June 30 (for programs expiring in current year)',
    renewalWindow: '90 days before expiration',
    requiredDocuments: [
      'Updated program information',
      'Performance data for past year',
      'Proof of accreditation (if applicable)',
      'Proof of state licensure (if applicable)',
      'Updated tuition and fees',
    ],
    performanceCriteria: {
      employmentRate: 'Must meet or exceed 70%',
      credentialRate: 'Must meet or exceed 60%',
      wageGain: 'Must demonstrate positive wage gain',
    },
    submissionMethod: 'INTraining Portal',
    contactEmail: 'INTraining@dwd.in.gov',
    lateSubmissionConsequence: 'Program expires and is removed from ETPL',
  },

  // Program Performance - Required Quarterly
  program_performance: {
    frequency: 'quarterly' as const,
    dueDate: '15th day of month following quarter end',
    requiredMetrics: [
      'Total enrollments',
      'Active students',
      'Completions',
      'Withdrawals',
      'Credential attainment',
      'Job placements',
    ],
    submissionMethod: 'INTraining Portal',
    contactEmail: 'INTraining@dwd.in.gov',
    lateSubmissionConsequence:
      'Warning after 1st late submission, probation after 2nd',
  },

  // WIOA Performance - Required Quarterly
  wioa_performance: {
    frequency: 'quarterly' as const,
    dueDate: '30th day of month following quarter end',
    requiredMetrics: [
      'WIOA-funded enrollments',
      'WIOA participant outcomes',
      'Credential attainment for WIOA participants',
      'Employment outcomes for WIOA participants',
      'Measurable skill gains',
    ],
    submissionMethod: 'INTraining Portal',
    contactEmail: 'INTraining@dwd.in.gov',
    lateSubmissionConsequence: 'May lose WIOA funding eligibility',
  },

  // Enrollment Verification - Required Monthly
  enrollment_verification: {
    frequency: 'monthly' as const,
    dueDate: '10th day of following month',
    requiredData: [
      'Current enrollment count',
      'New enrollments',
      'Withdrawals',
      'Attendance verification',
    ],
    submissionMethod: 'INTraining Portal',
    contactEmail: 'INTraining@dwd.in.gov',
    lateSubmissionConsequence: 'Warning after 2 consecutive late submissions',
  },

  // Completion Verification - Required Monthly
  completion_verification: {
    frequency: 'monthly' as const,
    dueDate: '10th day of following month',
    requiredData: [
      'Program completions',
      'Credentials issued',
      'Exit dates',
      'Exit reasons',
    ],
    submissionMethod: 'INTraining Portal',
    contactEmail: 'INTraining@dwd.in.gov',
    lateSubmissionConsequence: 'Warning after 2 consecutive late submissions',
  },

  // Placement Verification - Required Quarterly
  placement_verification: {
    frequency: 'quarterly' as const,
    dueDate: '30th day of month following quarter end',
    requiredData: [
      'Employment placements',
      'Employer information',
      'Starting wages',
      'Job titles',
      'Industry sectors',
    ],
    submissionMethod: 'INTraining Portal',
    contactEmail: 'INTraining@dwd.in.gov',
    lateSubmissionConsequence: 'May affect ETPL renewal',
  },
};

/**
 * Indiana ETPL Performance Standards
 *
 * Programs must meet these thresholds to maintain ETPL eligibility.
 */
export const INDIANA_ETPL_STANDARDS = {
  minimumEmploymentRate: 0.7, // 70%
  minimumCredentialRate: 0.6, // 60%
  minimumWageGain: 0, // Must be positive
  minimumEnrollment: 10, // Minimum 10 students per year
  dataQualityThreshold: 0.9, // 90% of required data fields must be complete

  // Performance review triggers
  performanceReviewTriggers: {
    employmentRateBelow: 0.6, // Below 60% triggers review
    credentialRateBelow: 0.5, // Below 50% triggers review
    negativeWageGain: true, // Negative wage gain triggers review
    dataQualityBelow: 0.8, // Below 80% data quality triggers review
  },

  // Consequences for not meeting standards
  consequences: {
    firstFailure: 'Corrective action plan required within 30 days',
    secondFailure: 'Probation status for 6 months',
    thirdFailure: 'Removal from ETPL',
    immediateRemoval: [
      'Fraud or misrepresentation',
      'Loss of accreditation',
      'Loss of state licensure',
      'Failure to submit required reports for 60+ days',
    ],
  },
};

/**
 * Indiana WIOA Title I Requirements
 *
 * Additional requirements for programs receiving WIOA funding.
 */
export const INDIANA_WIOA_REQUIREMENTS = {
  eligibleProviderTypes: [
    'Institutions of higher education',
    'Registered Apprenticeship Programs',
    'Public or private training providers',
    'Community-based organizations',
    'Joint labor-management organizations',
    'Adult education providers (Title II)',
    'Local Workforce Development Boards',
  ],

  programRequirements: {
    leadToCredential: true,
    alignWithInDemandOccupations: true,
    meetMinimumPerformance: true,
    provideCareerServices: true,
    trackOutcomes: true,
  },

  performanceMeasures: [
    'Employment Rate 2nd Quarter After Exit',
    'Employment Rate 4th Quarter After Exit',
    'Median Earnings 2nd Quarter After Exit',
    'Credential Attainment Rate',
    'Measurable Skill Gains',
  ],

  reportingRequirements: {
    participantData: 'Real-time entry into state system',
    outcomeData: 'Quarterly submission',
    performanceData: 'Annual submission',
  },
};

/**
 * Indiana WorkOne Requirements
 *
 * Requirements for programs partnering with WorkOne centers.
 */
export const INDIANA_WORKONE_REQUIREMENTS = {
  partnershipAgreement: 'Required MOU with local WorkOne center',

  services: [
    'Accept referrals from WorkOne career coaches',
    'Provide program information to WorkOne staff',
    'Participate in WorkOne job fairs and events',
    'Report outcomes for WorkOne-referred participants',
  ],

  reporting: {
    referralAcceptance: 'Within 5 business days',
    enrollmentConfirmation: 'Within 10 business days',
    outcomeReporting: 'Quarterly',
  },

  contactInfo: {
    findWorkOne: 'https://www.in.gov/dwd/WorkOne/locations.html',
    email: 'WorkOne@dwd.in.gov',
  },
};

/**
 * Indiana Workforce Ready Grant (WRG) Requirements
 *
 * Requirements for programs eligible for WRG funding.
 */
export const INDIANA_WRG_REQUIREMENTS = {
  eligiblePrograms: 'Must lead to high-value certification or degree',

  highValueCertifications: 'See Indiana Promoted Industry Certifications list',

  programLength: {
    minimum: 'No minimum',
    maximum: '2 years',
  },

  costCoverage: {
    tuition: 'Up to $7,500 per year',
    fees: 'Included in cap',
    books: 'Included in cap',
    supplies: 'Included in cap',
  },

  studentEligibility: [
    'Indiana resident',
    'Not currently enrolled in high school',
    "Not have earned bachelor's degree",
    'Enroll in eligible program',
  ],

  providerRequirements: {
    mustBeOnETPL: true,
    mustReportOutcomes: true,
    mustMeetPerformanceStandards: true,
  },

  moreInfo: 'https://nextleveljobs.org/workforce-ready-grant/',
};

/**
 * Indiana Compliance Alert Triggers
 *
 * Specific triggers for automated alerts based on Indiana regulations.
 */
export const INDIANA_ALERT_TRIGGERS = {
  // Critical - Immediate action required
  critical: [
    {
      trigger: 'student_data_submission_overdue',
      threshold: '30 days past due',
      action: 'Automatic removal from ETPL in 48 hours',
      alertLevel: 'critical' as const,
    },
    {
      trigger: 'federal_reporting_overdue',
      threshold: '1 day past due',
      action: 'Immediate removal from ETPL',
      alertLevel: 'critical' as const,
    },
    {
      trigger: 'etpl_renewal_expired',
      threshold: 'Expiration date passed',
      action: 'Immediate removal from ETPL',
      alertLevel: 'critical' as const,
    },
    {
      trigger: 'employment_rate_below_threshold',
      threshold: 'Below 60% for 2 consecutive quarters',
      action: 'Corrective action plan required',
      alertLevel: 'critical' as const,
    },
  ],

  // High Priority - Action required soon
  highPriority: [
    {
      trigger: 'student_data_submission_due_soon',
      threshold: '7 days before due date',
      action: 'Submit student data via INTraining Portal',
      alertLevel: 'warning' as const,
    },
    {
      trigger: 'etpl_renewal_due_soon',
      threshold: '90 days before expiration',
      action: 'Begin ETPL renewal application',
      alertLevel: 'warning' as const,
    },
    {
      trigger: 'performance_declining',
      threshold: 'Employment rate below 70% for 1 quarter',
      action: 'Review program quality and outcomes',
      alertLevel: 'warning' as const,
    },
  ],

  // Medium Priority - Monitor closely
  mediumPriority: [
    {
      trigger: 'data_quality_declining',
      threshold: 'Below 90% complete data',
      action: 'Improve data collection processes',
      alertLevel: 'reminder' as const,
    },
    {
      trigger: 'enrollment_declining',
      threshold: 'Below 10 students per year',
      action: 'May not meet minimum enrollment requirement',
      alertLevel: 'reminder' as const,
    },
  ],
};

/**
 * Indiana-Specific Email Templates
 *
 * Email templates that reference Indiana-specific requirements.
 */
export const INDIANA_EMAIL_TEMPLATES = {
  student_data_submission_reminder: {
    subject: 'Indiana Student Data Submission Due {{due_date}}',
    body: `
Dear {{program_holder_name}},

This is a reminder that your quarterly student data submission is due on {{due_date}}.

**What to Submit:**
- Student SSN or State ID
- Program enrollment and completion dates
- Credentials attained
- Employment status at exit
- Wages at placement

**How to Submit:**
Upload your data via the INTraining Portal using the CSV template:
{{intraining_portal_url}}

**Template:** Download the Student Data Submission Template from the INTraining Provider Resources page.

**Late Submission Consequence:** Programs that fail to submit student data within 30 days of the due date may be removed from the ETPL.

**Questions?** Contact INTraining@dwd.in.gov

Thank you for your partnership in serving Indiana's workforce.

Indiana Department of Workforce Development
INTraining Team
    `.trim(),
  },

  etpl_renewal_reminder: {
    subject: 'Indiana ETPL Renewal Due - Action Required',
    body: `
Dear {{program_holder_name}},

Your ETPL listing for {{program_name}} expires on {{expiration_date}}. You must submit your renewal application by {{renewal_due_date}} to maintain your ETPL status.

**Renewal Requirements:**
- Updated program information
- Performance data for past year (must meet 70% employment rate and 60% credential rate)
- Proof of accreditation (if applicable)
- Proof of state licensure (if applicable)
- Updated tuition and fees

**How to Renew:**
Log in to the INTraining Portal and complete the renewal application:
{{intraining_portal_url}}

**Important:** If you do not submit your renewal application by the due date, your program will expire and be removed from the ETPL. You will need to reapply as a new provider.

**Questions?** Contact INTraining@dwd.in.gov

Indiana Department of Workforce Development
INTraining Team
    `.trim(),
  },

  performance_below_threshold: {
    subject: 'Indiana ETPL Performance Review Required',
    body: `
Dear {{program_holder_name}},

Our records indicate that {{program_name}} has not met the minimum performance standards for ETPL eligibility:

**Current Performance:**
- Employment Rate: {{employment_rate}}% (Minimum: 70%)
- Credential Rate: {{credential_rate}}% (Minimum: 60%)

**Required Action:**
You must submit a Corrective Action Plan within 30 days outlining how you will improve program performance. Your plan should include:

1. Root cause analysis of performance issues
2. Specific improvement strategies
3. Timeline for implementation
4. Expected outcomes

**Consequence of Inaction:**
Failure to submit a Corrective Action Plan or continued poor performance may result in removal from the ETPL.

**Submit Your Plan:**
Email your Corrective Action Plan to INTraining@dwd.in.gov

**Questions?** Contact INTraining@dwd.in.gov

Indiana Department of Workforce Development
INTraining Team
    `.trim(),
  },

  federal_reporting_overdue: {
    subject: 'URGENT: Indiana Federal Reporting Overdue - Immediate Removal',
    body: `
Dear {{program_holder_name}},

Your annual federal performance reporting was due on {{due_date}} and has not been received.

**IMMEDIATE ACTION REQUIRED:**

Per Indiana DWD policy, failure to submit federal reporting by the due date results in immediate removal from the ETPL.

Your program {{program_name}} will be removed from the ETPL within 24 hours unless you submit your federal reporting immediately.

**How to Submit:**
Log in to the INTraining Portal and complete the Federal Reporting form:
{{intraining_portal_url}}

**This is your final notice.**

**Questions?** Contact INTraining@dwd.in.gov immediately.

Indiana Department of Workforce Development
INTraining Team
    `.trim(),
  },
};

/**
 * Helper function to determine which Indiana reports are due
 */
export function getIndianaReportsDue(
  programHolderId: string,
  currentDate: Date
): IndianaReportType[] {
  const reportsDue: IndianaReportType[] = [];

  // Check each reporting schedule
  // This would query the database to see which reports are due
  // For now, return empty array (implementation needed)

  return reportsDue;
}

/**
 * Helper function to check if program meets Indiana ETPL standards
 */
export function meetsIndianaETPLStandards(
  employmentRate: number,
  credentialRate: number,
  wageGain: number,
  enrollmentCount: number,
  dataQuality: number
): {
  meets: boolean;
  failures: string[];
} {
  const failures: string[] = [];

  if (employmentRate < INDIANA_ETPL_STANDARDS.minimumEmploymentRate) {
    failures.push(
      `Employment rate ${(employmentRate * 100).toFixed(1)}% below minimum ${INDIANA_ETPL_STANDARDS.minimumEmploymentRate * 100}%`
    );
  }

  if (credentialRate < INDIANA_ETPL_STANDARDS.minimumCredentialRate) {
    failures.push(
      `Credential rate ${(credentialRate * 100).toFixed(1)}% below minimum ${INDIANA_ETPL_STANDARDS.minimumCredentialRate * 100}%`
    );
  }

  if (wageGain < INDIANA_ETPL_STANDARDS.minimumWageGain) {
    failures.push(`Wage gain is negative`);
  }

  if (enrollmentCount < INDIANA_ETPL_STANDARDS.minimumEnrollment) {
    failures.push(
      `Enrollment count ${enrollmentCount} below minimum ${INDIANA_ETPL_STANDARDS.minimumEnrollment}`
    );
  }

  if (dataQuality < INDIANA_ETPL_STANDARDS.dataQualityThreshold) {
    failures.push(
      `Data quality ${(dataQuality * 100).toFixed(1)}% below minimum ${INDIANA_ETPL_STANDARDS.dataQualityThreshold * 100}%`
    );
  }

  return {
    meets: failures.length === 0,
    failures,
  };
}

/**
 * Helper function to get next Indiana report due date
 */
export function getNextIndianaReportDueDate(
  reportType: IndianaReportType,
  currentDate: Date = new Date()
): Date {
  const schedule = INDIANA_REPORTING_SCHEDULES[reportType];

  // Calculate next due date based on frequency
  // This is a simplified implementation
  const nextDue = new Date(currentDate);

  if (schedule.frequency === 'monthly') {
    nextDue.setMonth(nextDue.getMonth() + 1);
    nextDue.setDate(10); // Most monthly reports due on 10th
  } else if (schedule.frequency === 'quarterly') {
    nextDue.setMonth(nextDue.getMonth() + 3);
    nextDue.setDate(30); // Most quarterly reports due on 30th
  } else if (schedule.frequency === 'annual') {
    nextDue.setFullYear(nextDue.getFullYear() + 1);
    nextDue.setMonth(8); // September
    nextDue.setDate(30);
  }

  return nextDue;
}
