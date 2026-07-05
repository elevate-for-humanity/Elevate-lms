import type { ProgramSchema } from '@/lib/programs/program-schema';

export const HVAC_TECHNICIAN: ProgramSchema = {
  slug: 'hvac-technician',
  title: 'HVAC Technician',
  subtitle:
    'Install, service, and repair heating and cooling systems. EPA 608 Universal certification proctored on-site. 6 weeks. WIOA and Workforce Ready Grant funding available for eligible Indiana residents.',
  sector: 'skilled-trades',
  category: 'Certifications',
  programType: 'certification',

  heroImage: '/images/pages/hvac-unit.webp',
  heroImageAlt: 'HVAC technician servicing a rooftop unit in Indianapolis',
  videoSrc: '/videos/hvac-hero.mp4',

  deliveryMode: 'hybrid',
  deliveredBy: 'Elevate',
  durationWeeks: 6,
  hoursPerWeekMin: 30,
  hoursPerWeekMax: 40,
  hoursBreakdown: {
    onlineInstruction: 120,
    handsOnLab: 200,
    examPrep: 40,
    careerPlacement: 20,
  },
  schedule: 'Mon–Fri, 30–40 hours per week',
  cohortSize: '8–12 participants per cohort',
  fundingStatement:
    'WIOA and Workforce Ready Grant funding available for eligible Indiana residents. Covers tuition, tools, and EPA 608 exam fees when approved. Eligibility is not guaranteed. Self-pay: $5,000. BNPL available.',
  selfPayCost: '$5,000',
  badge: 'WRG Funded',
  badgeColor: 'green',

  credentials: [
    {
      name: 'EPA 608 Universal Certification',
      issuer: 'U.S. Environmental Protection Agency',
      description:
        'Required by federal law to purchase and handle refrigerants. Universal covers all equipment types.',
      validity: 'Lifetime',
    },
    {
      name: 'OSHA 10 General Industry',
      issuer: 'OSHA',
      description: 'Workplace safety certification required by most HVAC employers.',
      validity: 'Recommended renewal every 5 years',
    },
    {
      name: 'HVAC Excellence Employment Ready Certificate',
      issuer: 'HVAC Excellence',
      description: 'Industry-recognized credential verifying entry-level HVAC competency.',
      validity: '3 years',
    },
  ],

  outcomes: [
    {
      statement: 'Wire a 24V thermostat control circuit and verify operation on a live unit',
      assessedAt: 'Week 2',
    },
    {
      statement:
        'Recover, evacuate to 500 microns, and recharge a system to manufacturer superheat spec',
      assessedAt: 'Week 4',
    },
    {
      statement: 'Install a split-system AC unit to manufacturer specification',
      assessedAt: 'Week 5',
    },
    {
      statement: 'Diagnose 5 distinct fault scenarios using a systematic electrical fault tree',
      assessedAt: 'Week 5',
    },
    {
      statement: 'Pass the EPA 608 Universal exam — all four sections — proctored on-site',
      assessedAt: 'Week 6',
    },
    {
      statement: 'Write a complete service ticket with parts, labor time, and customer explanation',
      assessedAt: 'Week 6',
    },
  ],

  careerPathway: [
    {
      title: 'HVAC Helper / Apprentice',
      timeframe: '0–6 months',
      requirements: 'EPA 608 + OSHA 10',
      salaryRange: '$18–$22/hr',
    },
    {
      title: 'HVAC Installer',
      timeframe: '6–18 months',
      requirements: 'EPA 608 + 1 year field experience',
      salaryRange: '$22–$28/hr',
    },
    {
      title: 'HVAC Service Technician',
      timeframe: '2–4 years',
      requirements: 'EPA 608 + diagnostic experience',
      salaryRange: '$28–$38/hr',
    },
    {
      title: 'Lead Technician / Foreman',
      timeframe: '4–7 years',
      requirements: 'Journeyman license + team lead experience',
      salaryRange: '$38–$50/hr',
    },
    {
      title: 'HVAC Business Owner',
      timeframe: '7+ years',
      requirements: 'Contractor license + business plan',
      salaryRange: '$60,000–$150,000+/yr',
    },
  ],

  enrollmentStartLabel: 'Rolling enrollment — monthly cohorts (8–12 seats)',
  weeklySchedule: [
    {
      week: 'Weeks 1–2',
      title: 'HVAC Fundamentals & Electrical',
      competencyMilestone:
        'Identify system components, read wiring diagrams, and test circuits with a multimeter',
    },
    {
      week: 'Weeks 3–4',
      title: 'Refrigeration Cycle & EPA 608 Prep',
      competencyMilestone:
        'Explain the refrigeration cycle, recover refrigerant, and pass EPA 608 Core practice at 80%+',
    },
    {
      week: 'Week 5',
      title: 'Installation & Diagnostics',
      competencyMilestone: 'Install a split-system AC unit and diagnose common fault scenarios',
    },
    {
      week: 'Week 6',
      title: 'EPA 608 Exam & Career Placement',
      competencyMilestone:
        'Pass EPA 608 Universal proctored on-site; complete resume and employer introductions',
    },
  ],

  curriculum: [
    {
      title: 'Weeks 1–2: Systems, Safety & Electrical',
      topics: [
        'Identify every component on a live split-system unit by name and function',
        'Apply lockout/tagout procedures before every live-equipment exercise',
        'Wire a 24V thermostat control circuit and read manufacturer wiring diagrams',
        'Diagnose a no-cooling call using a systematic electrical fault tree',
      ],
    },
    {
      title: 'Weeks 3–4: Refrigeration & EPA 608 Prep',
      topics: [
        'Connect manifold gauges and record suction and discharge pressures',
        'Recover refrigerant using an EPA-compliant recovery machine',
        'Evacuate a system to 500 microns and recharge to manufacturer superheat spec',
        'Complete EPA 608 Core practice exams at 80%+ before proctored testing',
      ],
    },
    {
      title: 'Week 5: Installation & Diagnostics',
      topics: [
        'Mount and commission a split-system AC unit to manufacturer specification',
        'Diagnose restricted metering devices and refrigerant leaks',
        'Write a service ticket with parts list, labor time, and customer explanation',
      ],
    },
    {
      title: 'Week 6: EPA 608 Exam & Career Placement',
      topics: [
        'Sit for the EPA 608 Universal proctored exam on-site (Core, Type I, II, III)',
        'Complete resume review, mock interview, and employer partner introductions',
      ],
    },
  ],

  complianceAlignment: [
    {
      standard: 'EPA Section 608',
      description:
        'Federal refrigerant handling certification — required by law for all technicians who purchase or handle refrigerants.',
    },
    {
      standard: 'OSHA 29 CFR 1910',
      description:
        'General industry safety standards covering lockout/tagout, electrical safety, and PPE.',
    },
    {
      standard: 'Indiana Workforce Ready Grant',
      description:
        'Program approved for WRG funding for eligible Indiana residents pursuing high-demand technical careers.',
    },
    {
      standard: 'WIOA Title I',
      description:
        'Eligible training provider under the Workforce Innovation and Opportunity Act for adult and dislocated worker funding.',
    },
  ],

  laborMarket: {
    medianSalary: 57300,
    salaryRange: '$38,000–$80,000',
    growthRate: '9% (faster than average)',
    source: 'U.S. Bureau of Labor Statistics',
    sourceYear: 2024,
    region: 'Indianapolis–Carmel–Anderson MSA',
  },

  careers: [
    { title: 'HVAC Installer', salary: '$18–$24/hr' },
    { title: 'Service Technician', salary: '$24–$38/hr' },
    { title: 'Commercial HVAC Tech', salary: '$32–$50/hr' },
    { title: 'Refrigeration Specialist', salary: '$35–$55/hr' },
  ],

  employerPartners: [
    'Gaylor Electric',
    'Summers Plumbing Heating & Cooling',
    'Service Experts',
  ],

  faqs: [
    {
      question: 'Do I need prior experience to enroll?',
      answer:
        'No prior HVAC experience is required. Basic math skills and the ability to work with hand tools are helpful. We start from fundamentals.',
    },
    {
      question: 'Is the EPA 608 exam included?',
      answer:
        'Yes. The EPA 608 Universal exam is proctored on-site at Elevate during Week 6. The exam fee is included in tuition (or covered by funding when applicable).',
    },
    {
      question: 'What funding is available?',
      answer:
        'WIOA and Indiana Workforce Ready Grant funding are available for eligible residents. Eligibility is determined by your local WorkOne office. Many students pay $0. Self-pay tuition is $5,000. BNPL financing available through Affirm and Sezzle.',
    },
    {
      question: 'What tools will I need?',
      answer:
        'A basic tool kit is provided during training. Graduates are expected to purchase their own professional tool set before starting employment. We provide a recommended list.',
    },
    {
      question: 'Is there job placement assistance?',
      answer:
        'Yes. Week 6 includes career placement: resume review, interview preparation, and direct introductions to our employer partners in the Indianapolis area.',
    },
  ],

  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Skilled Trades', href: '/programs/skilled-trades' },
    { label: 'HVAC Technician' },
  ],

  cta: {
    applyHref: '/programs/hvac-technician/apply',
    requestInfoHref: '/contact?program=hvac-technician',
  },

  metaTitle: 'HVAC Certification | EPA 608 Proctored On-Site | Indianapolis',
  metaDescription:
    '6-week HVAC certification in Indianapolis. EPA 608 Universal proctored on-site. WIOA and Workforce Ready Grant funding available for eligible Indiana residents. Small cohorts, hands-on lab.',

  enrollmentType: 'internal',
  deliveryModel: 'internal',
  lmsCourseSlug: 'hvac-technician',
  fundingOptions: ['wioa', 'wrg', 'impact'],


  funding: {
    wioa_eligible: true,
    fssa_eligible: true,
    wrg_eligible: true,
    jobReadyIndyEligible: true,
    fundingNotes: 'Indiana ETPL-listed. WIOA, WRG, and FSSA Gov Portal funding available. NHA EPA 608 certification program.',
  },
};
