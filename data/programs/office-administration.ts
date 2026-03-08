import type { ProgramSchema } from '@/lib/programs/program-schema';

export const OFFICE_ADMINISTRATION: ProgramSchema = {
  slug: 'office-administration',
  title: 'Office Administration',
  subtitle: 'Master Microsoft Office and business communication. Earn Microsoft Office Specialist certifications in 6 weeks.',
  sector: 'business',
  category: 'Business Administration',

  heroImage: '/images/pages/programs-page-hero.jpg',
  heroImageAlt: 'Office administration and business training program',
  videoSrc: '/videos/business-finance.mp4',

  deliveryMode: 'hybrid',
  durationWeeks: 6,
  hoursPerWeekMin: 15,
  hoursPerWeekMax: 20,
  hoursBreakdown: {
    onlineInstruction: 40,
    handsOnLab: 35,
    examPrep: 15,
    careerPlacement: 10,
  },
  schedule: 'Mon–Thu, 15–20 hours per week',
  eveningSchedule: 'Evening cohorts available. Contact us for schedule options.',
  cohortSize: '12–16 participants per cohort',
  fundingStatement: '$0 with WIOA or Next Level Jobs funding',
  selfPayCost: '$1,800',
  badge: 'Funding Available',
  badgeColor: 'green',

  credentials: [
    { name: 'Microsoft Office Specialist: Word', issuer: 'Microsoft / Certiport', description: 'Validates document creation, formatting, and collaboration skills in Microsoft Word.', validity: 'Lifetime (version-specific)' },
    { name: 'Microsoft Office Specialist: Excel', issuer: 'Microsoft / Certiport', description: 'Validates spreadsheet, formula, and data analysis skills in Microsoft Excel.', validity: 'Lifetime (version-specific)' },
    { name: 'Microsoft Office Specialist: Outlook', issuer: 'Microsoft / Certiport', description: 'Validates email management, calendar, and contact organization skills.', validity: 'Lifetime (version-specific)' },
    { name: 'Business Communication Certificate', issuer: 'Elevate for Humanity', description: 'Institutional certificate verifying professional writing and communication competency.', validity: 'Lifetime' },
  ],

  outcomes: [
    { statement: 'Create professional documents with formatting, styles, and mail merge in Microsoft Word', assessedAt: 'Week 2' },
    { statement: 'Build spreadsheets with formulas, charts, and pivot tables in Microsoft Excel', assessedAt: 'Week 3' },
    { statement: 'Manage email, calendars, and contacts efficiently in Microsoft Outlook', assessedAt: 'Week 4' },
    { statement: 'Draft professional business correspondence (memos, emails, reports)', assessedAt: 'Week 4' },
    { statement: 'Organize and maintain digital filing systems and office records', assessedAt: 'Week 5' },
  ],

  careerPathway: [
    { title: 'Receptionist / Front Desk', timeframe: '0–3 months', requirements: 'MOS certification', salaryRange: '$30,000–$36,000' },
    { title: 'Administrative Assistant', timeframe: '3–12 months', requirements: 'MOS + 3 months experience', salaryRange: '$35,000–$42,000' },
    { title: 'Office Manager', timeframe: '2–3 years', requirements: 'MOS + supervisory experience', salaryRange: '$42,000–$55,000' },
    { title: 'Executive Assistant', timeframe: '3–5 years', requirements: 'Advanced MOS + project management', salaryRange: '$50,000–$65,000' },
  ],

  weeklySchedule: [
    { week: 'Week 1', title: 'Computer Literacy & Office Basics', competencyMilestone: 'Navigate Windows, file management, and cloud storage' },
    { week: 'Week 2', title: 'Microsoft Word', competencyMilestone: 'Create a formatted business report with table of contents and mail merge' },
    { week: 'Week 3', title: 'Microsoft Excel', competencyMilestone: 'Build a budget spreadsheet with formulas, charts, and pivot tables' },
    { week: 'Week 4', title: 'Outlook & Business Communication', competencyMilestone: 'Manage inbox, calendar, and draft professional correspondence' },
    { week: 'Week 5', title: 'Office Procedures & Records Management', competencyMilestone: 'Organize a digital filing system and process office workflows' },
    { week: 'Week 6', title: 'Exam Prep & Career Placement', competencyMilestone: 'Pass MOS practice exams with 80%+ score' },
  ],

  curriculum: [
    { title: 'Computer Fundamentals', topics: ['Windows navigation and file management', 'Cloud storage (OneDrive, Google Drive)', 'Internet research and digital literacy', 'Typing speed improvement'] },
    { title: 'Microsoft Word', topics: ['Document formatting and styles', 'Tables, headers, and footers', 'Mail merge and labels', 'Track changes and collaboration'] },
    { title: 'Microsoft Excel', topics: ['Formulas and functions (SUM, IF, VLOOKUP)', 'Charts and data visualization', 'Pivot tables and data analysis', 'Conditional formatting'] },
    { title: 'Microsoft Outlook', topics: ['Email management and rules', 'Calendar scheduling and sharing', 'Contact management', 'Task tracking'] },
    { title: 'Business Communication', topics: ['Professional email writing', 'Business memos and reports', 'Phone and in-person etiquette', 'Meeting minutes and agendas'] },
  ],

  complianceAlignment: [
    { standard: 'Microsoft Office Specialist (MOS) Exam Objectives', description: 'Curriculum aligned to current Certiport MOS certification exam objectives for Word, Excel, and Outlook.' },
    { standard: 'WIOA Title I', description: 'Program meets WIOA eligibility for Individual Training Accounts (ITA).' },
    { standard: 'Indiana DWD Next Level Jobs', description: 'Approved for Workforce Ready Grant funding.' },
  ],

  trainingPhases: [
    {
      phase: 1,
      title: 'Computer Literacy & Digital Skills',
      weeks: 'Week 1',
      focus: 'Windows navigation, file management, cloud storage, typing speed, and digital literacy.',
      labCompetencies: [
        'Navigate Windows file system and organize folders',
        'Upload and share files using OneDrive and Google Drive',
        'Type at 35+ WPM with 95% accuracy',
      ],
    },
    {
      phase: 2,
      title: 'Microsoft Office Mastery',
      weeks: 'Weeks 2–4',
      focus: 'Word, Excel, and Outlook — document creation, data analysis, and communication.',
      labCompetencies: [
        'Create a formatted business report with table of contents in Word',
        'Execute a mail merge for 50+ recipients',
        'Build a budget spreadsheet with SUM, IF, and VLOOKUP formulas',
        'Create a pivot table and chart from raw data in Excel',
        'Manage inbox with rules, categories, and calendar sharing in Outlook',
      ],
    },
    {
      phase: 3,
      title: 'Business Communication & Office Procedures',
      weeks: 'Week 5',
      focus: 'Professional writing, phone etiquette, records management, and office workflows.',
      labCompetencies: [
        'Draft a professional business memo and email',
        'Take and format meeting minutes',
        'Set up a digital filing system with consistent naming conventions',
        'Process incoming and outgoing correspondence',
      ],
    },
    {
      phase: 4,
      title: 'MOS Certification & Career Placement',
      weeks: 'Week 6',
      focus: 'Microsoft Office Specialist exam preparation and career readiness.',
      labCompetencies: [
        'Score 80%+ on MOS Word practice exam',
        'Score 80%+ on MOS Excel practice exam',
        'Complete a mock administrative assistant interview',
      ],
    },
  ],

  credentialPipeline: [
    {
      training: 'Microsoft Word mastery (Weeks 2–6)',
      certification: 'Microsoft Office Specialist: Word',
      certBody: 'Microsoft / Certiport',
      jobRole: 'Administrative Assistant',
    },
    {
      training: 'Microsoft Excel mastery (Weeks 3–6)',
      certification: 'Microsoft Office Specialist: Excel',
      certBody: 'Microsoft / Certiport',
      jobRole: 'Data Entry Specialist / Office Coordinator',
    },
    {
      training: 'Microsoft Outlook mastery (Week 4)',
      certification: 'Microsoft Office Specialist: Outlook',
      certBody: 'Microsoft / Certiport',
      jobRole: 'Receptionist / Front Desk Coordinator',
    },
  ],

  laborMarket: {
    medianSalary: 42000,
    salaryRange: '$30,000–$55,000',
    growthRate: '-7% (declining due to automation)',
    source: 'U.S. Bureau of Labor Statistics',
    sourceYear: 2024,
    region: 'Indianapolis-Carmel-Anderson MSA',
  },

  careers: [
    { title: 'Administrative Assistant', salary: '$35,000–$42,000' },
    { title: 'Receptionist', salary: '$30,000–$36,000' },
    { title: 'Office Manager', salary: '$42,000–$55,000' },
    { title: 'Data Entry Specialist', salary: '$32,000–$40,000' },
  ],

  cta: {
    applyHref: '/apply',
    advisorHref: '/contact',
    courseHref: '/programs/office-administration',
  },

  admissionRequirements: [
    '18 years or older',
    'High school diploma or GED (or actively pursuing)',
    'Basic computer literacy (mouse, keyboard, web browsing)',
    'No prior office experience required',
  ],
  equipmentIncluded: 'Computer lab access, Microsoft 365 subscription (program duration), all training materials, and certification exam vouchers included',
  modality: 'Hybrid — Online instruction via LMS, hands-on labs at training facility',
  facilityInfo: 'Elevate training center, Indianapolis',
  bilingualSupport: 'Bilingual (English/Spanish) instruction available.',
  employerPartners: ['Eskenazi Health (admin)', 'Community Health Network', 'City of Indianapolis', 'Goodwill of Central & Southern Indiana'],
  pricingIncludes: [
    'MOS Word exam voucher',
    'MOS Excel exam voucher',
    'MOS Outlook exam voucher',
    'Microsoft 365 subscription (6 weeks)',
    'All training materials and workbooks',
    'Career placement support',
  ],
  paymentTerms: 'Self-pay: $1,800 or 3-month payment plan. WIOA/NLJ: $0 out-of-pocket with approved funding.',

  faqs: [
    { question: 'Do I need computer experience?', answer: 'Basic computer literacy is required (mouse, keyboard, web browsing). We teach everything else from the ground up.' },
    { question: 'What is MOS certification?', answer: 'Microsoft Office Specialist (MOS) is the official Microsoft certification that validates your skills in Word, Excel, Outlook, and other Office applications. It is recognized by employers worldwide.' },
    { question: 'Is funding available?', answer: 'Yes. This program is eligible for WIOA and Next Level Jobs funding. Qualified participants pay $0 out-of-pocket.' },
    { question: 'Are office jobs being replaced by AI?', answer: 'While some routine tasks are being automated, administrative professionals who can use technology effectively remain in demand. This program teaches you to work with modern tools, not be replaced by them.' },
  ],

  breadcrumbs: [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'Office Administration' },
  ],

  metaTitle: 'Office Administration | Microsoft Office Specialist | Indianapolis',
  metaDescription: 'Earn Microsoft Office Specialist certifications in Word, Excel, and Outlook. 6-week program. WIOA funding available. Indianapolis.',
};
