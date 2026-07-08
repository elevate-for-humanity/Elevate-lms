import type { ProgramSchema } from '@/lib/programs/program-schema';

export const QMA: ProgramSchema = {
  slug: 'qma',
  title: 'Qualified Medication Aide (QMA)',
  subtitle:
    'Indiana state QMA certification in 4 weeks. Administer medications under nurse supervision in residential care settings. WIOA and WRG funding available for eligible participants. Self-pay: $1,200.',
  sector: 'healthcare',
  category: 'Healthcare',
  programType: 'workforce',

  heroImage: '/images/pages/healthcare-hero.webp',
  heroImageAlt: 'Qualified Medication Aide student preparing medications in a residential care facility',

  deliveryMode: 'hybrid',
  deliveredBy: 'Elevate',
  durationWeeks: 4,
  hoursPerWeekMin: 30,
  hoursPerWeekMax: 40,
  hoursBreakdown: {
    onlineInstruction: 40,
    handsOnLab: 60,
    examPrep: 20,
    careerPlacement: 10,
  },
  schedule: 'Mon–Fri, 30–40 hours per week',
  cohortSize: '8–12 participants per cohort',
  fundingStatement:
    'WIOA and WRG funding available for eligible Indiana residents. Covers tuition and exam fees when approved. Eligibility is not guaranteed. Self-pay: $1,200.',
  selfPayCost: '$1,200',
  badge: 'WIOA Eligible',
  badgeColor: 'green',

  credentials: [
    {
      name: 'Indiana QMA Certificate',
      issuer: 'Indiana State Department of Health (ISDH)',
      description:
        'State-issued certification authorizing the holder to administer medications under nurse supervision in licensed residential care facilities.',
      validity: 'Renewable every 2 years with documented work hours',
    },
    {
      name: 'CPR/AED Certification',
      issuer: 'American Red Cross',
      description:
        'Required for all healthcare workers. Covers adult, child, and infant CPR plus AED operation.',
      validity: '2 years',
    },
  ],

  outcomes: [
    {
      statement:
        'Identify the six rights of medication administration and apply them correctly in simulated scenarios',
      assessedAt: 'Week 1',
    },
    {
      statement:
        'Accurately prepare and administer oral, topical, and inhaled medications using proper technique',
      assessedAt: 'Week 2',
    },
    {
      statement:
        'Document medication administration accurately in a simulated medication administration record (MAR)',
      assessedAt: 'Week 2',
    },
    {
      statement:
        'Recognize and report adverse drug reactions and medication errors using facility protocols',
      assessedAt: 'Week 3',
    },
    {
      statement:
        'Complete supervised clinical hours at a licensed Indiana residential care facility with documented competency sign-offs',
      assessedAt: 'Week 4',
    },
    {
      statement:
        'Pass the Indiana state QMA written and skills exam — proctored on-site at Elevate',
      assessedAt: 'Week 4',
    },
  ],

  careerPathway: [
    {
      title: 'Qualified Medication Aide',
      timeframe: '0–3 months',
      requirements: 'Indiana QMA certification + active CNA certification',
      salaryRange: '$17–$22/hr',
    },
    {
      title: 'Senior QMA / Charge Aide',
      timeframe: '1–2 years',
      requirements: 'QMA + 1 year experience',
      salaryRange: '$20–$25/hr',
    },
    {
      title: 'Licensed Practical Nurse (LPN)',
      timeframe: '2–3 years',
      requirements: 'QMA + LPN program completion',
      salaryRange: '$24–$32/hr',
    },
    {
      title: 'Registered Nurse (RN)',
      timeframe: '4–6 years',
      requirements: 'LPN + RN bridge or BSN',
      salaryRange: '$35–$50/hr',
    },
  ],

  weeklySchedule: [
    {
      week: 'Weeks 1–2',
      title: 'Medication Fundamentals',
      competencyMilestone:
        'Correctly apply the six rights of medication administration in all simulated scenarios',
    },
    {
      week: 'Weeks 3–4',
      title: 'Clinical Skills & State Exam',
      competencyMilestone:
        'Pass Indiana state QMA written and skills exam proctored on-site',
    },
  ],

  curriculum: [
    {
      title: 'Weeks 1–2: Medication Fundamentals',
      topics: [
        'Apply the six rights of medication administration: right patient, drug, dose, route, time, and documentation',
        'Prepare and administer oral medications including tablets, capsules, and liquids using proper technique',
        'Administer topical medications — creams, patches, and eye/ear drops — following facility protocols',
        'Use metered-dose inhalers and nebulizers correctly and document patient response',
        'Identify common drug classes, side effects, and contraindications relevant to residential care settings',
        'Document medication administration accurately in a simulated MAR and report discrepancies',
      ],
    },
    {
      title: 'Weeks 3–4: Clinical Skills & State Exam',
      topics: [
        'Complete supervised clinical hours at a licensed Indiana residential care facility',
        'Perform all medication administration tasks under RN supervision with competency sign-off',
        'Recognize adverse drug reactions and demonstrate correct reporting procedures',
        'Sit for the Indiana state QMA written exam — multiple choice, 90-minute time limit',
        'Demonstrate selected medication administration skills for the state skills examiner — proctored on-site at Elevate',
      ],
    },
  ],

  complianceAlignment: [
    {
      standard: 'Indiana State Department of Health — QMA Curriculum',
      description:
        "Program meets Indiana's ISDH-approved QMA training requirements including required clinical hours.",
    },
    {
      standard: 'WIOA (Workforce Innovation and Opportunity Act)',
      description:
        'Eligible training provider under WIOA for Indiana residents seeking healthcare workforce credentials.',
    },
    {
      standard: 'WRG (Workforce Ready Grant)',
      description:
        'Approved program under Indiana\'s Workforce Ready Grant for eligible adult learners pursuing in-demand credentials.',
    },
  ],

  laborMarket: {
    medianSalary: 38000,
    salaryRange: '$32,000–$46,000',
    growthRate: '5% (faster than average)',
    source: 'U.S. Bureau of Labor Statistics',
    sourceYear: 2024,
    region: 'Indianapolis–Carmel–Anderson MSA',
  },

  careers: [
    { title: 'Qualified Medication Aide', salary: '$17–$22/hr' },
    { title: 'Certified Nursing Assistant', salary: '$16–$20/hr' },
    { title: 'Patient Care Technician', salary: '$18–$23/hr' },
    { title: 'Home Health Aide', salary: '$15–$19/hr' },
  ],

  admissionRequirements: [
    'Active Indiana CNA certification (required by state law)',
    'High school diploma or GED',
    'Valid government-issued photo ID',
    'Completed Elevate enrollment application',
    'WIOA/WRG eligibility determination (if seeking funding)',
  ],

  equipmentIncluded:
    'Medication administration training kit, simulated MAR workbook, and clinical skills reference guide included in tuition.',

  modality: 'Hybrid — online instruction plus hands-on lab and supervised clinical hours',

  facilityInfo:
    'Lab sessions held at Elevate\'s Indianapolis training center. Clinical hours completed at licensed Indiana residential care facilities partnered with Elevate.',

  pricingIncludes: [
    'All instructional materials and medication administration training kit',
    'Indiana state QMA written and skills exam fee',
    'CPR/AED certification',
    'Career placement support',
  ],

  paymentTerms:
    'WIOA and WRG funding covers full tuition for eligible participants. Self-pay: $1,200 due before the first day of class. Payment plans available — contact admissions.',

  employerPartners: [
    'Ascension St. Vincent',
    'IU Health',
    'Kindred Healthcare',
    'American Senior Communities',
  ],

  faqs: [
    {
      question: 'Do I need a CNA certification first?',
      answer:
        'Yes. Indiana requires active CNA certification as a prerequisite for QMA training. If you are not yet a CNA, consider our CNA program first.',
    },
    {
      question: 'Is the state exam included?',
      answer:
        'Yes. The Indiana state QMA written and skills exam is proctored on-site at Elevate during Week 4. The exam fee is included in tuition or covered by funding when applicable.',
    },
    {
      question: 'What funding is available?',
      answer:
        'QMA is funded through WIOA and the Indiana Workforce Ready Grant for eligible residents. Many students pay $0. Eligibility is determined through intake. Self-pay tuition is $1,200.',
    },
    {
      question: 'Where are the clinical hours completed?',
      answer:
        'Clinical hours are completed at licensed Indiana residential care facilities partnered with Elevate. Sites are assigned based on cohort scheduling and facility availability.',
    },
    {
      question: 'What can I do with a QMA certification?',
      answer:
        'QMA-certified aides can administer medications in assisted living facilities, group homes, and other residential care settings under nurse supervision — earning $2–$5/hr more than CNA-only positions.',
    },
  ],

  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Healthcare', href: '/programs/healthcare' },
    { label: 'Qualified Medication Aide (QMA)' },
  ],

  cta: {
    applyHref: '/apply?program=qma',
    requestInfoHref: '/contact?program=qma',
  },

  metaTitle: 'QMA Program — Indiana Qualified Medication Aide Certification | Elevate for Humanity',
  metaDescription:
    'Indiana state QMA certification in 4 weeks. Administer medications under nurse supervision. WIOA and WRG funding available for eligible participants. Self-pay: $1,200. Indianapolis.',

  funding: {
    wioa_eligible: true,
    wrg_eligible: true,
    etpl_approved: true,
    snap_et_eligible: false,
    fssa_eligible: false,
  },

  enrollmentType: 'internal',
  deliveryModel: 'internal',
  fundingOptions: ['wioa', 'wrg', 'self_pay'],
};
