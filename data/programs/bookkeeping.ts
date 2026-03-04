import type { ProgramSchema } from '@/lib/programs/program-schema';

export const BOOKKEEPING: ProgramSchema = {
  slug: 'bookkeeping',
  title: 'Bookkeeping & QuickBooks',
  subtitle: 'Master small business accounting and earn the QuickBooks Certified User credential in 5 weeks.',
  sector: 'business',
  category: 'Accounting & Finance',

  heroImage: '/images/pages/comp-cta-training.jpg',
  heroImageAlt: 'Bookkeeper working with financial documents and QuickBooks software',

  deliveryMode: 'in-person',
  durationWeeks: 5,
  hoursPerWeekMin: 15,
  hoursPerWeekMax: 20,
  hoursBreakdown: {
    onlineInstruction: 30,
    handsOnLab: 40,
    examPrep: 10,
    careerPlacement: 5,
  },
  schedule: 'Mon–Thu, 15–20 hours per week',
  eveningSchedule: 'Evening sessions available Tue/Thu 6–9 PM.',
  cohortSize: '10–15 participants per cohort',
  fundingStatement: 'Self-pay program. Payment plans available.',
  selfPayCost: '$1,500',
  badge: 'Self-Pay',
  badgeColor: 'orange',

  credentials: [
    { name: 'QuickBooks Certified User', issuer: 'Intuit / Certiport', description: 'Validates proficiency in QuickBooks Online for small business accounting.', validity: 'Lifetime (version-specific)' },
    { name: 'Bookkeeping Fundamentals Certificate', issuer: 'Elevate for Humanity', description: 'Institutional certificate verifying double-entry bookkeeping competency.', validity: 'Lifetime' },
    { name: 'Microsoft Office Specialist: Excel', issuer: 'Microsoft / Certiport', description: 'Validates spreadsheet skills for financial reporting and data analysis.', validity: 'Lifetime (version-specific)' },
  ],

  outcomes: [
    { statement: 'Record transactions using double-entry bookkeeping principles', assessedAt: 'Week 1' },
    { statement: 'Set up a company file in QuickBooks Online with chart of accounts', assessedAt: 'Week 2' },
    { statement: 'Reconcile bank and credit card accounts within $0.01 accuracy', assessedAt: 'Week 3' },
    { statement: 'Generate profit & loss, balance sheet, and cash flow statements', assessedAt: 'Week 3' },
    { statement: 'Process payroll and calculate employer tax obligations', assessedAt: 'Week 4' },
  ],

  careerPathway: [
    { title: 'Bookkeeper', timeframe: '0–6 months', requirements: 'QuickBooks Certified User', salaryRange: '$35,000–$45,000' },
    { title: 'Accounts Payable/Receivable Clerk', timeframe: '6–18 months', requirements: 'QBO + 6 months experience', salaryRange: '$38,000–$48,000' },
    { title: 'Full-Charge Bookkeeper', timeframe: '2–3 years', requirements: 'QBO + payroll experience', salaryRange: '$45,000–$55,000' },
    { title: 'Accounting Assistant / Staff Accountant', timeframe: '3–5 years', requirements: 'Associate degree or additional certifications', salaryRange: '$50,000–$65,000' },
  ],

  weeklySchedule: [
    { week: 'Week 1', title: 'Bookkeeping Fundamentals', competencyMilestone: 'Record debits and credits using T-accounts' },
    { week: 'Week 2', title: 'QuickBooks Online Setup', competencyMilestone: 'Create a company file with chart of accounts and opening balances' },
    { week: 'Week 3', title: 'Transactions & Reconciliation', competencyMilestone: 'Reconcile bank accounts and generate financial statements' },
    { week: 'Week 4', title: 'Payroll & Tax Basics', competencyMilestone: 'Process a payroll cycle and calculate employer tax obligations' },
    { week: 'Week 5', title: 'Exam Prep & Career Placement', competencyMilestone: 'Pass QuickBooks Certified User practice exam with 80%+ score' },
  ],

  curriculum: [
    { title: 'Accounting Fundamentals', topics: ['Double-entry bookkeeping', 'Chart of accounts', 'Journal entries and ledgers', 'Accrual vs cash basis'] },
    { title: 'QuickBooks Online', topics: ['Company setup and customization', 'Invoicing and payments', 'Expense tracking and categorization', 'Bank feeds and reconciliation'] },
    { title: 'Financial Reporting', topics: ['Profit & loss statements', 'Balance sheets', 'Cash flow statements', 'Accounts aging reports'] },
    { title: 'Payroll & Compliance', topics: ['Payroll processing', 'Federal and state tax withholding', 'W-2 and 1099 preparation', 'Quarterly tax filings'] },
    { title: 'Excel for Accounting', topics: ['Formulas and functions (SUM, VLOOKUP, IF)', 'Pivot tables for financial analysis', 'Budget templates', 'Data validation'] },
  ],

  complianceAlignment: [
    { standard: 'Intuit QuickBooks Certified User Exam', description: 'Curriculum aligned to current Certiport QuickBooks Certified User exam objectives.' },
    { standard: 'GAAP Fundamentals', description: 'Program teaches Generally Accepted Accounting Principles at the bookkeeping level.' },
  ],

  trainingPhases: [
    {
      phase: 1,
      title: 'Accounting Fundamentals',
      weeks: 'Week 1',
      focus: 'Double-entry bookkeeping, chart of accounts, journal entries, and accrual vs cash basis.',
      labCompetencies: [
        'Record 20 transactions using T-accounts with zero errors',
        'Classify accounts as asset, liability, equity, revenue, or expense',
        'Prepare a trial balance from journal entries',
      ],
    },
    {
      phase: 2,
      title: 'QuickBooks Online Mastery',
      weeks: 'Weeks 2–3',
      focus: 'Company setup, invoicing, expense tracking, bank reconciliation, and reporting.',
      labCompetencies: [
        'Set up a company file with chart of accounts and opening balances',
        'Create and send invoices, record payments, and track receivables',
        'Reconcile a bank account to $0.00 difference',
        'Generate profit & loss and balance sheet reports',
      ],
    },
    {
      phase: 3,
      title: 'Payroll & Tax Compliance',
      weeks: 'Week 4',
      focus: 'Payroll processing, tax withholding, W-2/1099 preparation, and quarterly filings.',
      labCompetencies: [
        'Process a complete payroll cycle for 5 employees',
        'Calculate federal and state tax withholding',
        'Prepare W-2 and 1099 forms from payroll data',
      ],
    },
    {
      phase: 4,
      title: 'Certification Exam & Career Prep',
      weeks: 'Week 5',
      focus: 'QuickBooks Certified User exam preparation, Excel skills, and career placement.',
      labCompetencies: [
        'Score 80%+ on QuickBooks Certified User practice exam',
        'Build a budget spreadsheet with formulas and pivot tables in Excel',
        'Complete a mock bookkeeping interview',
      ],
    },
  ],

  credentialPipeline: [
    {
      training: 'QuickBooks Online mastery (Weeks 2–5)',
      certification: 'QuickBooks Certified User',
      certBody: 'Intuit / Certiport',
      jobRole: 'Bookkeeper / Accounts Clerk',
    },
    {
      training: 'Excel for accounting (Weeks 4–5)',
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
    applyHref: '/apply',
    advisorHref: '/contact',
    courseHref: '/programs/bookkeeping',
  },

  admissionRequirements: [
    '18 years or older',
    'High school diploma or GED',
    'Basic computer literacy (email, web browsing, file management)',
    'No prior accounting experience required',
  ],
  equipmentIncluded: 'QuickBooks Online subscription (program duration), all training materials, and certification exam voucher included',
  modality: 'In-person instruction at Elevate training center with hands-on QuickBooks labs',
  facilityInfo: 'Elevate training center, Indianapolis',
  employerPartners: ['Katz Sapper & Miller', 'Blue & Co.', 'Somerset CPAs', 'Small Business Development Center (SBDC)'],
  pricingIncludes: [
    'QuickBooks Certified User exam voucher',
    'Microsoft Excel MOS exam voucher',
    'QuickBooks Online subscription (5 weeks)',
    'All training materials and workbooks',
    'Career placement support',
  ],
  paymentTerms: 'Self-pay: $1,500 or 3-month payment plan ($500/month).',

  faqs: [
    { question: 'Do I need accounting experience?', answer: 'No. This program starts from the fundamentals of double-entry bookkeeping and builds to QuickBooks proficiency.' },
    { question: 'Is this program eligible for WIOA funding?', answer: 'This is currently a self-pay program at $1,500. Payment plans are available. Contact us about potential funding options.' },
    { question: 'What version of QuickBooks do you teach?', answer: 'We teach QuickBooks Online (QBO), which is the most widely used version for small businesses.' },
    { question: 'Can I start my own bookkeeping business?', answer: 'Yes. Many graduates start freelance bookkeeping practices. The QuickBooks Certified User credential helps establish credibility with clients.' },
  ],

  breadcrumbs: [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'Bookkeeping & QuickBooks' },
  ],

  metaTitle: 'Bookkeeping & QuickBooks | Certified User | Indianapolis',
  metaDescription: 'Earn QuickBooks Certified User credential. 5-week program. Bookkeepers earn $45,860/year in Indiana. Payment plans available.',
};
