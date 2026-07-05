import type { ProgramSchema } from '@/lib/programs/program-schema';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const HOSPITALITY: ProgramSchema = {
  slug: 'hospitality',
  title: 'Hospitality & Customer Service',
  subtitle:
    'Build a career in hotels, restaurants, and event services. Earn industry-recognized credentials in hospitality operations and customer service.',
  sector: 'business',
  category: 'Hospitality & Tourism',
  programType: 'workforce',
  heroImage: '/images/pages/culinary.webp',
  heroImageAlt: 'Hospitality professional at a hotel front desk',
  deliveryMode: 'hybrid',
  deliveredBy: 'Elevate',
  durationWeeks: 8,
  hoursPerWeekMin: 15,
  hoursPerWeekMax: 20,
  hoursBreakdown: { onlineInstruction: 40, handsOnLab: 40, examPrep: 10, careerPlacement: 10 },
  schedule: 'Flexible — evenings and weekends available',
  cohortSize: '10–15 participants per cohort',
  fundingStatement:
    'WIOA and Workforce Ready Grant funding available for eligible Indiana residents.',
  selfPayCost: 'See individual courses',
  fundingOptions: ['wioa', 'wrg', 'impact', 'self_pay'],

  // Individual course pricing
  coursePricing: [
    { slug: 'start-hospitality', name: 'Start in Hospitality', price: 89, credentials: ['Hospitality Certificate'] },
    { slug: 'servsafe-food-handler', name: 'ServSafe Food Handler', price: 29, credentials: ['ServSafe Food Handler'] },
    { slug: 'servsafe-manager', name: 'ServSafe Manager', price: 199, credentials: ['ServSafe Manager Certification'] },
    { slug: 'servsuccess', name: 'ServSuccess Professional', price: 129, credentials: ['ServSuccess Certificate'] },
    { slug: 'guest-service-gold', name: 'Guest Service Gold', price: 0, credentials: ['Guest Service Gold Certification'] },
  ],
  badge: 'In Demand',
  badgeColor: 'blue',
  credentials: [
    {
      name: 'Hospitality & Customer Service Certificate',
      issuer: 'Elevate for Humanity',
      description:
        'Covers front desk operations, guest relations, food service, and event coordination.',
      validity: 'Lifetime',
    },
    {
      name: 'ServSafe Food Handler',
      issuer: 'National Restaurant Association',
      description: 'Nationally recognized food safety certification.',
      validity: '3 years',
    },
    {
      name: 'CPR/AED/First Aid',
      issuer: 'American Heart Association',
      description: 'Emergency response certification.',
      validity: '2 years',
    },
  ],
  outcomes: [
    { statement: 'Manage front desk check-in and check-out procedures', assessedAt: 'Week 4' },
    {
      statement: 'Handle guest complaints and service recovery professionally',
      assessedAt: 'Week 5',
    },
    { statement: 'Coordinate event setup and execution', assessedAt: 'Week 7' },
    { statement: 'Pass ServSafe Food Handler certification exam', assessedAt: 'Week 6' },
    { statement: 'Maintain cleanliness and safety standards per brand guidelines', assessedAt: 'Week 3' },
  ],
  careerPathway: [
    {
      title: 'Front Desk Agent',
      timeframe: '0–6 months',
      requirements: 'Hospitality certificate',
      salaryRange: '$28,000–$36,000',
    },
    {
      title: 'Guest Services Supervisor',
      timeframe: '1–2 years',
      requirements: 'Experience + leadership',
      salaryRange: '$36,000–$46,000',
    },
    {
      title: 'Hotel Operations Manager',
      timeframe: '3–5 years',
      requirements: 'Supervisor experience',
      salaryRange: '$46,000–$65,000',
    },
  ],
  weeklySchedule: [
    {
      week: 'Week 1–2',
      title: 'Hospitality Industry Overview',
      competencyMilestone: 'Identify key roles and departments in hotel and restaurant operations',
    },
    {
      week: 'Week 3–4',
      title: 'Front Desk & Guest Relations',
      competencyMilestone: 'Complete simulated check-in and check-out procedures',
    },
    {
      week: 'Week 5–6',
      title: 'Food Service & ServSafe',
      competencyMilestone: 'Pass ServSafe Food Handler exam',
    },
    {
      week: 'Week 7–8',
      title: 'Event Coordination & Career Prep',
      competencyMilestone: 'Plan and present a mock event proposal',
    },
  ],
  curriculum: [
    {
      title: 'Hospitality Fundamentals',
      topics: [
        'Industry overview',
        'Hotel departments',
        'Guest experience standards',
        'Professional communication',
        'Cultural competency',
      ],
    },
    {
      title: 'Front Desk Operations',
      topics: [
        'Reservation systems',
        'Check-in/check-out',
        'Billing and payments',
        'Complaint resolution',
        'Upselling techniques',
      ],
    },
    {
      title: 'Food & Beverage Service',
      topics: [
        'ServSafe food safety',
        'Table service standards',
        'Menu knowledge',
        'Alcohol awareness',
        'Banquet operations',
      ],
    },
    {
      title: 'Event Coordination',
      topics: [
        'Event planning basics',
        'Vendor coordination',
        'Setup and breakdown',
        'Client communication',
        'Budget management',
      ],
    },
  ],
  complianceAlignment: [
    {
      standard: 'WIOA Title I',
      description: 'Program meets WIOA eligibility for short-term training.',
    },
    {
      standard: 'Indiana INDemand Jobs',
      description: 'Hospitality is a high-demand sector in Indiana.',
    },
  ],
  trainingPhases: [
    {
      phase: 1,
      title: 'Industry Foundations',
      weeks: 'Weeks 1–2',
      focus: 'Hospitality industry overview and professional standards.',
      labCompetencies: [
        'Identify hotel departments',
        'Demonstrate professional guest communication',
      ],
    },
    {
      phase: 2,
      title: 'Operations & Service',
      weeks: 'Weeks 3–6',
      focus: 'Front desk, food service, and ServSafe certification.',
      labCompetencies: [
        'Complete check-in simulation',
        'Pass ServSafe exam',
        'Handle guest complaint scenario',
      ],
    },
    {
      phase: 3,
      title: 'Events & Career Launch',
      weeks: 'Weeks 7–8',
      focus: 'Event coordination and job placement.',
      labCompetencies: ['Present event proposal', 'Complete mock job interview'],
    },
  ],
  credentialPipeline: [
    {
      training: 'Hospitality & Customer Service (8 weeks)',
      certification: 'Hospitality Certificate + ServSafe',
      certBody: 'Elevate for Humanity / NRA',
      jobRole: 'Front Desk Agent / Guest Services',
    },
  ],
  laborMarket: {
    medianSalary: 34000,
    salaryRange: '$28,000–$65,000',
    growthRate: '10% (faster than average)',
    source: 'U.S. Bureau of Labor Statistics',
    sourceYear: 2024,
    region: 'Indianapolis-Carmel-Anderson MSA',
  },
  careers: [
    { title: 'Front Desk Agent', salary: '$28,000–$36,000' },
    { title: 'Restaurant Supervisor', salary: '$32,000–$44,000' },
    { title: 'Event Coordinator', salary: '$36,000–$52,000' },
    { title: 'Hotel Operations Manager', salary: '$46,000–$65,000' },
  ],
  cta: {
    applyHref: '/apply?program=hospitality',
    requestInfoHref: '/contact?program=hospitality',
    careerConnectHref:
      'https://www.indianacareerconnect.com/jobs/search?q=hospitality&location=Indiana',
    advisorHref: '/contact',
    courseHref: '/programs/hospitality',
  },
  admissionRequirements: [
    '18 years or older',
    'Valid government-issued ID',
    'High school diploma or GED preferred',
  ],
  equipmentIncluded: 'All training materials and certification fees included',
  modality: 'Hybrid — Online coursework via LMS, hands-on labs at Elevate training center',
  facilityInfo: 'Elevate training center, Indianapolis',
  employerPartners: [
    'Indianapolis-area hotels',
    'Restaurants and catering companies',
    'Event venues',
  ],
  pricingIncludes: [
    '120 instructional hours',
    'ServSafe exam fee',
    'CPR/First Aid certification',
    'All training materials',
  ],
  paymentTerms:
    'WIOA and Workforce Ready Grant funding available for eligible Indiana residents. Self-pay: $1,800.',
  faqs: [
    {
      question: 'Do I need prior hospitality experience?',
      answer:
        'No. This program is designed for beginners. You will learn everything from the ground up.',
    },
    {
      question: 'What jobs can I get after completing this program?',
      answer:
        'Front desk agent, restaurant supervisor, event coordinator, guest services representative, and more.',
    },
    {
      question: 'Is ServSafe included?',
      answer: 'Yes. The ServSafe Food Handler exam fee is included in your tuition.',
    },
  ],
  breadcrumbs: [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'Hospitality & Customer Service' },
  ],
  metaTitle: 'Hospitality & Customer Service Training | Indianapolis | Elevate for Humanity',
  metaDescription:
    '8-week hospitality training program in Indianapolis. Earn a hospitality certificate and ServSafe certification. WIOA and Workforce Ready Grant funding available.',


  funding: {
    wioa_eligible: true,
    fssa_eligible: true,
    wrg_eligible: true,
    jobReadyIndyEligible: true,
    fundingNotes: 'Indiana ETPL-listed. WIOA Title I and WRG funding available for eligible Indiana residents.',
  },
};
