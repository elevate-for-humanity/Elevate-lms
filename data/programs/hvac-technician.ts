import type { ProgramSchema } from '@/lib/programs/program-schema';

export const HVAC_TECHNICIAN: ProgramSchema = {
  slug: 'hvac-technician',
  title: 'HVAC Certification',
  subtitle:
    'Install, service, and repair heating and cooling systems in a 6-week hands-on program. EPA 608 Universal certification is proctored on-site. WIOA and Workforce Ready Grant funding may be available for eligible Indiana residents.',
  sector: 'skilled-trades',
  category: 'Certifications',
  programType: 'certification',

  heroImage: '/images/pexels/hvac.webp',
  heroImageAlt: 'HVAC technician servicing a rooftop unit in Indianapolis',
  videoSrc: '/videos/hvac-hero-final.mp4',

  deliveryMode: 'hybrid',
  deliveredBy: 'Elevate',
  durationWeeks: 6,
  hoursPerWeekMin: 30,
  hoursPerWeekMax: 40,
  hoursBreakdown: {
    onlineInstruction: 60,
    handsOnLab: 120,
    examPrep: 30,
    careerPlacement: 20,
  },
  schedule: 'Mon–Fri, 30–40 hours per week',
  cohortSize: '8–12 participants per cohort',
  fundingStatement:
    'WIOA and Workforce Ready Grant may be available for eligible Indiana residents when authorized by the responsible workforce agency. Self-pay tuition is $5,000.',
  selfPayCost: '$5,000',
  badge: 'Workforce-Funded',
  badgeColor: 'green',

  credentials: [
    {
      name: 'EPA 608 Universal Certification',
      issuer: 'U.S. Environmental Protection Agency approved testing provider',
      description:
        'Federal refrigerant-handling credential covering Core, Type I, Type II, and Type III requirements.',
      validity: 'Lifetime',
    },
    {
      name: 'OSHA 10 General Industry',
      issuer: 'OSHA-authorized training provider',
      description: 'Workplace safety training covering hazards commonly encountered in HVAC work.',
      validity: 'Employer requirements vary',
    },
    {
      name: 'HVAC Excellence Employment Ready Certificate',
      issuer: 'HVAC Excellence',
      description: 'Entry-level HVAC knowledge and employment-readiness credential.',
      validity: 'Per issuer requirements',
    },
  ],

  outcomes: [
    {
      statement: 'Identify major HVAC system components and explain the refrigeration cycle',
      assessedAt: 'Week 1',
    },
    {
      statement: 'Read wiring diagrams and safely test electrical circuits with a multimeter',
      assessedAt: 'Week 2',
    },
    {
      statement: 'Recover, evacuate, and recharge a training system using compliant procedures',
      assessedAt: 'Week 3',
    },
    {
      statement: 'Install and commission core split-system components in the hands-on lab',
      assessedAt: 'Week 4',
    },
    {
      statement: 'Diagnose common HVAC electrical and refrigeration faults using a systematic process',
      assessedAt: 'Week 5',
    },
    {
      statement: 'Complete EPA 608 Universal testing and career-readiness requirements',
      assessedAt: 'Week 6',
    },
  ],

  careerPathway: [
    {
      title: 'HVAC Helper / Entry-Level Technician',
      timeframe: '0–12 months',
      requirements: 'Program completion and employer requirements',
      salaryRange: '$18–$24/hr',
    },
    {
      title: 'HVAC Installer',
      timeframe: '1–2 years',
      requirements: 'EPA 608 plus field experience',
      salaryRange: '$22–$30/hr',
    },
    {
      title: 'HVAC Service Technician',
      timeframe: '2–4 years',
      requirements: 'EPA 608 plus diagnostic experience',
      salaryRange: '$28–$40/hr',
    },
    {
      title: 'Lead Technician / Foreman',
      timeframe: '4+ years',
      requirements: 'Advanced field experience and employer-required credentials',
      salaryRange: '$35–$50/hr',
    },
  ],

  weeklySchedule: [
    {
      week: 'Week 1',
      title: 'HVAC Systems & Safety',
      competencyMilestone:
        'Identify system components, apply lockout/tagout, and explain heat-transfer fundamentals.',
    },
    {
      week: 'Week 2',
      title: 'Electrical Systems',
      competencyMilestone:
        'Read wiring diagrams and test voltage, resistance, continuity, capacitors, and controls safely.',
    },
    {
      week: 'Week 3',
      title: 'Refrigeration & EPA 608 Fundamentals',
      competencyMilestone:
        'Use gauges and recovery equipment and demonstrate compliant refrigerant-handling procedures.',
    },
    {
      week: 'Week 4',
      title: 'Installation & Commissioning',
      competencyMilestone:
        'Complete supervised installation tasks and verify airflow, electrical operation, and system startup.',
    },
    {
      week: 'Week 5',
      title: 'Diagnostics & Service',
      competencyMilestone:
        'Diagnose common electrical, airflow, and refrigeration faults and document service findings.',
    },
    {
      week: 'Week 6',
      title: 'EPA 608 Testing & Career Readiness',
      competencyMilestone:
        'Complete final skills checks, EPA 608 Universal testing, resume preparation, and employer-readiness activities.',
    },
  ],

  curriculum: [
    {
      title: 'Week 1: Systems & Safety',
      topics: [
        'HVAC system components and heat transfer',
        'PPE and lockout/tagout',
        'Tool identification and safe use',
        'Basic mechanical and measurement skills',
      ],
    },
    {
      title: 'Week 2: Electrical Diagnostics',
      topics: [
        'Wiring diagrams and control circuits',
        'Multimeter use',
        'Capacitors, contactors, relays, motors, and transformers',
        'Electrical troubleshooting',
      ],
    },
    {
      title: 'Week 3: Refrigeration & EPA 608',
      topics: [
        'Refrigeration cycle and pressure-temperature relationships',
        'Manifold gauges and recovery equipment',
        'Evacuation and charging procedures',
        'EPA 608 Core and Type I–III preparation',
      ],
    },
    {
      title: 'Week 4: Installation',
      topics: [
        'Split-system installation fundamentals',
        'Line sets, condensate, electrical connections, and airflow',
        'Startup and commissioning checks',
        'Manufacturer specifications and documentation',
      ],
    },
    {
      title: 'Week 5: Service & Diagnostics',
      topics: [
        'No-cooling and no-heat diagnostic workflow',
        'Airflow and refrigerant fault identification',
        'Leak detection and service documentation',
        'Customer communication and service-ticket completion',
      ],
    },
    {
      title: 'Week 6: Certification & Employment',
      topics: [
        'EPA 608 Universal exam review and proctored testing',
        'Final hands-on competency checks',
        'Resume and technical interview preparation',
        'Employer introductions and job-search planning',
      ],
    },
  ],

  complianceAlignment: [
    {
      standard: 'EPA Section 608',
      description:
        'Training and exam preparation for federal refrigerant-handling certification requirements.',
    },
    {
      standard: 'OSHA General Industry Safety',
      description: 'Safety instruction relevant to HVAC installation and service work.',
    },
    {
      standard: 'Indiana workforce funding requirements',
      description:
        'WIOA and Workforce Ready Grant participation is subject to program approval, participant eligibility, and written authorization by the responsible agency.',
    },
  ],

  laborMarket: {
    medianSalary: 57300,
    salaryRange: '$38,000–$80,000',
    growthRate: 'See current BLS/O*NET data',
    source: 'U.S. Bureau of Labor Statistics',
    sourceYear: 2024,
    region: 'Indianapolis–Carmel–Anderson MSA',
  },

  careers: [
    { title: 'HVAC Installer', salary: '$18–$24/hr' },
    { title: 'Service Technician', salary: '$24–$38/hr' },
    { title: 'Commercial HVAC Technician', salary: '$32–$50/hr' },
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
        'No prior HVAC experience is required. Basic math skills and comfort using hand tools are helpful.',
    },
    {
      question: 'Is the EPA 608 exam included?',
      answer:
        'Yes. EPA 608 Universal testing is included in the 6-week program and is scheduled during Week 6.',
    },
    {
      question: 'What funding is available?',
      answer:
        'WIOA and Indiana Workforce Ready Grant may be available for eligible residents. WorkOne or the responsible workforce agency determines eligibility and must authorize funded training in writing. Self-pay tuition is $5,000.',
    },
    {
      question: 'What tools will I need?',
      answer:
        'Training equipment and required lab materials are provided for scheduled instruction. Employers may require graduates to obtain their own professional tools for employment.',
    },
    {
      question: 'Is there job placement assistance?',
      answer:
        'Yes. Career readiness and employer-introduction activities are included during Week 6. Employment is not guaranteed.',
    },
  ],

  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Skilled Trades', href: '/programs/skilled-trades' },
    { label: 'HVAC Certification' },
  ],

  cta: {
    applyHref: '/apply/student?program=hvac-technician',
    requestInfoHref: '/contact?program=hvac-technician',
  },

  metaTitle: 'HVAC Certification | EPA 608 | Indianapolis',
  metaDescription:
    '6-week HVAC certification in Indianapolis with hands-on training and EPA 608 Universal testing. WIOA and Workforce Ready Grant may be available for eligible Indiana residents.',

  enrollmentType: 'internal',
  deliveryModel: 'internal',
  lmsCourseSlug: 'hvac-technician',
  fundingOptions: ['wioa', 'wrg', 'self_pay'],

  funding: {
    wioa_eligible: true,
    fssa_eligible: false,
    wrg_eligible: true,
    jobReadyIndyEligible: false,
    fundingNotes:
      'Indiana ETPL-listed program. WIOA and Workforce Ready Grant may be available when participant eligibility and written authorization are confirmed by the responsible workforce agency.',
  },
};
