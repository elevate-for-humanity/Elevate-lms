/**
 * lib/lms/simulations/bookkeeping-simulation.ts
 *
 * Month-End Bookkeeping Lab — the hands-on simulation for the Intuit
 * Bookkeeping Professional course, built on the generic scenario engine
 * (lib/lms/scenario-simulation.ts) to the manifold gauge / forklift lab
 * contract. It attaches to the course's capstone ("Complete a Month-End
 * Bookkeeping File") and works the capstone's skills: double-entry
 * direction, a bank reconciliation computed from timing items, book-side
 * versus bank-side adjustments, the limits of a balanced trial balance,
 * and a month-end file check. Content follows the course's own lessons
 * (Double Entry, T-Accounts, Journals and the General Ledger; Bank
 * Reconciliations, Timing Items and Book Adjustments), whose worked
 * example uses the same reconciliation pattern with different figures.
 */
import {
  SCENARIO_SIMULATOR_KEY,
  type ScenarioSimulationConfig,
} from '@/lib/lms/scenario-simulation';

export const BOOKKEEPING_MONTH_END_SIM_ID = 'bookkeeping-month-end-lab';

export const BOOKKEEPING_MONTH_END_SIMULATION: ScenarioSimulationConfig = {
  simulator: SCENARIO_SIMULATOR_KEY,
  simId: BOOKKEEPING_MONTH_END_SIM_ID,
  title: 'Month-End Bookkeeping Lab — Entries, Reconciliation, and the File Check',
  description:
    'Close one month the way the course teaches it: post the entries in the right direction, build the bank reconciliation from its timing items, separate book adjustments from bank items, respect what a balanced trial balance does and does not prove, and audit the finished file. The lab is scored against the course lessons.',
  setting:
    'It is the first business day of the new month. The statement has arrived, the journal is open, and the month-end file is yours to complete.',
  badges: ['Double entry', 'Bank reconciliation', 'Accounting cycle'],
  objectives: [
    'Double-entry direction',
    'Bank reconciliation',
    'Book versus bank adjustments',
    'Trial balance judgment',
    'Month-end file quality',
  ],
  instructions: [
    'Analyze each event before entering it: source document, date, affected accounts, account types, and direction of change — the course\'s standing order of work.',
    'The adjusted bank and adjusted book balances must agree. Timing items recorded correctly in the ledger never get a second journal entry.',
  ],
  steps: [
    {
      kind: 'decide',
      id: 'equipment-entry',
      title: 'Entry 1: equipment for cash',
      prompt:
        'The business buys equipment for $1,200, paying cash from the business account. Which journal entry records it?',
      objective: 'Double-entry direction',
      options: [
        'Debit Equipment $1,200; Credit Cash $1,200',
        'Debit Cash $1,200; Credit Equipment $1,200',
        'Debit Equipment Expense $1,200; Credit Cash $1,200 — expensed immediately',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'decide',
      id: 'credit-sale-entry',
      title: 'Entry 2: services on account',
      prompt:
        'The business performs services worth $800 for a client who will pay next month. Which entry records the revenue now?',
      objective: 'Double-entry direction',
      options: [
        'Debit Accounts Receivable $800; Credit Service Revenue $800',
        'Debit Cash $800; Credit Service Revenue $800',
        'No entry until the cash arrives',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'calculate',
      id: 'bank-rec',
      title: 'Build the reconciliation',
      prompt:
        'The bank statement balance is $7,400. A deposit of $1,100 was recorded in the ledger and is in transit; outstanding checks total $900. What is the adjusted bank balance, in dollars?',
      objective: 'Bank reconciliation',
      answer: 7600,
      unit: 'dollars',
      tolerancePct: 0.5,
      points: 12,
      explanation:
        'Bank side: $7,400 + $1,100 deposit in transit − $900 outstanding checks = $7,600. The book side must be adjusted to the same $7,600 before the reconciliation is complete — agreement of the two adjusted balances is the control.',
    },
    {
      kind: 'decide',
      id: 'service-charge',
      title: 'The service charge',
      prompt:
        'The statement shows a $35 bank service charge that is not in the ledger. How is it handled?',
      objective: 'Book versus bank adjustments',
      options: [
        'It is a book-side adjustment: record the journal entry in the ledger, supported by the statement',
        'It is a timing item — ignore it and it resolves next month',
        'Adjust the bank side of the reconciliation for it',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'decide',
      id: 'trial-balance-limits',
      title: 'The balanced trial balance',
      prompt:
        'The trial balance totals agree exactly — but you spot that a $200 repair was posted to the wrong expense account. What does the agreement prove?',
      objective: 'Trial balance judgment',
      options: [
        'Only the arithmetic: equal totals are a useful control, not proof every entry is correct. A wrong-account posting keeps the balance — find it and correct the classification',
        'The books are proven correct; a balanced trial balance catches classification errors too',
        'Nothing at all — a trial balance has no control value',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'inspect',
      id: 'file-check',
      title: 'Audit the month-end file',
      prompt:
        'Review the completed file before it is closed. Flag every defect; pass what meets the course standard.',
      objective: 'Month-end file quality',
      pointsEach: 3,
      items: [
        {
          id: 'wrong-period',
          label: 'Reconciliation period',
          observation: 'The reconciliation was prepared for last month\'s statement against this month\'s ledger.',
          defect: true,
        },
        {
          id: 'duplicate-deposit',
          label: 'Deposit in transit',
          observation: 'The in-transit deposit was entered a second time in the ledger "so the bank side matches."',
          defect: true,
        },
        {
          id: 'items-compared',
          label: 'Cleared items',
          observation: 'Cleared items were compared individually, and genuinely outstanding items were carried forward.',
          defect: false,
        },
        {
          id: 'beginning-balances',
          label: 'Beginning balances',
          observation: 'Beginning balances were confirmed against the prior reconciliation before ending differences were explained.',
          defect: false,
        },
        {
          id: 'stale-check',
          label: 'Outstanding list',
          observation: 'A check from eight months ago still sits outstanding, uninvestigated, with no note in the file.',
          defect: true,
        },
      ],
    },
  ],
  syllabusTopics: [
    {
      topic: 'Double Entry, T-Accounts, Journals and the General Ledger',
      coverage: 'full',
      note: 'Both entries score debit/credit direction by account type, and the trial-balance step scores the lesson\'s exact limit: equal totals are an arithmetic control, not proof of correctness.',
    },
    {
      topic: 'Bank Reconciliations, Timing Items and Book Adjustments',
      coverage: 'full',
      note: 'The reconciliation is computed from timing items, the service charge is placed on the book side, and the file check scores period match, duplicate deposits, and stale items.',
    },
    {
      topic: 'Complete a Month-End Bookkeeping File (capstone)',
      coverage: 'embedded',
      note: 'The lab is attached to the capstone lesson and performs its month-end workflow.',
    },
    {
      topic: 'Account Reconciliations and Source Evidence',
      coverage: 'applied',
      note: 'Every adjustment in the lab must be supported by source evidence, per the lesson\'s standard.',
    },
  ],
};
