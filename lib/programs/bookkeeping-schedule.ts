/**
 * Instructor-issued bookkeeping schedule, inspected November 1, 2026.
 * Source: Dr. Carlina A. Wilkes, master syllabus v2.0 (2026), pp. 2–4;
 * updated eight-week guide, pp. 4 and 8.
 * Private attachments: communication_email_messages
 * be8b41ae-76db-4665-a202-aa52b7abe5cb and f13aef8e-46bb-4b62-be16-4bda96538db5.
 * These are instructional allocations, not video lengths, learner-earned hours,
 * third-party exam certification, or government approval.
 */
export const BOOKKEEPING_MODULE_HOURS = [
  {
    "label": "Accounting and Bookkeeping Foundations",
    "hours": 15
  },
  {
    "label": "Debits, Credits, Journals and Ledgers",
    "hours": 20
  },
  {
    "label": "Cash, Assets and Sales Transactions",
    "hours": 20
  },
  {
    "label": "Purchases, Liabilities and Equity",
    "hours": 20
  },
  {
    "label": "Adjustments and the Accounting Cycle",
    "hours": 15
  },
  {
    "label": "Reconciliation and Error Correction",
    "hours": 15
  },
  {
    "label": "Financial Statements and Analysis",
    "hours": 15
  },
  {
    "label": "Payroll, Controls and Bookkeeping Operations",
    "hours": 10
  },
  {
    "label": "Excel for Accounting Laboratories",
    "hours": 15
  },
  {
    "label": "Capstone, Remediation and Exam Preparation",
    "hours": 15
  }
] as const;

export const BOOKKEEPING_WEEK_MODULE_HOURS = [
  [
    15,
    5,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ],
  [
    0,
    15,
    5,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ],
  [
    0,
    0,
    15,
    5,
    0,
    0,
    0,
    0,
    0,
    0
  ],
  [
    0,
    0,
    0,
    15,
    5,
    0,
    0,
    0,
    0,
    0
  ],
  [
    0,
    0,
    0,
    0,
    10,
    10,
    0,
    0,
    0,
    0
  ],
  [
    0,
    0,
    0,
    0,
    0,
    5,
    15,
    0,
    0,
    0
  ],
  [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    10,
    10,
    0
  ],
  [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    5,
    15
  ]
] as const;
export const BOOKKEEPING_TOTAL_HOURS = BOOKKEEPING_MODULE_HOURS.reduce((sum, module) => sum + module.hours, 0);
export const BOOKKEEPING_WEEKS = 8;
export const BOOKKEEPING_HOURS_PER_WEEK = 20;
