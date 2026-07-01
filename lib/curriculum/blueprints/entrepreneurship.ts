/**
 * lib/curriculum/blueprints/entrepreneurship.ts
 *
 * Entrepreneurship & Small Business — Certiport ESB aligned.
 * SOC: 11-1021.00 — General and Operations Managers
 *
 * Primary credential: Certiport ESB (Entrepreneurship and Small Business)
 * Delivered at Elevate CATC location (8888 Keystone Crossing, Suite 1300).
 */
import type { CredentialBlueprint } from './types';

export const entrepreneurshipBlueprint: CredentialBlueprint = {
  id: 'entrepreneurship-v1',
  version: '1.0.0',
  credentialSlug: 'certiport-esb',
  credentialTitle: 'Entrepreneurship and Small Business (ESB) Certification',
  credentialCode: 'ESB',
  // ESB is a Certiport exam delivered at our CATC location.
  certiportExamCodes: ['ESB'],
  externalCourses: [
    {
      title: 'Certiport ESB: Entrepreneurship & Small Business Exam Prep',
      provider: 'Certiport / Pearson VUE',
      url: 'https://certiport.pearsonvue.com/Certifications/ESB/Certification/Certify',
      required: true,
    },
  ],
  socCode: '11-1021.00',
  state: 'federal',
  programSlug: 'entrepreneurship',
  trackVariants: ['standard'],
  status: 'active',
  skipLqs: true,

  generationRules: {
    allowRemediation: true,
    allowExpansionLessons: false,
    maxTotalLessons: 36,
    requiresFinalExam: true,
    requiresUniversalReview: false,
    generatorMode: 'fixed',
  },

  expectedModuleCount: 6,
  expectedLessonCount: 36,

  videoConfig: {
    videoGenerator: 'runway',
    template: 'elevate-slide',
    instructorName: 'Elevate Business Coach',
    instructorTitle: 'Certified ESB Instructor',
    instructorImagePath: '/images/instructors/business-coach.jpg',
    topBarColor: '#0ea5e9',
    accentColor: '#0284c7',
    backgroundColor: '#0f172a',
    ttsVoice: 'nova',
    ttsSpeed: 1.0,
    slideCount: 5,
    segments: ['intro', 'concept', 'visual', 'application', 'wrapup'],
    generateDalleImage: true,
    dalleImageStyle: 'vivid',
    width: 1920,
    height: 1080,
  },

  assessmentRules: [
    { assessmentType: 'module', scope: 'all', minQuestions: 5, maxQuestions: 10, passingThreshold: 0.7 },
    { assessmentType: 'final', scope: 'all', minQuestions: 40, maxQuestions: 50, passingThreshold: 0.7 },
  ],

  modules: [
    {
      slug: 'esb-entrepreneurial-mindset',
      title: 'Entrepreneurial Mindset & Opportunity Recognition',
      orderIndex: 1,
      domainKey: 'mindset',
      minLessons: 5, maxLessons: 7, quizRequired: true, practicalRequired: false, isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'entrepreneurial_thinking', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'opportunity_recognition', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'risk_assessment', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'esb-what-is-entrepreneurship', title: 'What Is Entrepreneurship? Traits, Mindset, and Motivation', order: 1, domainKey: 'mindset' },
        { slug: 'esb-opportunity-recognition', title: 'Identifying Business Opportunities and Market Gaps', order: 2, domainKey: 'mindset' },
        { slug: 'esb-risk-and-reward', title: 'Risk, Reward, and the Entrepreneurial Decision', order: 3, domainKey: 'mindset' },
        { slug: 'esb-types-of-businesses', title: 'Types of Business Ownership: Sole Proprietor, LLC, Corporation', order: 4, domainKey: 'mindset' },
        { slug: 'esb-mindset-checkpoint', title: 'Entrepreneurial Mindset — Checkpoint', order: 5, domainKey: 'mindset' },
      ],
    },
    {
      slug: 'esb-business-planning',
      title: 'Business Planning & Strategy',
      orderIndex: 2,
      domainKey: 'planning',
      minLessons: 6, maxLessons: 8, quizRequired: true, practicalRequired: false, isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 5 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'business_plan', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'market_research', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'competitive_analysis', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'esb-business-plan-overview', title: 'The Business Plan: Purpose, Structure, and Components', order: 1, domainKey: 'planning' },
        { slug: 'esb-market-research', title: 'Market Research: Primary and Secondary Methods', order: 2, domainKey: 'planning' },
        { slug: 'esb-target-market', title: 'Defining Your Target Market and Customer Segments', order: 3, domainKey: 'planning' },
        { slug: 'esb-competitive-analysis', title: 'Competitive Analysis and Positioning', order: 4, domainKey: 'planning' },
        { slug: 'esb-value-proposition', title: 'Value Proposition and Unique Selling Point', order: 5, domainKey: 'planning' },
        { slug: 'esb-planning-checkpoint', title: 'Business Planning — Checkpoint', order: 6, domainKey: 'planning' },
      ],
    },
    {
      slug: 'esb-marketing-sales',
      title: 'Marketing & Sales',
      orderIndex: 3,
      domainKey: 'marketing',
      minLessons: 6, maxLessons: 8, quizRequired: true, practicalRequired: false, isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 5 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'marketing_mix', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'digital_marketing', isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'sales_process', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'esb-marketing-mix', title: 'The Marketing Mix: Product, Price, Place, Promotion', order: 1, domainKey: 'marketing' },
        { slug: 'esb-branding', title: 'Branding, Logo, and Business Identity', order: 2, domainKey: 'marketing' },
        { slug: 'esb-digital-marketing', title: 'Digital Marketing: Social Media, Email, and SEO Basics', order: 3, domainKey: 'marketing' },
        { slug: 'esb-sales-process', title: 'The Sales Process: Prospecting, Pitching, and Closing', order: 4, domainKey: 'marketing' },
        { slug: 'esb-customer-service', title: 'Customer Service and Retention Strategies', order: 5, domainKey: 'marketing' },
        { slug: 'esb-marketing-checkpoint', title: 'Marketing & Sales — Checkpoint', order: 6, domainKey: 'marketing' },
      ],
    },
    {
      slug: 'esb-financial-management',
      title: 'Financial Management',
      orderIndex: 4,
      domainKey: 'finance',
      minLessons: 7, maxLessons: 9, quizRequired: true, practicalRequired: false, isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 6 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'startup_costs', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'cash_flow', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'financial_statements', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'funding', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'esb-startup-costs', title: 'Startup Costs: Fixed, Variable, and One-Time Expenses', order: 1, domainKey: 'finance' },
        { slug: 'esb-pricing-strategy', title: 'Pricing Strategy: Cost-Plus, Value-Based, and Competitive', order: 2, domainKey: 'finance' },
        { slug: 'esb-cash-flow', title: 'Cash Flow Management and Break-Even Analysis', order: 3, domainKey: 'finance' },
        { slug: 'esb-financial-statements', title: 'Reading Financial Statements: Income, Balance Sheet, Cash Flow', order: 4, domainKey: 'finance' },
        { slug: 'esb-funding-sources', title: 'Funding Sources: Loans, Grants, Investors, and Bootstrapping', order: 5, domainKey: 'finance' },
        { slug: 'esb-taxes-basics', title: 'Business Taxes: Self-Employment, Sales Tax, and Deductions', order: 6, domainKey: 'finance' },
        { slug: 'esb-finance-checkpoint', title: 'Financial Management — Checkpoint', order: 7, domainKey: 'finance' },
      ],
    },
    {
      slug: 'esb-operations-legal',
      title: 'Operations & Legal Foundations',
      orderIndex: 5,
      domainKey: 'operations',
      minLessons: 6, maxLessons: 8, quizRequired: true, practicalRequired: false, isCritical: false,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 5 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'business_registration', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'contracts', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'operations_management', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'esb-business-registration', title: 'Registering Your Business: Licenses, Permits, and EIN', order: 1, domainKey: 'operations' },
        { slug: 'esb-legal-structures', title: 'Legal Structures: Liability, Taxes, and Compliance', order: 2, domainKey: 'operations' },
        { slug: 'esb-contracts-basics', title: 'Contracts and Agreements: What Every Owner Must Know', order: 3, domainKey: 'operations' },
        { slug: 'esb-insurance', title: 'Business Insurance: Types and Coverage Basics', order: 4, domainKey: 'operations' },
        { slug: 'esb-operations-systems', title: 'Operations Systems: Inventory, Scheduling, and Vendors', order: 5, domainKey: 'operations' },
        { slug: 'esb-operations-checkpoint', title: 'Operations & Legal — Checkpoint', order: 6, domainKey: 'operations' },
      ],
    },
    {
      slug: 'esb-exam-prep',
      title: 'ESB Exam Preparation & Launch Planning',
      orderIndex: 6,
      domainKey: 'exam_prep',
      minLessons: 6, maxLessons: 7, quizRequired: true, practicalRequired: false, isCritical: true,
      requiredLessonTypes: [
        { lessonType: 'lesson', requiredCount: 3 },
        { lessonType: 'checkpoint', requiredCount: 1 },
        { lessonType: 'exam', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'esb_exam_readiness', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'business_launch', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'esb-exam-overview', title: 'Certiport ESB Exam: Format, Domains, and Strategy', order: 1, domainKey: 'exam_prep' },
        { slug: 'esb-high-yield-review', title: 'High-Yield Review: All Five ESB Domains', order: 2, domainKey: 'exam_prep' },
        { slug: 'esb-launch-plan', title: 'Your 90-Day Business Launch Plan', order: 3, domainKey: 'exam_prep' },
        { slug: 'esb-exam-readiness-checkpoint', title: 'Exam Readiness — Checkpoint', order: 4, domainKey: 'exam_prep' },
        { slug: 'esb-final-exam', title: 'Entrepreneurship & Small Business Final Exam', order: 5, domainKey: 'exam_prep' },
      ],
    },
  ],
};
