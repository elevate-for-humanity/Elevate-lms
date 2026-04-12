import type { ProgramSchema } from '@/lib/programs/program-schema';

export const HVAC_TECHNICIAN: ProgramSchema = {
  slug: 'hvac-technician',
  title: 'HVAC Technician',
  subtitle: 'Install, service, and repair heating and cooling systems. EPA 608 Universal certification proctored on-site. 12 weeks. WIOA and Workforce Ready Grant funding available for eligible Indiana residents.',
  sector: 'skilled-trades',
  category: 'Skilled Trades',

  heroImage: '/images/pages/hvac-unit.jpg',
  heroImageAlt: 'HVAC technician servicing a rooftop unit in Indianapolis',
  videoSrc: '/videos/hvac-hero.mp4',

  deliveryMode: 'hybrid',
  durationWeeks: 12,
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
  fundingStatement: 'WIOA and Workforce Ready Grant funding available for eligible Indiana residents. Covers tuition, tools, and EPA 608 exam fees when approved. Eligibility is not guaranteed. Self-pay: $4,200.',
  selfPayCost: '$4,200',
  badge: 'WRG Funded',
  badgeColor: 'green',

  credentials: [
    {
      name: 'EPA 608 Universal Certification',
      issuer: 'U.S. Environmental Protection Agency',
      description: 'Required by federal law to purchase and handle refrigerants. Universal covers all equipment types.',
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
    { statement: 'Wire a 24V thermostat control circuit and verify operation on a live unit', assessedAt: 'Week 4' },
    { statement: 'Recover, evacuate to 500 microns, and recharge a system to manufacturer superheat spec', assessedAt: 'Week 6' },
    { statement: 'Install a split-system AC and gas furnace from line set to commissioning', assessedAt: 'Week 8' },
    { statement: 'Diagnose 5 distinct fault scenarios using a systematic electrical fault tree', assessedAt: 'Week 10' },
    { statement: 'Pass the EPA 608 Universal exam — all four sections — proctored on-site', assessedAt: 'Week 11' },
    { statement: 'Write a complete service ticket with parts, labor time, and customer explanation', assessedAt: 'Week 10' },
  ],

  careerPathway: [
    { title: 'HVAC Helper / Apprentice', timeframe: '0–6 months', requirements: 'EPA 608 + OSHA 10', salaryRange: '$18–$22/hr' },
    { title: 'HVAC Installer', timeframe: '6–18 months', requirements: 'EPA 608 + 1 year field experience', salaryRange: '$22–$28/hr' },
    { title: 'HVAC Service Technician', timeframe: '2–4 years', requirements: 'EPA 608 + diagnostic experience', salaryRange: '$28–$38/hr' },
    { title: 'Lead Technician / Foreman', timeframe: '4–7 years', requirements: 'Journeyman license + team lead experience', salaryRange: '$38–$50/hr' },
    { title: 'HVAC Business Owner', timeframe: '7+ years', requirements: 'Contractor license + business plan', salaryRange: '$60,000–$150,000+/yr' },
  ],

  weeklySchedule: [
    { week: 'Weeks 1–2', title: 'HVAC Fundamentals', competencyMilestone: 'Identify all major system components and explain heat transfer principles' },
    { week: 'Weeks 3–4', title: 'Electrical Systems', competencyMilestone: 'Read wiring diagrams and safely test circuits with a multimeter' },
    { week: 'Weeks 5–6', title: 'Refrigeration Cycle', competencyMilestone: 'Explain the refrigeration cycle and pass EPA 608 Core practice exam at 80%+' },
    { week: 'Weeks 7–8', title: 'System Installation & Repair', competencyMilestone: 'Install a split-system AC unit to manufacturer specification' },
    { week: 'Weeks 9–10', title: 'Advanced Diagnostics', competencyMilestone: 'Diagnose 5 common fault scenarios using systematic troubleshooting' },
    { week: 'Week 11', title: 'EPA 608 Exam Prep', competencyMilestone: 'Pass EPA 608 Universal proctored exam on-site' },
    { week: 'Week 12', title: 'Career Placement', competencyMilestone: 'Complete resume, interview prep, and employer introductions' },
  ],

  curriculum: [
    {
      title: 'Weeks 1–2: Systems & Safety',
      topics: [
        'Identify every component on a live split-system unit by name and function',
        'Use a multimeter to measure voltage, resistance, and continuity on real equipment',
        'Apply lockout/tagout procedures before every live-equipment exercise',
        'Read a manufacturer wiring diagram and trace the control circuit',
      ],
    },
    {
      title: 'Weeks 3–4: Electrical Diagnostics',
      topics: [
        'Wire a 24V thermostat control circuit from scratch',
        'Test and replace a failed capacitor, contactor, and relay on a training unit',
        'Diagnose a no-cooling call using a systematic electrical fault tree',
        'Measure amperage draw and compare against nameplate rating to identify overload',
      ],
    },
    {
      title: 'Weeks 5–6: Refrigeration & EPA 608',
      topics: [
        'Connect manifold gauges to a live system and record suction and discharge pressures',
        'Recover refrigerant from a system using an EPA-compliant recovery machine',
        'Evacuate a system to 500 microns and verify with an electronic micron gauge',
        'Recharge a system to manufacturer spec and verify superheat and subcooling',
      ],
    },
    {
      title: 'Weeks 7–8: Installation',
      topics: [
        'Mount and level an outdoor condenser unit on a pad',
        'Run and insulate refrigerant line sets between indoor and outdoor units',
        'Install a gas furnace, connect venting, and perform a combustion analysis',
        'Commission a completed system and verify airflow at every register',
      ],
    },
    {
      title: 'Weeks 9–10: Diagnostics on Real Calls',
      topics: [
        'Diagnose a system with a restricted metering device and document findings',
        'Identify and repair a refrigerant leak using electronic leak detection',
        'Troubleshoot a heat pump that fails to switch between heating and cooling modes',
        'Write a service ticket with parts list, labor time, and customer explanation',
      ],
    },
    {
      title: 'Week 11: EPA 608 Exam',
      topics: [
        'Sit for the EPA 608 Universal proctored exam on-site at Elevate',
        'Core, Type I, Type II, and Type III sections — all four required for Universal',
      ],
    },
    {
      title: 'Week 12: Career Placement',
      topics: [
        'Complete a resume reviewed by an industry employer',
        'Participate in a mock technical interview with an HVAC contractor',
        "Receive direct introductions to Elevate's employer partners in Indianapolis",
      ],
    },
  ],

  complianceAlignment: [
    { standard: 'EPA Section 608', description: 'Federal refrigerant handling certification — required by law for all technicians who purchase or handle refrigerants.' },
    { standard: 'OSHA 29 CFR 1910', description: 'General industry safety standards covering lockout/tagout, electrical safety, and PPE.' },
    { standard: 'Indiana Workforce Ready Grant', description: 'Program approved for WRG funding for eligible Indiana residents pursuing high-demand technical careers.' },
    { standard: 'WIOA Title I', description: 'Eligible training provider under the Workforce Innovation and Opportunity Act for adult and dislocated worker funding.' },
  ],

  laborMarket: {
    medianSalary: 57300,
    salaryRange: '$38,000–$80,000',
    growthRate: '9% (faster than average)',
    source: 'U.S. Bureau of Labor Statistics',
    sourceYear: 2024,
    region: 'Indianapolis–Carmel–Anderson MSA',
  },

  careerOutcomes: [
    { title: 'HVAC Installer', salary: '$18–$24/hr' },
    { title: 'Service Technician', salary: '$24–$38/hr' },
    { title: 'Commercial HVAC Tech', salary: '$32–$50/hr' },
    { title: 'Refrigeration Specialist', salary: '$35–$55/hr' },
  ],

  employerPartners: [
    { name: 'Gaylor Electric', logoUrl: null, hiringUrl: null },
    { name: 'Summers Plumbing Heating & Cooling', logoUrl: null, hiringUrl: null },
    { name: 'Service Experts', logoUrl: null, hiringUrl: null },
  ],

  faqs: [
    {
      question: 'Do I need prior experience to enroll?',
      answer: 'No prior HVAC experience is required. Basic math skills and the ability to work with hand tools are helpful. We start from fundamentals.',
    },
    {
      question: 'Is the EPA 608 exam included?',
      answer: 'Yes. The EPA 608 Universal exam is proctored on-site at Elevate during Week 11. The exam fee is included in tuition (or covered by funding when applicable).',
    },
    {
      question: 'What funding is available?',
      answer: 'WIOA and Indiana Workforce Ready Grant funding are available for eligible residents. Eligibility is determined by your local WorkOne office. Many students pay $0. Self-pay tuition is $4,200.',
    },
    {
      question: 'What tools will I need?',
      answer: 'A basic tool kit is provided during training. Graduates are expected to purchase their own professional tool set before starting employment. We provide a recommended list.',
    },
    {
      question: 'Is there job placement assistance?',
      answer: 'Yes. Week 12 is dedicated to career placement: resume review, interview preparation, and direct introductions to our employer partners in the Indianapolis area.',
    },
  ],

  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Skilled Trades', href: '/programs/skilled-trades' },
    { label: 'HVAC Technician' },
  ],

  cta: {
    applyHref: '/apply/student?program=hvac-technician',
    requestInfoHref: '/contact?program=hvac-technician',
  },

  metaTitle: 'HVAC Technician Training | EPA 608 Proctored On-Site | Indianapolis',
  metaDescription: '12-week HVAC program in Indianapolis. EPA 608 Universal proctored on-site. WIOA and Workforce Ready Grant funding available for eligible Indiana residents. Small cohorts, hands-on lab.',

  enrollmentType: 'internal',
  deliveryModel: 'internal',
  lmsCourseSlug: 'hvac-technician',
  fundingOptions: ['wioa', 'wrg', 'impact'],
};
