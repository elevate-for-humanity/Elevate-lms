import type { ProgramSchema } from '@/lib/programs/program-schema';

export const CDL_TRAINING: ProgramSchema = {
  slug: 'cdl-training',
  title: 'CDL Class A Training',
  subtitle: 'Get your Commercial Driver\'s License in 3–6 weeks. Behind-the-wheel training, pre-trip inspection, and job placement with trucking companies.',
  sector: 'skilled-trades',
  category: 'Transportation',

  heroImage: '/images/pages/comp-pathway-trades.jpg',
  heroImageAlt: 'CDL student training with a semi-truck on a driving course',

  deliveryMode: 'hybrid',
  durationWeeks: 6,
  hoursPerWeekMin: 30,
  hoursPerWeekMax: 40,
  hoursBreakdown: {
    onlineInstruction: 40,
    handsOnLab: 120,
    examPrep: 20,
    careerPlacement: 10,
  },
  schedule: 'Mon–Fri, 30–40 hours per week (accelerated format)',
  cohortSize: '8–12 participants per cohort',
  fundingStatement: 'WIOA funding available for eligible Indiana residents. Covers tuition, DOT physical, drug screen, and CDL exam fees when approved. Eligibility not guaranteed. Self-pay: $4,500.',
  selfPayCost: '$4,500',
  badge: 'Funding Available',
  badgeColor: 'green',

  credentials: [
    { name: 'CDL Class A License', issuer: 'Indiana Bureau of Motor Vehicles', description: 'Commercial Driver\'s License authorizing operation of combination vehicles over 26,001 lbs GVWR.', validity: 'Renewable every 4 years' },
    { name: 'DOT Medical Card', issuer: 'Federal Motor Carrier Safety Administration', description: 'Medical certification required for all commercial motor vehicle operators.', validity: '2 years' },
    { name: 'OSHA 10 General Industry', issuer: 'OSHA', description: 'Workplace safety certification for general industry environments.', validity: 'Recommended renewal every 5 years' },
  ],

  outcomes: [
    { statement: 'Pass the CDL Class A knowledge test (general knowledge, air brakes, combination vehicles)', assessedAt: 'Week 2' },
    { statement: 'Perform a complete pre-trip inspection within 30 minutes', assessedAt: 'Week 3' },
    { statement: 'Execute straight-line backing, offset backing, and alley dock maneuvers', assessedAt: 'Week 4' },
    { statement: 'Drive safely in traffic, highway, and intersection conditions', assessedAt: 'Week 5' },
    { statement: 'Pass the Indiana CDL Class A skills test', assessedAt: 'Week 6' },
  ],

  careerPathway: [
    { title: 'Local/Regional Driver', timeframe: '0–6 months', requirements: 'CDL Class A', salaryRange: '$50,000–$65,000' },
    { title: 'OTR Truck Driver', timeframe: '0–12 months', requirements: 'CDL Class A + clean MVR', salaryRange: '$55,000–$75,000' },
    { title: 'Tanker/Hazmat Driver', timeframe: '1–2 years', requirements: 'CDL A + endorsements', salaryRange: '$60,000–$80,000' },
    { title: 'Owner-Operator', timeframe: '3–5 years', requirements: 'CDL A + business plan', salaryRange: '$80,000–$150,000+' },
  ],

  weeklySchedule: [
    { week: 'Week 1', title: 'CDL Knowledge & Regulations', competencyMilestone: 'Pass general knowledge practice test with 80%+' },
    { week: 'Week 2', title: 'Air Brakes & Combination Vehicles', competencyMilestone: 'Pass air brakes and combination vehicles practice tests' },
    { week: 'Week 3', title: 'Pre-Trip Inspection', competencyMilestone: 'Complete full pre-trip inspection within 30 minutes' },
    { week: 'Week 4', title: 'Basic Vehicle Control', competencyMilestone: 'Execute all backing maneuvers within scoring criteria' },
    { week: 'Week 5', title: 'On-Road Driving', competencyMilestone: 'Drive safely in traffic and highway conditions' },
    { week: 'Week 6', title: 'CDL Exam & Career Placement', competencyMilestone: 'Pass Indiana CDL Class A skills test' },
  ],

  curriculum: [
    { title: 'CDL Knowledge', topics: ['General knowledge test prep', 'Air brakes systems', 'Combination vehicles', 'Hazmat endorsement (optional)', 'DOT regulations and hours of service'] },
    { title: 'Pre-Trip Inspection', topics: ['Engine compartment inspection', 'Cab and controls check', 'External walk-around', 'Coupling and uncoupling', 'In-cab inspection procedures'] },
    { title: 'Basic Vehicle Control', topics: ['Straight-line backing', 'Offset backing (left and right)', 'Alley dock maneuver', 'Parallel parking', 'Sight-side backing'] },
    { title: 'On-Road Driving', topics: ['Lane changes and merging', 'Intersection navigation', 'Highway and interstate driving', 'Mountain and grade driving', 'Night driving techniques'] },
    { title: 'Career Readiness', topics: ['CDL exam scheduling', 'DOT physical requirements', 'Drug and alcohol testing compliance', 'Trucking company applications', 'Career placement support'] },
  ],

  complianceAlignment: [
    { standard: 'FMCSA Entry-Level Driver Training (ELDT)', description: 'Program meets federal ELDT requirements for CDL Class A training.' },
    { standard: 'Indiana BMV CDL Requirements', description: 'Curriculum aligned to Indiana CDL testing standards.' },
    { standard: 'WIOA Title I', description: 'Program meets WIOA eligibility for Individual Training Accounts (ITA).' },
  ],

  trainingPhases: [
    {
      phase: 1,
      title: 'Classroom & Knowledge Tests',
      weeks: 'Weeks 1–2',
      focus: 'CDL regulations, air brakes, combination vehicles, and DOT compliance.',
      labCompetencies: [
        'Pass general knowledge test with 80%+ score',
        'Pass air brakes knowledge test with 80%+ score',
        'Pass combination vehicles test with 80%+ score',
        'Identify all components during engine compartment walkthrough',
      ],
    },
    {
      phase: 2,
      title: 'Vehicle Control & Maneuvers',
      weeks: 'Weeks 3–4',
      focus: 'Pre-trip inspection, backing maneuvers, and basic vehicle control on the range.',
      labCompetencies: [
        'Complete pre-trip inspection in under 30 minutes',
        'Execute straight-line backing within lane boundaries',
        'Complete alley dock maneuver within scoring criteria',
        'Couple and uncouple a trailer safely',
      ],
    },
    {
      phase: 3,
      title: 'On-Road Training',
      weeks: 'Week 5',
      focus: 'Behind-the-wheel driving in traffic, highway, and intersection conditions.',
      labCompetencies: [
        'Merge onto highway safely with proper mirror usage',
        'Navigate intersections with correct right-of-way',
        'Maintain safe following distance (7-second rule)',
        'Execute lane changes with proper signaling and mirror checks',
      ],
    },
    {
      phase: 4,
      title: 'CDL Exam & Job Placement',
      weeks: 'Week 6',
      focus: 'Indiana CDL Class A skills test and employer placement.',
      labCompetencies: [
        'Pass Indiana CDL Class A skills test',
        'Complete DOT physical and drug screen',
        'Submit applications to 3+ trucking companies',
      ],
    },
  ],

  credentialPipeline: [
    { training: 'CDL Class A training (6 weeks)', certification: 'CDL Class A License', certBody: 'Indiana BMV', jobRole: 'Commercial Truck Driver' },
    { training: 'DOT physical and compliance', certification: 'DOT Medical Card', certBody: 'FMCSA', jobRole: 'All CDL positions' },
  ],

  laborMarket: {
    medianSalary: 62000,
    salaryRange: '$50,000–$80,000',
    growthRate: '4% (as fast as average)',
    source: 'U.S. Bureau of Labor Statistics',
    sourceYear: 2024,
    region: 'Indianapolis-Carmel-Anderson MSA',
  },

  careers: [
    { title: 'OTR Truck Driver', salary: '$55,000–$75,000' },
    { title: 'Local/Regional Driver', salary: '$50,000–$65,000' },
    { title: 'Tanker Driver', salary: '$60,000–$80,000' },
    { title: 'Owner-Operator', salary: '$80,000–$150,000+' },
  ],

  cta: { applyHref: '/apply', advisorHref: '/contact', courseHref: '/programs/cdl-training' },

  admissionRequirements: [
    '21 years or older (18 for intrastate only)',
    'Valid Indiana driver\'s license',
    'Pass DOT physical exam',
    'Pass pre-employment drug screen',
    'Clean driving record (no DUI/DWI in past 10 years)',
  ],
  equipmentIncluded: 'Training vehicle provided. CDL exam fees, DOT physical, and drug screen included with funding.',
  modality: 'Hybrid — Online theory via LMS, in-person behind-the-wheel training at Indianapolis facility',
  facilityInfo: 'Elevate training center and driving range, Indianapolis',
  employerPartners: ['Werner Enterprises', 'Schneider National', 'FedEx Freight', 'Indianapolis-area trucking companies'],
  pricingIncludes: ['CDL Class A exam fees', 'DOT physical exam', 'Drug screen', 'Training vehicle and fuel', 'Career placement support'],
  paymentTerms: 'WIOA funding available for eligible Indiana residents. Self-pay: $4,500 with payment plans available. Eligibility is determined through WorkOne.',

  faqs: [
    { question: 'Is CDL training really free?', answer: 'Yes, for eligible participants. WIOA funding covers tuition, DOT physical, drug screen, and CDL exam fees.' },
    { question: 'How long does it take?', answer: 'Most students complete the program in 3–6 weeks depending on schedule and skills progression.' },
    { question: 'Do I need a regular license first?', answer: 'Yes. You must have a valid Indiana driver\'s license. You must be at least 21 for interstate driving (18 for intrastate).' },
    { question: 'What about the drug test?', answer: 'CDL drivers are subject to DOT drug and alcohol testing. Pre-employment drug screen is required. Random testing continues throughout your career.' },
  ],

  breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Programs', href: '/programs' }, { label: 'CDL Training' }],
  metaTitle: 'CDL Training | Class A License | Indianapolis',
  metaDescription: 'Earn your CDL Class A license in 3–6 weeks. Behind-the-wheel training. Indianapolis. WIOA funding available for eligible Indiana residents.',
};
