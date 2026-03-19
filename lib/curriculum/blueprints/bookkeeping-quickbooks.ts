/**
 * lib/curriculum/blueprints/bookkeeping-quickbooks.ts
 *
 * Canonical blueprint for the Bookkeeping & QuickBooks program.
 * Credential authority: Intuit / Certiport (QuickBooks Certified User).
 *
 * Design: fixed spine, flexible ribs.
 *   - 5 modules, fixed order, fixed competency coverage.
 *   - Lesson count per module is bounded (min/max).
 *   - Generator may expand lessons inside bounds; may not invent modules.
 *
 * Slugs are the durable identity. Do not change slugs after lessons are seeded.
 */

import type { CredentialBlueprint } from './types';

export const bookkeepingQuickbooksBlueprint: CredentialBlueprint = {
  id: 'bookkeeping-quickbooks-v1',
  version: '1.0.0',
  credentialSlug: 'quickbooks-certified-user',
  credentialTitle: 'QuickBooks Certified User',
  state: 'federal',
  programSlug: 'bookkeeping',
  credentialCode: 'QBO-CU',
  trackVariants: ['standard'],
  status: 'active',

  generationRules: {
    allowRemediation: true,
    allowExpansionLessons: true,
    maxTotalLessons: 50,
    requiresFinalExam: true,
    requiresUniversalReview: false,
    generatorMode: 'fixed',
  },

  expectedModuleCount: 5,
  expectedLessonCount: 40,

  modules: [
    // ── Module 1 ─────────────────────────────────────────────────────────────
    {
      slug: 'bk-fundamentals',
      title: 'Bookkeeping Fundamentals',
      orderIndex: 1,
      minLessons: 7,
      maxLessons: 10,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      domainKey: 'fundamentals',
      requiredLessonTypes: [
        { lessonType: 'orientation', requiredCount: 1 },
        { lessonType: 'concept',     requiredCount: 4 },
        { lessonType: 'quiz',        requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'accounting_equation',       isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'double_entry_bookkeeping',  isCritical: true,  minimumTouchpoints: 3 },
        { competencyKey: 'chart_of_accounts',         isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'accrual_vs_cash_basis',     isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'Introduction to Bookkeeping and Accounting',
        'The Accounting Equation: Assets, Liabilities, Equity',
        'Double-Entry Bookkeeping Principles',
        'Debits and Credits in Practice',
        'Chart of Accounts Setup and Structure',
        'Journal Entries and the General Ledger',
        'Accrual vs. Cash Basis Accounting',
        'Module 1 Checkpoint Quiz',
      ],
      lessons: [
        { slug: 'bk-intro-to-bookkeeping',              title: 'Introduction to Bookkeeping and Accounting',    order: 1,  domainKey: 'fundamentals' },
        { slug: 'bk-accounting-equation',               title: 'The Accounting Equation: Assets, Liabilities, Equity', order: 2, domainKey: 'fundamentals' },
        { slug: 'bk-double-entry-principles',           title: 'Double-Entry Bookkeeping Principles',           order: 3,  domainKey: 'fundamentals' },
        { slug: 'bk-debits-and-credits',                title: 'Debits and Credits in Practice',                order: 4,  domainKey: 'fundamentals' },
        { slug: 'bk-chart-of-accounts',                 title: 'Chart of Accounts Setup and Structure',         order: 5,  domainKey: 'fundamentals' },
        { slug: 'bk-journal-entries-general-ledger',    title: 'Journal Entries and the General Ledger',        order: 6,  domainKey: 'fundamentals' },
        { slug: 'bk-accrual-vs-cash-basis',             title: 'Accrual vs. Cash Basis Accounting',             order: 7,  domainKey: 'fundamentals' },
        { slug: 'bk-fundamentals-checkpoint',           title: 'Module 1 Checkpoint Quiz',                      order: 8,  domainKey: 'fundamentals' },
      ],
    },

    // ── Module 2 ─────────────────────────────────────────────────────────────
    {
      slug: 'bk-quickbooks-foundations',
      title: 'QuickBooks Online Foundations',
      orderIndex: 2,
      minLessons: 7,
      maxLessons: 10,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      domainKey: 'quickbooks_setup',
      requiredLessonTypes: [
        { lessonType: 'concept',    requiredCount: 3 },
        { lessonType: 'practical',  requiredCount: 2 },
        { lessonType: 'quiz',       requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'qbo_company_setup',       isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'qbo_navigation',          isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'customer_vendor_setup',   isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'opening_balances',        isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'Introduction to QuickBooks Online',
        'Setting Up a Company File',
        'Customizing the Chart of Accounts in QBO',
        'Adding Customers and Vendors',
        'Setting Opening Balances',
        'Navigating the QBO Dashboard',
        'User Roles and Permissions',
        'Module 2 Checkpoint Quiz',
      ],
      lessons: [
        { slug: 'bk-intro-to-qbo',                  title: 'Introduction to QuickBooks Online',             order: 1, domainKey: 'quickbooks_setup' },
        { slug: 'bk-company-file-setup',             title: 'Setting Up a Company File',                    order: 2, domainKey: 'quickbooks_setup' },
        { slug: 'bk-qbo-chart-of-accounts',          title: 'Customizing the Chart of Accounts in QBO',    order: 3, domainKey: 'quickbooks_setup' },
        { slug: 'bk-customers-and-vendors',          title: 'Adding Customers and Vendors',                 order: 4, domainKey: 'quickbooks_setup' },
        { slug: 'bk-opening-balances',               title: 'Setting Opening Balances',                     order: 5, domainKey: 'quickbooks_setup' },
        { slug: 'bk-qbo-dashboard-navigation',       title: 'Navigating the QBO Dashboard',                order: 6, domainKey: 'quickbooks_setup' },
        { slug: 'bk-user-roles-permissions',         title: 'User Roles and Permissions',                   order: 7, domainKey: 'quickbooks_setup' },
        { slug: 'bk-qbo-foundations-checkpoint',     title: 'Module 2 Checkpoint Quiz',                    order: 8, domainKey: 'quickbooks_setup' },
      ],
    },

    // ── Module 3 ─────────────────────────────────────────────────────────────
    {
      slug: 'bk-transactions-reconciliation',
      title: 'Transactions, Invoicing & Reconciliation',
      orderIndex: 3,
      minLessons: 8,
      maxLessons: 11,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      domainKey: 'transactions',
      requiredLessonTypes: [
        { lessonType: 'concept',    requiredCount: 3 },
        { lessonType: 'practical',  requiredCount: 3 },
        { lessonType: 'quiz',       requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'invoicing_payments',        isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'expense_tracking',          isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'bank_reconciliation',       isCritical: true,  minimumTouchpoints: 3 },
        { competencyKey: 'bank_feeds',                isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'accounts_receivable',       isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'accounts_payable',          isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'Recording Sales and Income',
        'Creating and Sending Invoices',
        'Receiving and Applying Payments',
        'Recording Expenses and Bills',
        'Paying Bills and Managing Accounts Payable',
        'Connecting Bank Feeds',
        'Categorizing Transactions',
        'Bank Reconciliation Step by Step',
        'Module 3 Checkpoint Quiz',
      ],
      lessons: [
        { slug: 'bk-recording-sales-income',          title: 'Recording Sales and Income',                  order: 1, domainKey: 'transactions' },
        { slug: 'bk-creating-invoices',               title: 'Creating and Sending Invoices',               order: 2, domainKey: 'transactions' },
        { slug: 'bk-receiving-payments',              title: 'Receiving and Applying Payments',             order: 3, domainKey: 'transactions' },
        { slug: 'bk-recording-expenses-bills',        title: 'Recording Expenses and Bills',                order: 4, domainKey: 'transactions' },
        { slug: 'bk-paying-bills-accounts-payable',   title: 'Paying Bills and Managing Accounts Payable',  order: 5, domainKey: 'transactions' },
        { slug: 'bk-connecting-bank-feeds',           title: 'Connecting Bank Feeds',                       order: 6, domainKey: 'transactions' },
        { slug: 'bk-categorizing-transactions',       title: 'Categorizing Transactions',                   order: 7, domainKey: 'transactions' },
        { slug: 'bk-bank-reconciliation',             title: 'Bank Reconciliation Step by Step',            order: 8, domainKey: 'transactions' },
        { slug: 'bk-transactions-checkpoint',         title: 'Module 3 Checkpoint Quiz',                    order: 9, domainKey: 'transactions' },
      ],
    },

    // ── Module 4 ─────────────────────────────────────────────────────────────
    {
      slug: 'bk-reporting-payroll',
      title: 'Financial Reporting & Payroll',
      orderIndex: 4,
      minLessons: 7,
      maxLessons: 10,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      domainKey: 'reporting',
      requiredLessonTypes: [
        { lessonType: 'concept',    requiredCount: 3 },
        { lessonType: 'practical',  requiredCount: 2 },
        { lessonType: 'quiz',       requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'profit_loss_statement',     isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'balance_sheet',             isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'cash_flow_statement',       isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'payroll_processing',        isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'tax_withholding',           isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'w2_1099_preparation',       isCritical: false, minimumTouchpoints: 1 },
      ],
      suggestedLessonSkeleton: [
        'Reading the Profit & Loss Statement',
        'Understanding the Balance Sheet',
        'Cash Flow Statements and Projections',
        'Customizing and Exporting Reports',
        'Payroll Setup in QuickBooks',
        'Processing a Payroll Cycle',
        'Tax Withholding and Employer Obligations',
        'Module 4 Checkpoint Quiz',
      ],
      lessons: [
        { slug: 'bk-profit-loss-statement',           title: 'Reading the Profit & Loss Statement',         order: 1, domainKey: 'reporting' },
        { slug: 'bk-balance-sheet',                   title: 'Understanding the Balance Sheet',             order: 2, domainKey: 'reporting' },
        { slug: 'bk-cash-flow-statements',            title: 'Cash Flow Statements and Projections',        order: 3, domainKey: 'reporting' },
        { slug: 'bk-customizing-exporting-reports',   title: 'Customizing and Exporting Reports',           order: 4, domainKey: 'reporting' },
        { slug: 'bk-payroll-setup-qbo',               title: 'Payroll Setup in QuickBooks',                 order: 5, domainKey: 'reporting' },
        { slug: 'bk-processing-payroll-cycle',        title: 'Processing a Payroll Cycle',                  order: 6, domainKey: 'reporting' },
        { slug: 'bk-tax-withholding-obligations',     title: 'Tax Withholding and Employer Obligations',    order: 7, domainKey: 'reporting' },
        { slug: 'bk-reporting-payroll-checkpoint',    title: 'Module 4 Checkpoint Quiz',                    order: 8, domainKey: 'reporting' },
      ],
    },

    // ── Module 5 ─────────────────────────────────────────────────────────────
    {
      slug: 'bk-certification-prep',
      title: 'Certification Prep & Career Readiness',
      orderIndex: 5,
      minLessons: 7,
      maxLessons: 10,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      domainKey: 'certification',
      requiredLessonTypes: [
        { lessonType: 'concept',    requiredCount: 2 },
        { lessonType: 'exam',       requiredCount: 1 },
        { lessonType: 'quiz',       requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'qbo_exam_objectives',       isCritical: true,  minimumTouchpoints: 3 },
        { competencyKey: 'mos_excel_integration',     isCritical: true,  minimumTouchpoints: 2 },
        { competencyKey: 'career_readiness',          isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'exam_strategy',             isCritical: true,  minimumTouchpoints: 2 },
      ],
      suggestedLessonSkeleton: [
        'QuickBooks Certified User Exam Overview',
        'Exam Objectives and Domain Breakdown',
        'MOS Excel for Accounting Professionals',
        'Practice Exam: Full Simulation',
        'Reviewing Weak Areas',
        'Career Pathways in Bookkeeping',
        'Final Certification Exam',
      ],
      lessons: [
        { slug: 'bk-qbo-exam-overview',               title: 'QuickBooks Certified User Exam Overview',     order: 1, domainKey: 'certification' },
        { slug: 'bk-exam-objectives-domains',         title: 'Exam Objectives and Domain Breakdown',        order: 2, domainKey: 'certification' },
        { slug: 'bk-mos-excel-for-accounting',        title: 'MOS Excel for Accounting Professionals',      order: 3, domainKey: 'certification' },
        { slug: 'bk-practice-exam-simulation',        title: 'Practice Exam: Full Simulation',              order: 4, domainKey: 'certification' },
        { slug: 'bk-reviewing-weak-areas',            title: 'Reviewing Weak Areas',                        order: 5, domainKey: 'certification' },
        { slug: 'bk-career-pathways-bookkeeping',     title: 'Career Pathways in Bookkeeping',              order: 6, domainKey: 'certification' },
        { slug: 'bk-final-certification-exam',        title: 'Final Certification Exam',                    order: 7, domainKey: 'certification' },
      ],
    },
  ],

  assessmentRules: [
    {
      assessmentType: 'module',
      scope: 'all',
      minQuestions: 8,
      maxQuestions: 15,
      passingThreshold: 0.70,
    },
    {
      assessmentType: 'final',
      scope: 'bk-certification-prep',
      minQuestions: 50,
      maxQuestions: 75,
      passingThreshold: 0.80,
      distributionConstraints: {
        'fundamentals':       0.20,
        'quickbooks_setup':   0.20,
        'transactions':       0.25,
        'reporting':          0.20,
        'certification':      0.15,
      },
    },
  ],
};

// ── Hard guards — fail at module load, not at runtime ────────────────────────

const _actualModuleCount = bookkeepingQuickbooksBlueprint.modules.length;
const _actualLessonCount = bookkeepingQuickbooksBlueprint.modules.reduce(
  (sum, m) => sum + (m.lessons?.length ?? 0), 0
);

if (_actualModuleCount !== bookkeepingQuickbooksBlueprint.expectedModuleCount) {
  throw new Error(
    `bookkeeping-quickbooks blueprint invalid: expected ${bookkeepingQuickbooksBlueprint.expectedModuleCount} modules, got ${_actualModuleCount}`
  );
}

if (_actualLessonCount !== bookkeepingQuickbooksBlueprint.expectedLessonCount) {
  throw new Error(
    `bookkeeping-quickbooks blueprint invalid: expected ${bookkeepingQuickbooksBlueprint.expectedLessonCount} lessons, got ${_actualLessonCount}`
  );
}
