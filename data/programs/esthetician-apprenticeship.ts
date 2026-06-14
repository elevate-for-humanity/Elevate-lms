import type { ProgramSchema } from '@/lib/programs/program-schema';

export const ESTHETICIAN_APPRENTICESHIP: ProgramSchema = {
  slug: 'esthetician-apprenticeship',
  title: 'Esthetician Apprenticeship',
  subtitle:
    'Earn your Indiana esthetician license through a registered apprenticeship. 2,000 hours of supervised training in a licensed spa or salon.',
  sector: 'personal-services',
  category: 'Esthetics',
  programType: 'apprenticeship',
  heroImage: '/images/beauty/esthetician.webp',
  heroImageAlt: 'Esthetician apprentice performing a professional facial treatment',
  videoSrc: '/videos/esthetician-spa.mp4',
  deliveryMode: 'in-person',
  deliveredBy: 'Partner',
  durationWeeks: 52,
  hoursPerWeekMin: 15,
  hoursPerWeekMax: 20,
  hoursBreakdown: { onlineInstruction: 500, handsOnLab: 400, examPrep: 50, careerPlacement: 50 },
  schedule: 'Flexible — 15–20 hrs/week (OJT at host spa + RTI online)',
  cohortSize: '1–3 apprentices per host site',
  fundingStatement:
    'Paid apprenticeship track available. For self-pay enrollment, BNPL starts at a $600 deposit with weekly payment options.',
  selfPayCost: '$4,980',
  fundingOptions: ['impact', 'employer_paid', 'self_pay'],
  badge: 'Earn & Learn',
  badgeColor: 'purple',
  credentials: [
    {
      name: 'Indiana Esthetician License',
      issuer: 'Indiana Professional Licensing Agency (IPLA)',
      description: 'State license to practice esthetics in Indiana.',
      validity: 'Renewable every 4 years',
    },
    {
      name: 'Infection Control Certificate',
      issuer: 'Elevate for Humanity',
      description: 'Sanitation and infection control for personal services.',
      validity: '2 years',
    },
    {
      name: 'CPR/AED/First Aid',
      issuer: 'American Heart Association',
      description: 'Emergency response certification.',
      validity: '2 years',
    },
  ],
  outcomes: [
    {
      statement: 'Perform facials, skin analysis, and hair removal on live clients',
      assessedAt: 'Month 4',
    },
    { statement: 'Complete 700 hours of supervised spa/salon training', assessedAt: 'Month 6' },
    {
      statement: 'Pass Indiana esthetician theory and practical exams',
      assessedAt: 'After 700 hours',
    },
    { statement: 'Maintain sanitation and infection control standards', assessedAt: 'Ongoing' },
    { statement: 'Demonstrate professional communication and client consultation skills', assessedAt: 'Month 3' },
  ],
  careerPathway: [
    {
      title: 'Esthetician Apprentice',
      timeframe: '0–6 months',
      requirements: 'Enrolled in apprenticeship',
      salaryRange: '$20,000–$26,000',
    },
    {
      title: 'Licensed Esthetician',
      timeframe: '6–12 months',
      requirements: 'Indiana license',
      salaryRange: '$28,000–$42,000',
    },
    {
      title: 'Lead Esthetician / Spa Manager',
      timeframe: '2+ years',
      requirements: 'License + experience',
      salaryRange: '$38,000–$55,000',
    },
  ],
  weeklySchedule: [
    {
      week: 'Month 1',
      title: 'Sanitation & Skin Science',
      competencyMilestone: 'Demonstrate sanitation protocols and basic skin analysis',
    },
    {
      week: 'Month 3',
      title: 'Facials & Treatments',
      competencyMilestone: 'Perform facial treatments on live clients',
    },
    {
      week: 'Month 5',
      title: 'Advanced & Licensing',
      competencyMilestone: 'Pass Indiana esthetician exams',
    },
  ],
  curriculum: [
    {
      title: 'Esthetic Services',
      topics: [
        'Facials and skin treatments',
        'Hair removal',
        'Chemical exfoliation awareness',
        'Product knowledge',
        'Client consultation',
      ],
    },
    {
      title: 'Safety & Compliance',
      topics: ['Infection control', 'Indiana Board rules', 'Chemical safety', 'Documentation'],
    },
  ],
  complianceAlignment: [
    {
      standard: 'Indiana IPLA Esthetics Standards',
      description: 'Apprenticeship meets Indiana 700-hour esthetics training requirements.',
    },
    {
      standard: 'DOL Registered Apprenticeship',
      description: 'Program registered with U.S. Department of Labor.',
    },
  ],
  trainingPhases: [
    {
      phase: 1,
      title: 'Foundations',
      weeks: 'Months 1–2',
      focus: 'Sanitation, skin science, and consultation skills.',
      labCompetencies: ['Demonstrate sanitation protocols', 'Conduct skin analysis'],
    },
    {
      phase: 2,
      title: 'Core Services',
      weeks: 'Months 3–4',
      focus: 'Facials, hair removal, and treatment protocols.',
      labCompetencies: ['Perform facial services', 'Execute hair removal safely'],
    },
    {
      phase: 3,
      title: 'Licensing',
      weeks: 'Months 5–6',
      focus: 'Exam prep and licensing submission.',
      labCompetencies: ['Pass practice exams', 'Submit licensing application'],
    },
  ],
  credentialPipeline: [
    {
      training: 'Esthetician Apprenticeship (~6 months)',
      certification: 'Indiana Esthetician License',
      certBody: 'Indiana Professional Licensing Agency',
      jobRole: 'Licensed Esthetician',
    },
  ],
  laborMarket: {
    medianSalary: 38400,
    salaryRange: '$22,000–$65,000+',
    growthRate: '9% (faster than average)',
    source: 'U.S. Bureau of Labor Statistics',
    sourceYear: 2024,
    region: 'Indianapolis-Carmel-Anderson MSA',
  },
  careers: [
    { title: 'Licensed Esthetician', salary: '$28,000–$42,000' },
    { title: 'Medical Spa Esthetician', salary: '$35,000–$55,000' },
    { title: 'Spa Manager', salary: '$40,000–$60,000' },
  ],
  cta: {
    applyHref: '/programs/esthetician-apprenticeship/apply',
    requestInfoHref: '/contact?program=esthetician-apprenticeship',
    careerConnectHref:
      'https://www.indianacareerconnect.com/jobs/search?q=esthetician&location=Indiana',
    advisorHref: '/contact',
    courseHref: '/programs/esthetician-apprenticeship',
  },
  admissionRequirements: [
    '16 years or older',
    'High school diploma or GED (or actively pursuing)',
    'Interest in esthetics career',
  ],
  equipmentIncluded: 'Basic kit provided. Spa supplies provided by host site.',
  modality: 'In-person — supervised training in a licensed spa or salon',
  facilityInfo: 'Partner spas and salons in the Indianapolis area',
  employerPartners: ['Licensed spas and salons in Indianapolis area'],
  pricingIncludes: [
    '700 hours supervised training',
    'Related instruction',
    'Infection control certification',
    'CPR/First Aid',
    'Licensing exam prep',
  ],
  paymentTerms:
    'Paid apprenticeship track remains available. For self-pay enrollment, start with a $600 deposit, then weekly payments or BNPL.',
  faqs: [
    {
      question: 'How long does it take?',
      answer: 'Approximately 6 months at 25–30 hours/week to complete the required 700 hours.',
    },
    {
      question: 'Do I get paid?',
      answer: 'Yes. Apprentices are employees of the host site and receive wages during training.',
    },
  ],
  breadcrumbs: [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'Esthetician Apprenticeship' },
  ],
  metaTitle: 'Esthetician Apprenticeship | Indiana Licensed | Indianapolis',
  metaDescription:
    'Earn your Indiana esthetician license through a paid apprenticeship. 700 hours of supervised training. Earn while you learn. Indianapolis.',
  funding: {
    wioa_eligible: false,
    fssa_eligible: true,
    wrg_eligible: false,
    jobReadyIndyEligible: false,
    fundingNotes:
      'DOL Registered Apprenticeship. FSSA IMPACT may be available. WIOA eligibility determined by Indiana DWD.',
  },
};
