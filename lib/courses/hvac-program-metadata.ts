// lib/courses/hvac-program-metadata.ts
// Single source of truth for HVAC program facts.
// Referenced by: program page, course page, LMS lesson content, quiz questions.
// If you change anything here, it propagates everywhere.

export const HVAC_PROGRAM = {
  name: 'HVAC Technician',
  etplId: '#10004322',
  slug: 'hvac-technician',

  // Duration
  durationWeeks: 12,
  hoursPerWeekMin: 15,
  hoursPerWeekMax: 20,
  totalHoursMin: 180,
  totalHoursMax: 240,

  // Hours breakdown
  hoursBreakdown: {
    onlineCoursework: 130,
    labTraining: 70,
    fieldObservation: 40,
  },

  // Delivery
  format: 'Hybrid — Online RTI + Lab + Employer OJT',
  schedule: '15–20 hours per week (flexible scheduling)',

  // Modules and lessons (computed from definitions.ts)
  moduleCount: 16,
  lessonCount: 94,

  // Credentials — canonical list with issuer and type
  credentials: [
    {
      name: 'EPA 608 Universal',
      issuer: 'ESCO Institute or Mainstream Engineering',
      type: 'third-party' as const,
      howEarned: 'Proctored on-site exam (80 questions, 70% per section)',
      validity: 'Lifetime (no renewal required)',
    },
    {
      name: 'OSHA 30-Hour Construction Safety',
      issuer: 'U.S. Department of Labor',
      type: 'third-party' as const,
      howEarned: 'Complete 30-hour OSHA construction safety curriculum',
      validity: 'DOL wallet card — no expiration',
    },
    {
      name: 'CPR/First Aid/AED',
      issuer: 'American Heart Association or equivalent',
      type: 'third-party' as const,
      howEarned: 'Practical skills assessment + written exam',
      validity: '2 years',
    },
    {
      name: 'Residential HVAC Certification Level 1',
      issuer: 'Elevate for Humanity',
      type: 'internal' as const,
      howEarned: 'Complete Weeks 1–8 + pass all module assessments at 80%+',
      validity: 'Certificate of completion',
    },
    {
      name: 'Residential HVAC Certification Level 2',
      issuer: 'Elevate for Humanity',
      type: 'internal' as const,
      howEarned: 'Complete Weeks 9–12 + final troubleshooting assessment',
      validity: 'Certificate of completion',
    },
    {
      name: 'Rise Up Retail Industry Fundamentals',
      issuer: 'NRF Foundation',
      type: 'third-party' as const,
      howEarned: 'Complete NRF Rise Up curriculum + pass exam',
      validity: 'No expiration',
    },
  ],

  // Assessment
  passingScore: 80,
  retakePolicy: 'Quizzes: up to 3 retakes. EPA 608 exam: retakes through certifying org.',

  // Placement
  placementRate: '90%',
  placementWindow: '90 days',

  // OJT Phase
  ojt: {
    durationWeeks: 12,
    hoursPerWeek: 20,
    totalHours: 240,
    competencyCount: 25,
    categories: [
      'Equipment Identification & Safety',
      'Airflow Diagnostics',
      'Electrical Diagnostics',
      'Refrigerant System Service',
      'Preventive Maintenance',
      'Troubleshooting',
      'Independent Service',
    ],
    verificationMethod: 'Employer supervisor sign-off per competency',
    journeymanHoursCredit: 'OJT hours count toward the 2,000-hour state journeyman requirement',
  },

  // Program Phases
  phases: [
    {
      phase: 1,
      name: 'Online Technical Training',
      durationWeeks: 12,
      deliveredBy: 'Elevate for Humanity',
      description: 'Related Technical Instruction via LMS: video lessons, reading modules, interactive quizzes, and EPA 608 practice exams.',
    },
    {
      phase: 2,
      name: 'Employer On-the-Job Training',
      durationWeeks: 12,
      deliveredBy: 'HVAC employer partners',
      description: 'Supervised field training with 25 competency sign-offs covering equipment ID, diagnostics, refrigerant service, maintenance, and troubleshooting.',
    },
    {
      phase: 3,
      name: 'Career Placement',
      durationWeeks: 0,
      deliveredBy: 'Elevate career services',
      description: 'Resume assistance, mock interviews, and direct introductions to hiring managers. 90% placement within 90 days.',
    },
  ],

  // Compliance
  fundingEligibility: ['WIOA', 'Next Level Jobs', 'Workforce Ready Grant'],
  regulatoryAlignment: [
    'EPA Section 608 certification standards',
    'OSHA construction safety curriculum',
    'U.S. Department of Labor competency framework',
    'WIOA Title I Eligible Training Provider (ETPL)',
  ],
} as const;

// Helper: credential count
export const HVAC_CREDENTIAL_COUNT = HVAC_PROGRAM.credentials.length;

// Helper: third-party credential names
export const HVAC_THIRD_PARTY_CREDENTIALS = HVAC_PROGRAM.credentials
  .filter(c => c.type === 'third-party')
  .map(c => c.name);

// Helper: formatted duration string
export const HVAC_DURATION_LABEL = `${HVAC_PROGRAM.durationWeeks} weeks`;
export const HVAC_HOURS_LABEL = `${HVAC_PROGRAM.totalHoursMin}–${HVAC_PROGRAM.totalHoursMax} hours`;
export const HVAC_SCHEDULE_LABEL = `${HVAC_PROGRAM.hoursPerWeekMin}–${HVAC_PROGRAM.hoursPerWeekMax} hrs/wk`;
