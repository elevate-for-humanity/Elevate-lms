import type { ProgramSchema } from '@/lib/programs/program-schema';
export const ENTREPRENEURSHIP: ProgramSchema = {
  slug: 'entrepreneurship',
  title: 'Elevate ESB',
  subtitle:
    'Launch or grow your business. Business planning, marketing, financial management, and ESB certification preparation in 6 weeks.',
  sector: 'business',
  category: 'Entrepreneurship',
  programType: 'workforce',
  heroImage: '/images/pexels/business.webp',
  heroImageAlt: 'Entrepreneur working on a business plan',
  videoSrc: '/videos/partner-business.mp4',
  deliveryMode: 'hybrid',
  deliveredBy: 'Elevate',
  durationWeeks: 6,
  hoursPerWeekMin: 10,
  hoursPerWeekMax: 15,
  hoursBreakdown: { onlineInstruction: 30, handsOnLab: 30, examPrep: 10, careerPlacement: 10 },
  schedule: 'Tue/Thu, 6:00–9:00 PM + Saturday workshops',
  cohortSize: '10–15 participants per cohort',
  fundingStatement: '$0 with WIOA or grant funding',
  selfPayCost: '$1,500',
  badge: 'Evening Program',
  badgeColor: 'blue',
  credentials: [
    {
      name: 'Entrepreneurship and Small Business (ESB)',
      issuer: 'Certiport',
      description: 'External certification in business planning and entrepreneurship fundamentals.',
      validity: 'Lifetime',
    },
    {
      name: 'QuickBooks Certified User',
      issuer: 'Certiport / Intuit',
      description: 'Certification in QuickBooks accounting software.',
      validity: 'Lifetime (version-specific)',
    },
    {
      name: 'Microsoft Office Specialist — Excel',
      issuer: 'Certiport / Microsoft',
      description: 'Excel certification for financial modeling and business analysis.',
      validity: 'Lifetime (version-specific)',
    },
  ],
  outcomes: [
    {
      statement: 'Develop a complete business plan with market analysis and financial projections',
      assessedAt: 'Week 5',
    },
    {
      statement: 'Create a marketing strategy including digital and social media channels',
      assessedAt: 'Week 3',
    },
    { statement: 'Set up QuickBooks for business accounting and invoicing', assessedAt: 'Week 4' },
    {
      statement: 'Identify funding sources (grants, loans, microfinance) for small businesses',
      assessedAt: 'Week 2',
    },
    { statement: 'Complete Elevate ESB exam readiness requirements', assessedAt: 'Week 6' },
  ],
  careerPathway: [
    {
      title: 'Business Owner (startup)',
      timeframe: '0–6 months',
      requirements: 'Business plan + ESB readiness',
      salaryRange: 'Varies',
    },
    {
      title: 'Established Business Owner',
      timeframe: '1–3 years',
      requirements: 'Revenue + growth',
      salaryRange: 'Varies',
    },
    {
      title: 'Business Consultant',
      timeframe: '3+ years',
      requirements: 'Track record + expertise',
      salaryRange: '$45,000–$80,000',
    },
  ],
  weeklySchedule: [
    {
      week: 'Week 1',
      title: 'Business Idea Validation',
      competencyMilestone: 'Define target market and validate business concept',
    },
    {
      week: 'Week 2',
      title: 'Funding & Legal Structure',
      competencyMilestone: 'Identify funding sources and choose business structure',
    },
    {
      week: 'Week 3',
      title: 'Marketing & Branding',
      competencyMilestone: 'Create marketing strategy and brand identity',
    },
    {
      week: 'Week 4',
      title: 'Financial Management',
      competencyMilestone: 'Set up QuickBooks and create financial projections',
    },
    {
      week: 'Week 5',
      title: 'Business Plan Completion',
      competencyMilestone: 'Present complete business plan to panel',
    },
    {
      week: 'Week 6',
      title: 'Elevate ESB Readiness & Launch',
      competencyMilestone: 'Complete ESB readiness review and finalize launch plan',
    },
  ],
  curriculum: [
    {
      title: 'Business Planning',
      topics: [
        'Market research',
        'Competitive analysis',
        'Value proposition',
        'Revenue models',
        'Business plan writing',
      ],
    },
    {
      title: 'Marketing',
      topics: [
        'Digital marketing',
        'Social media strategy',
        'Brand identity',
        'Customer acquisition',
        'Sales fundamentals',
      ],
    },
    {
      title: 'Financial Management',
      topics: [
        'QuickBooks setup',
        'Pricing strategy',
        'Cash flow management',
        'Tax obligations',
        'Funding sources',
      ],
    },
  ],
  complianceAlignment: [
    {
      standard: 'ESB U.S. v.2 Objectives',
      description: 'Elevate ESB curriculum is aligned to current Entrepreneurship and Small Business exam objective domains.',
    },
    {
      standard: 'SBA Guidelines',
      description: 'Business plan format follows SBA recommended structure.',
    },
  ],
  credentialPipeline: [
    {
      training: 'Elevate ESB (6 weeks)',
      certification: 'ESB + QuickBooks Certified',
      certBody: 'External certification partners',
      jobRole: 'Small Business Owner / Consultant',
    },
  ],
  laborMarket: {
    medianSalary: 0,
    salaryRange: 'Varies by business',
    growthRate: 'Self-employment growing in gig economy',
    source: 'U.S. Census Bureau',
    sourceYear: 2024,
    region: 'Indianapolis-Carmel-Anderson MSA',
  },
  careers: [
    { title: 'Small Business Owner', salary: 'Varies' },
    { title: 'Freelance Consultant', salary: '$40,000–$80,000' },
    { title: 'Business Development', salary: '$45,000–$65,000' },
  ],
  cta: {
    applyHref: '/apply?program=entrepreneurship',
    requestInfoHref: '/programs/entrepreneurship/request-info',
    advisorHref: '/contact',
    courseHref: '/programs/entrepreneurship',
  },
  admissionRequirements: [
    '18 years or older',
    'Business idea or existing business',
    'Basic computer skills',
  ],
  equipmentIncluded:
    'Laptop provided during training. All software and included exam fees are covered by the program where applicable.',
  modality: 'Hybrid — Evening classes, Saturday workshops, LMS-supported coursework',
  facilityInfo: 'Elevate training center, Indianapolis',
  employerPartners: ['SCORE Indianapolis mentors', 'Local business development organizations'],
  pricingIncludes: [
    '80 instructional hours',
    'ESB exam preparation',
    'QuickBooks certification exam',
    'Business plan template and tools',
    'Mentorship connections',
  ],
  paymentTerms:
    'WIOA and grant funding available for eligible Indiana residents — eligibility not guaranteed. Self-pay: $1,500 with payment plans.',
  faqs: [
    {
      question: 'Do I need a business idea?',
      answer:
        'Having a business idea is helpful but not required. The first week helps you validate and refine your concept.',
    },
    {
      question: 'Is this for existing businesses too?',
      answer:
        'Yes. Existing business owners benefit from the financial management, marketing, and certification components.',
    },
  ],
  breadcrumbs: [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'Elevate ESB' },
  ],
  metaTitle: 'Elevate ESB | Entrepreneurship & Small Business | Indianapolis',
  metaDescription:
    'Elevate ESB helps you launch or grow a business through business planning, marketing, financial management, and ESB exam preparation in 6 weeks.',


  fundingOptions: ['impact', 'self_pay'],
  funding: {
    wioa_eligible: false,
    fssa_eligible: false,
    wrg_eligible: false,
    jobReadyIndyEligible: false,
    fundingNotes: 'Eligibility for WIOA/FSSA funding as a standalone program determined by the applicable workforce or funding agency.',
  },
};
