import { BOOKKEEPING_MODULE_HOURS } from '@/lib/programs/bookkeeping-schedule';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const BOOKKEEPING: ProgramSchema = {
  slug: 'bookkeeping',
  title: 'Bookkeeping & QuickBooks',
  subtitle:
    'Build practical financial confidence, bookkeeping, Excel, and QuickBooks skills in one 8-week Accounting & Financial Empowerment Career Pathway.',
  sector: 'business',
  category: 'Accounting & Finance',
  programType: 'workforce',

  heroImage: '/images/programs/accounting-financial-empowerment-hero.png',
  heroImageAlt: 'Elevate Accounting and Financial Empowerment Career Pathway Program overview',
  videoSrc: '/videos/career-services-hero.mp4',

  deliveryMode: 'hybrid',
  deliveredBy: 'Elevate',
  durationWeeks: 8,
  hoursPerWeekMin: 20,
  hoursPerWeekMax: 20,
  // Instructor master syllabus v2.0 and updated eight-week guide, October 24, 2026.
  // Neither source allocates hours by online/lab/support mode; preserve its module allocation.
  hoursBreakdown: {
    modules: BOOKKEEPING_MODULE_HOURS.map(module => ({ ...module })),
  },
  schedule: '8 weeks, 20 instructional hours per week; 160 instructional hours total',
  cohortSize: '10–15 participants per cohort',
  fundingStatement: 'Self-pay is available. To explore workforce funding, schedule a WorkOne orientation and eligibility assessment. Funding for this specific program is not guaranteed and requires written agency authorization.',
  selfPayCost: '$1,500',
  badge: 'Funding Options',
  badgeColor: 'blue',

  credentials: [
    {
      name: 'QuickBooks Certified User',
      issuer: 'Intuit / Certiport',
      description: 'Validates proficiency in QuickBooks Online for small business accounting.',
      validity: 'Lifetime (version-specific)',
    },
    {
      name: 'Bookkeeping Fundamentals Certificate',
      issuer: 'Elevate for Humanity',
      description: 'Institutional certificate verifying double-entry bookkeeping competency.',
      validity: 'Lifetime',
    },
    {
      name: 'Microsoft Office Specialist: Excel',
      issuer: 'Microsoft / Certiport',
      description: 'Validates spreadsheet skills for financial reporting and data analysis.',
      validity: 'Lifetime (version-specific)',
    },
  ],

  outcomes: [
    {
      statement: 'Record transactions using double-entry bookkeeping principles',
      assessedAt: 'Week 2',
    },
    {
      statement: 'Set up a company file in QuickBooks Online with chart of accounts',
      assessedAt: 'Week 2',
    },
    {
      statement: 'Reconcile bank and credit card accounts within $0.01 accuracy',
      assessedAt: 'Weeks 5–6',
    },
    {
      statement: 'Generate profit & loss, balance sheet, and cash flow statements',
      assessedAt: 'Weeks 5–6',
    },
    { statement: 'Process payroll and calculate employer tax obligations', assessedAt: 'Week 7' },
  ],

  careerPathway: [
    {
      title: 'Bookkeeper',
      timeframe: '0–6 months',
      requirements: 'QuickBooks Certified User',
      salaryRange: '$35,000–$45,000',
    },
    {
      title: 'Accounts Payable/Receivable Clerk',
      timeframe: '6–18 months',
      requirements: 'QBO + 6 months experience',
      salaryRange: '$38,000–$48,000',
    },
    {
      title: 'Full-Charge Bookkeeper',
      timeframe: '2–3 years',
      requirements: 'QBO + payroll experience',
      salaryRange: '$45,000–$55,000',
    },
    {
      title: 'Accounting Assistant / Staff Accountant',
      timeframe: '3–5 years',
      requirements: 'Associate degree or additional certifications',
      salaryRange: '$50,000–$65,000',
    },
  ],

  weeklySchedule: [
    {
        "week": "Week 1",
        "title": "Accounting and Bookkeeping Foundations (15 hours); Debits, Credits, Journals and Ledgers (5 hours)",
        "competencyMilestone": "Complete assigned reading, practical files and assessments in the instructor eight-week guide; 20 instructional hours."
    },
    {
        "week": "Week 2",
        "title": "Debits, Credits, Journals and Ledgers (15 hours); Cash, Assets and Sales Transactions (5 hours)",
        "competencyMilestone": "Complete assigned reading, practical files and assessments in the instructor eight-week guide; 20 instructional hours."
    },
    {
        "week": "Week 3",
        "title": "Cash, Assets and Sales Transactions (15 hours); Purchases, Liabilities and Equity (5 hours)",
        "competencyMilestone": "Complete assigned reading, practical files and assessments in the instructor eight-week guide; 20 instructional hours."
    },
    {
        "week": "Week 4",
        "title": "Purchases, Liabilities and Equity (15 hours); Adjustments and the Accounting Cycle (5 hours)",
        "competencyMilestone": "Complete assigned reading, practical files and assessments in the instructor eight-week guide; 20 instructional hours."
    },
    {
        "week": "Week 5",
        "title": "Adjustments and the Accounting Cycle (10 hours); Reconciliation and Error Correction (10 hours)",
        "competencyMilestone": "Complete assigned reading, practical files and assessments in the instructor eight-week guide; 20 instructional hours."
    },
    {
        "week": "Week 6",
        "title": "Reconciliation and Error Correction (5 hours); Financial Statements and Analysis (15 hours)",
        "competencyMilestone": "Complete assigned reading, practical files and assessments in the instructor eight-week guide; 20 instructional hours."
    },
    {
        "week": "Week 7",
        "title": "Payroll, Controls and Bookkeeping Operations (10 hours); Excel for Accounting Laboratories (10 hours)",
        "competencyMilestone": "Complete assigned reading, practical files and assessments in the instructor eight-week guide; 20 instructional hours."
    },
    {
        "week": "Week 8",
        "title": "Excel for Accounting Laboratories (5 hours); Capstone, Remediation and Exam Preparation (15 hours)",
        "competencyMilestone": "Complete assigned reading, practical files and assessments in the instructor eight-week guide; 20 instructional hours."
    }
],

  curriculum: [
    {
      title: 'Accounting Fundamentals',
      topics: [
        'Double-entry bookkeeping',
        'Chart of accounts',
        'Journal entries and ledgers',
        'Accrual vs cash basis',
      ],
    },
    {
      title: 'QuickBooks Online',
      topics: [
        'Company setup and customization',
        'Invoicing and payments',
        'Expense tracking and categorization',
        'Bank feeds and reconciliation',
      ],
    },
    {
      title: 'Financial Reporting',
      topics: [
        'Profit & loss statements',
        'Balance sheets',
        'Cash flow statements',
        'Accounts aging reports',
      ],
    },
    {
      title: 'Payroll & Compliance',
      topics: [
        'Payroll processing',
        'Federal and state tax withholding',
        'W-2 and 1099 preparation',
        'Quarterly tax filings',
      ],
    },
    {
      title: 'Excel for Accounting',
      topics: [
        'Formulas and functions (SUM, VLOOKUP, IF)',
        'Pivot tables for financial analysis',
        'Budget templates',
        'Data validation',
      ],
    },
  ],

  complianceAlignment: [
    {
      standard: 'Intuit QuickBooks Certified User Exam',
      description:
        'Curriculum aligned to current Certiport QuickBooks Certified User exam objectives.',
    },
    {
      standard: 'GAAP Fundamentals',
      description:
        'Program teaches Generally Accepted Accounting Principles at the bookkeeping level.',
    },
  ],

  credentialPipeline: [
    {
      training: 'QuickBooks Online mastery (Weeks 2–8)',
      certification: 'QuickBooks Certified User',
      certBody: 'Intuit / Certiport',
      jobRole: 'Bookkeeper / Accounts Clerk',
    },
    {
      training: 'Excel for accounting and business finance (Weeks 4–8)',
      certification: 'Microsoft Office Specialist: Excel',
      certBody: 'Microsoft / Certiport',
      jobRole: 'Financial Analyst / Data Entry',
    },
  ],

  laborMarket: {
    medianSalary: 45860,
    salaryRange: '$35,000–$55,000',
    growthRate: '4% (as fast as average)',
    source: 'U.S. Bureau of Labor Statistics',
    sourceYear: 2024,
    region: 'Indianapolis-Carmel-Anderson MSA',
  },

  careers: [
    { title: 'Bookkeeper', salary: '$35,000–$45,000' },
    { title: 'Accounts Payable Clerk', salary: '$38,000–$48,000' },
    { title: 'Payroll Clerk', salary: '$40,000–$50,000' },
    { title: 'Full-Charge Bookkeeper', salary: '$45,000–$55,000' },
  ],

  cta: {
    applyHref: '/apply/student?program=bookkeeping',
    requestInfoHref: '/contact?program=bookkeeping',
    careerConnectHref:
      'https://www.indianacareerconnect.com/jobs/search?q=bookkeeper&location=Indiana',
    advisorHref: '/contact',
    courseHref: '/programs/bookkeeping',
  },

  admissionRequirements: [
    '18 years or older',
    'High school diploma or GED',
    'Basic computer literacy (email, web browsing, file management)',
    'No prior accounting experience required',
  ],
  equipmentIncluded:
    'QuickBooks Online subscription (program duration), all training materials, and certification exam voucher included',
  modality:
    'Hybrid — Online coursework via LMS, in-person computer labs at Elevate training center',
  facilityInfo: 'Elevate training center, Indianapolis',
  employerPartners: [
    'Katz Sapper & Miller',
    'Blue & Co.',
    'Somerset CPAs',
    'Small Business Development Center (SBDC)',
  ],
  pricingIncludes: [
    'QuickBooks Certified User exam voucher',
    'Microsoft Excel MOS exam voucher',
    'QuickBooks Online subscription (8 weeks)',
    'All training materials and workbooks',
    'Career placement support',
  ],
  paymentTerms: 'Self-pay: $1,500 or 3-month payment plan ($500/month).',

  // ─── Content model ──────────────────────────────────────────────
  deliveryModel: 'internal',
  deliveryModelDetail: 'internal_lms',
  fundingOptions: ['impact', 'self_pay'],
  enrollmentType: 'internal',
  lmsCourseSlug: 'bookkeeping-quickbooks',

  faqs: [
    {
      question: 'Do I need accounting experience?',
      answer:
        'No. This program starts from the fundamentals of double-entry bookkeeping and builds to QuickBooks proficiency.',
    },
    {
      question: 'Is this program eligible for WIOA funding?',
      answer:
        'Self-pay is available. For workforce funding, schedule a WorkOne orientation and eligibility assessment first. Ask your case manager to verify funding for this exact program; eligibility, covered costs, and written authorization must be confirmed before funded enrollment.',
    },
    {
      question: 'What version of QuickBooks do you teach?',
      answer:
        'We teach QuickBooks Online (QBO), which is the most widely used version for small businesses.',
    },
    {
      question: 'Can I start my own bookkeeping business?',
      answer:
        'Yes. Many graduates start freelance bookkeeping practices. The QuickBooks Certified User credential helps establish credibility with clients.',
    },
  ],

  breadcrumbs: [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'Bookkeeping & QuickBooks' },
  ],

  metaTitle: 'Bookkeeping & QuickBooks | Certified User | Indianapolis',
  metaDescription:
    '8-week Accounting & Financial Empowerment Career Pathway combining personal finance, bookkeeping, Excel, and QuickBooks certification preparation.',


  funding: {
    wioa_eligible: false,
    fssa_eligible: false,
    wrg_eligible: false,
    jobReadyIndyEligible: false,
    fundingNotes: 'No public WIOA/WRG claim is made for this program unless exact program-level evidence and participant authorization are recorded in the canonical funding registry.',
  },
};
