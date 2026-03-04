import type { ProgramSchema } from '@/lib/programs/program-schema';

/**
 * HVAC Technician — Canonical Reference Implementation
 * Program Detail Template v1
 *
 * This is the gold standard. All other programs must match this structure.
 * Hours math: 12 weeks × 20 hrs/week = 240 hours total
 */
export const HVAC_TECHNICIAN: ProgramSchema = {
  // ─── Identity ────────────────────────────────────────────────────
  slug: 'hvac-technician',
  title: 'HVAC Technician',
  subtitle: 'Install, maintain, and repair heating and cooling systems. Earn EPA 608 Universal, OSHA 30, and CPR/AED certifications in 12 weeks.',
  sector: 'skilled-trades',
  category: 'Skilled Trades',

  // ─── Media ───────────────────────────────────────────────────────
  heroImage: '/images/trades/hero-program-hvac.jpg',
  heroImageAlt: 'HVAC technician servicing an air conditioning unit',
  videoSrc: '/videos/hvac-hero-final.mp4',
  voiceoverSrc: '/audio/heroes/skilled-trades.mp3',

  // ─── A. Header Spec Panel ────────────────────────────────────────
  deliveryMode: 'hybrid',
  durationWeeks: 12,
  hoursPerWeekMin: 15,
  hoursPerWeekMax: 20,
  hoursBreakdown: {
    onlineInstruction: 90,
    handsOnLab: 100,
    examPrep: 30,
    careerPlacement: 20,
  },
  schedule: 'Mon–Fri, 8:00 AM–12:00 PM (20 hrs/week)',
  eveningSchedule: 'Evening/weekend cohorts available for working adults.',
  cohortSize: '10–15 participants per cohort',
  fundingStatement: '$0 with WIOA funding. Next Level Jobs and Workforce Ready Grant accepted.',
  selfPayCost: '$5,000 (payment plans available)',
  badge: 'Funding Available',
  badgeColor: 'orange',

  // ─── B. Credentials Earned ───────────────────────────────────────
  credentials: [
    {
      name: 'EPA 608 Universal',
      issuer: 'EPA via ESCO Institute / Mainstream Engineering',
      description: 'Federal certification required by law to purchase or handle refrigerants. Covers all equipment types.',
      validity: 'Lifetime (no renewal required)',
    },
    {
      name: 'OSHA 30-Hour Construction Safety',
      issuer: 'U.S. Department of Labor / OSHA',
      description: 'DOL-issued card covering fall protection, electrical safety, HazCom, and confined spaces.',
      validity: 'Lifetime (DOL card)',
    },
    {
      name: 'CPR / First Aid / AED',
      issuer: 'American Heart Association or American Red Cross',
      description: 'Nationally accredited emergency response certification.',
      validity: '2 years',
    },
    {
      name: 'Residential HVAC Certification 1 & 2',
      issuer: 'Elevate for Humanity (internal)',
      description: 'Competency-based assessment covering residential heating and cooling system installation and service.',
    },
    {
      name: 'Rise Up Retail Industry Fundamentals',
      issuer: 'NRF Foundation',
      description: 'Customer service and workplace readiness credential recognized by national retailers.',
    },
  ],

  // ─── C. Program Outcomes ─────────────────────────────────────────
  outcomes: [
    { statement: 'Calculate superheat and subcooling within ±2°F using PT charts', assessedAt: 'Week 5' },
    { statement: 'Evacuate a system to 500 microns and verify with a micron gauge', assessedAt: 'Week 7' },
    { statement: 'Diagnose 3 common AC faults within 30 minutes each using systematic troubleshooting', assessedAt: 'Week 11' },
    { statement: 'Pass the EPA 608 Universal exam (70% per section, 80 questions)', assessedAt: 'Week 12' },
    { statement: 'Measure combustion byproducts and verify CO below 100 ppm', assessedAt: 'Week 4' },
    { statement: 'Read wiring diagrams and test electrical components with ±5% multimeter accuracy', assessedAt: 'Week 3' },
    { statement: 'Braze refrigerant lines and pass a 150 psi nitrogen pressure test', assessedAt: 'Week 9' },
    { statement: 'Identify all 10 HVAC tools and demonstrate safe LOTO procedures per OSHA 1910.147', assessedAt: 'Week 1' },
  ],

  // ─── D. Career Pathway ───────────────────────────────────────────
  careerPathway: [
    {
      title: 'HVAC Apprentice / Helper',
      timeframe: '0–6 months after program',
      requirements: 'EPA 608 + OSHA 30 (earned in program)',
      salaryRange: '$35,000–$42,000',
    },
    {
      title: 'HVAC Technician',
      timeframe: '6 months – 3 years',
      requirements: '1–3 years field experience + employer training',
      salaryRange: '$42,000–$55,000',
    },
    {
      title: 'Journeyman HVAC Technician',
      timeframe: '3–5 years',
      requirements: 'State journeyman license (where required) + advanced diagnostics',
      salaryRange: '$55,000–$65,000',
    },
    {
      title: 'Master Technician / Service Manager',
      timeframe: '5+ years',
      requirements: 'NATE certification + leadership experience',
      salaryRange: '$65,000–$85,000',
    },
  ],

  // ─── E. Weekly Schedule ──────────────────────────────────────────
  weeklySchedule: [
    { week: 'Week 1–2', title: 'Foundations', competencyMilestone: 'Identify all HVAC tools (10/10), demonstrate LOTO, explain the refrigeration cycle' },
    { week: 'Week 3', title: 'Electrical Basics', competencyMilestone: 'Read wiring diagrams, test with multimeter (±5% accuracy), identify capacitors and contactors' },
    { week: 'Week 4', title: 'Heating Systems', competencyMilestone: 'Measure temperature rise (±5°F of nameplate), verify CO below 100 ppm' },
    { week: 'Week 5', title: 'Cooling & Refrigeration', competencyMilestone: 'Calculate superheat/subcooling within ±2°F, 5-second PT chart lookup' },
    { week: 'Week 6', title: 'EPA 608 Core', competencyMilestone: 'Pass 25-question Core practice exam at 85%, classify 10 refrigerants by ODP' },
    { week: 'Week 7', title: 'EPA 608 Type I & II', competencyMilestone: 'Evacuate to 500 microns, demonstrate leak detection methods' },
    { week: 'Week 8', title: 'EPA 608 Type III & Universal Prep', competencyMilestone: 'Pass 100-question Universal practice exam (70% per section)' },
    { week: 'Week 9–10', title: 'Advanced Skills', competencyMilestone: 'Charge by superheat/subcooling (±2°F), pass 150 psi braze test, 4/4 fault diagnoses' },
    { week: 'Week 11', title: 'Troubleshooting & OSHA', competencyMilestone: '3 faults diagnosed in 30 min each, complete OSHA 30-Hour certification' },
    { week: 'Week 12', title: 'Certification & Placement', competencyMilestone: 'Pass proctored EPA 608 exam, earn CPR/AED, complete mock interviews' },
  ],

  // ─── F. Course Modules ───────────────────────────────────────────
  curriculum: [
    {
      title: 'HVAC Fundamentals & Safety',
      topics: ['Program orientation and workforce readiness', 'How HVAC systems work — heating, cooling, ventilation', 'HVAC tools and equipment identification (10/10 practical)', 'PPE and shop safety — LOTO per OSHA 1910.147', 'System components identification lab'],
    },
    {
      title: 'Electrical Basics',
      topics: ['Voltage, current, resistance, and Ohm\'s Law', 'Reading wiring diagrams and schematics', 'Multimeter operation and electrical testing (±5% accuracy)', 'Capacitors, contactors, and relays'],
    },
    {
      title: 'Heating Systems',
      topics: ['Gas furnace operation and ignition systems', 'Electric heat and heat strips', 'Heat pump heating mode and reversing valve', 'Combustion analysis — CO below 100 ppm', 'Temperature rise measurement (±5°F of nameplate)'],
    },
    {
      title: 'Cooling & Refrigeration',
      topics: ['The refrigeration cycle — 4 stages', 'Pressure-temperature relationship and PT charts (5-second lookup)', 'Superheat and subcooling measurement (±2°F)', 'Compressor types and metering devices'],
    },
    {
      title: 'EPA 608 Core',
      topics: ['Ozone layer and environmental impact', 'Clean Air Act Section 608 regulations and fines', 'Refrigerant safety and cylinder handling', 'Refrigerant types: CFC, HCFC, HFC, HFO — classify 10 by ODP', 'Recovery, recycling, and reclamation definitions', '25-question Core practice exam (85% to pass)'],
    },
    {
      title: 'EPA 608 Type I & II',
      topics: ['Small appliance systems (Type I) — <5 lbs refrigerant', 'Recovery requirements: 90%/80%/0% by date and type', 'High-pressure systems (Type II) — R-410A, R-22, R-134a', 'Evacuation to 500 microns', 'Leak detection methods — electronic, UV dye, soap bubbles', 'Leak repair timelines (10%/20% triggers)'],
    },
    {
      title: 'EPA 608 Type III & Universal Prep',
      topics: ['Low-pressure systems and centrifugal chillers', 'Purge units and vacuum operation', 'Type III recovery: 0 psig <200 lbs, 25 mm Hg absolute ≥200 lbs', '100-question Universal practice exam (70% per section)', 'Section comparison charts and weak-area review'],
    },
    {
      title: 'Advanced Diagnostics & Installation',
      topics: ['Refrigerant charging: subcooling and superheat methods (±2°F)', 'System diagnostics with manifold gauges — 4/4 fault diagnoses', 'Ductwork design and static pressure (±0.02 in. w.c.)', 'Equipment sizing (Manual J basics)', 'Brazing and line set installation — passes 150 psi nitrogen test'],
    },
    {
      title: 'Systematic Troubleshooting & OSHA 30',
      topics: ['Systematic troubleshooting method (6 steps)', 'Common AC failures: bad capacitor, frozen coil, low charge', 'Common heating failures: ignition, heat exchanger, gas valve', '3 faults diagnosed in 30 minutes each', 'OSHA 30-Hour Construction Safety certification', 'Fall protection, electrical safety, HazCom, confined spaces'],
    },
    {
      title: 'Certification & Career Placement',
      topics: ['Proctored EPA 608 Universal exam (ESCO/Mainstream Engineering)', 'CPR/First Aid/AED certification', 'Resume building and portfolio preparation', 'Mock interviews for HVAC positions', 'Employer introductions and placement support'],
    },
  ],

  // ─── G. Standards & Compliance ───────────────────────────────────
  complianceAlignment: [
    { standard: 'EPA Section 608', description: 'Federal certification for refrigerant handling. Proctored exam administered by EPA-approved certifying organizations.' },
    { standard: 'OSHA 29 CFR 1926', description: 'Construction industry safety standards. 30-hour training covers fall protection, electrical, HazCom, and confined spaces.' },
    { standard: 'WIOA Title I', description: 'Program eligible for Workforce Innovation and Opportunity Act funding through Indiana DWD.' },
    { standard: 'Indiana Next Level Jobs', description: 'Workforce Ready Grant and Employer Training Grant eligible program.' },
    { standard: 'ETPL Listed', description: 'Eligible Training Provider List — approved for Individual Training Accounts through local workforce boards.' },
  ],

  // ─── H. Labor Market Info ────────────────────────────────────────
  laborMarket: {
    medianSalary: 52000,
    salaryRange: '$38,000–$80,000',
    growthRate: '+6% (faster than average)',
    source: 'U.S. Bureau of Labor Statistics, Occupational Outlook Handbook',
    sourceYear: 2024,
    region: 'Indiana',
  },
  careers: [
    { title: 'HVAC Technician', salary: '$42,000–$62,000' },
    { title: 'HVAC Installer', salary: '$38,000–$55,000' },
    { title: 'Maintenance Technician', salary: '$40,000–$58,000' },
    { title: 'Refrigeration Technician', salary: '$45,000–$65,000' },
    { title: 'HVAC Service Manager', salary: '$55,000–$80,000' },
  ],

  // ─── I. CTA ──────────────────────────────────────────────────────
  cta: {
    applyHref: '/apply?program=hvac-technician',
    advisorHref: '/contact',
    courseHref: '/programs/hvac-technician/course',
  },

  // ─── J. Institutional Footer ─────────────────────────────────────
  admissionRequirements: [
    '18 years or older',
    'High school diploma or GED (or actively pursuing)',
    'Able to lift 50 lbs',
    'No prior HVAC experience required',
  ],
  equipmentIncluded: 'All PPE, tools, training materials, and certification exam fees included',
  modality: 'Hybrid — Online Related Technical Instruction via LMS, hands-on labs at training facility, On-the-Job Training at employer sites',
  facilityInfo: 'Elevate training center, Indianapolis',
  bilingualSupport: 'Bilingual (English/Spanish) instruction available. LMS supports Spanish language accessibility.',
  employerPartners: [
    '2 HVAC employer partners (onboarding)',
    'Jesse J. Wilkerson & Associates — Construction',
  ],
  pricingIncludes: [
    '240 instructional hours (12 weeks)',
    'EPA 608 Universal exam fee (ESCO or Mainstream Engineering)',
    'OSHA 30-Hour Construction Safety certification',
    'CPR/First Aid/AED certification',
    'All PPE, tools, and materials',
    'LMS access for full program duration',
    'Career placement support and resume assistance',
  ],
  paymentTerms: 'WIOA, Next Level Jobs, and Workforce Ready Grant funding accepted. Payment plans available for self-pay students.',

  // ─── FAQ ─────────────────────────────────────────────────────────
  faqs: [
    { question: 'Do I need HVAC experience?', answer: 'No. This program starts from the basics. Week 1 covers orientation, tools, and safety. You will learn refrigeration theory, electrical fundamentals, and hands-on skills from scratch.' },
    { question: 'Is this program free?', answer: 'Yes, for eligible participants. WIOA, Next Level Jobs, and Workforce Ready Grant funding covers tuition, tools, certification exam fees, and materials. If you do not qualify for funding, self-pay is $5,000 with payment plans available.' },
    { question: 'What is EPA 608?', answer: 'EPA Section 608 is a federal certification required by law for anyone who purchases or handles refrigerants. The Universal level covers all equipment types. The exam has 80 questions across 4 sections — you need 70% on each section to pass.' },
    { question: 'What certifications will I earn?', answer: 'EPA 608 Universal, OSHA 30-Hour Construction Safety, CPR/First Aid/AED, Residential HVAC Certification 1 & 2, and Rise Up (NRF Foundation). All exam fees are included.' },
    { question: 'How is the program structured?', answer: 'The 12-week program uses a hybrid model: Related Technical Instruction is delivered online through our LMS. Hands-on labs are completed at the training facility. On-the-Job Training occurs at employer partner sites.' },
    { question: 'What happens after I graduate?', answer: 'Our career services team helps with resume building, mock interviews, and direct introductions to HVAC employer partners. The median salary for HVAC technicians in Indiana is $52,000/year.' },
  ],

  // ─── Navigation ──────────────────────────────────────────────────
  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Skilled Trades', href: '/programs/skilled-trades' },
    { label: 'HVAC Technician' },
  ],

  // ─── SEO ─────────────────────────────────────────────────────────
  metaTitle: 'HVAC Technician Training | EPA 608 Certified | Indianapolis',
  metaDescription: '12-week HVAC program. EPA 608 Universal, OSHA 30, and 5 industry credentials. 180–240 hours. Funding available through WIOA and Next Level Jobs.',
};
