/**
 * lib/lms/simulations/financial-simulation.ts
 *
 * Household Money Lab — the hands-on scenario simulation for the Financial
 * Empowerment course, built on the generic scenario engine
 * (lib/lms/scenario-simulation.ts) to the manifold gauge / forklift lab
 * contract. It works the course's first two weeks the way its lessons do —
 * with fictional figures, exactly as the lessons instruct: take-home
 * budgeting, net worth, the emergency fund, consumer protection, and debt
 * repayment order. Content and worked figures follow the lessons' own
 * examples (Income and expenses; Net worth and goals; Monthly budgeting;
 * Emergency funds; Consumer protection; Borrowing and APR; Debt
 * repayment).
 *
 * The hard fail is the consumer-protection lesson's absolute rule: never
 * share a one-time verification code, and never act on an urgent caller\'s
 * demand — hang up and contact the institution independently.
 */
import {
  SCENARIO_SIMULATOR_KEY,
  type ScenarioSimulationConfig,
} from '@/lib/lms/scenario-simulation';

export const FINANCIAL_HOUSEHOLD_SIM_ID = 'financial-household-money-lab';

export const FINANCIAL_HOUSEHOLD_SIMULATION: ScenarioSimulationConfig = {
  simulator: SCENARIO_SIMULATOR_KEY,
  simId: FINANCIAL_HOUSEHOLD_SIM_ID,
  title: 'Household Money Lab — Budget, Safety Net, and Debt Decisions',
  description:
    'Work one household month with the course\'s fictional figures: build the budget from take-home pay, compute net worth, place the emergency fund correctly, handle a scam call the way the protection lesson requires, and order a debt payoff. The lab is scored against the course lessons.',
  setting:
    'All figures are fictional, as in the lessons. The household takes home $2,800 a month and is setting up its first real budget and safety net.',
  badges: ['Budgeting', 'Emergency funds', 'Consumer protection'],
  objectives: [
    'Take-home budgeting',
    'Net worth',
    'Emergency fund placement',
    'Consumer protection',
    'Debt repayment order',
  ],
  instructions: [
    'One choice in this lab scores 0 outright: sharing a one-time verification code or sending an urgent transfer at a caller\'s demand. The protection lesson\'s rule: hang up and contact the bank independently through its official channel — and never share the code with anyone.',
    'Budgets are built from take-home pay — the cash actually available after deductions — never from gross pay.',
  ],
  steps: [
    {
      kind: 'calculate',
      id: 'budget-leftover',
      title: 'What the budget leaves',
      prompt:
        'Take-home income is $2,800. Planned spending for the month — essentials, flexible costs, debt minimums, and planned savings — totals $2,350. How much is left unplanned, in dollars?',
      objective: 'Take-home budgeting',
      answer: 450,
      unit: 'dollars',
      tolerancePct: 1,
      points: 12,
      explanation:
        '$2,800 − $2,350 = $450. The leftover is a decision, not an accident: the budgeting lesson plans income across essentials, flexible costs, debt minimums, and savings, then reviews actual spending weekly.',
    },
    {
      kind: 'decide',
      id: 'gross-vs-takehome',
      title: 'The wrong starting number',
      prompt:
        'A first draft of the budget was built on the salary figure of $3,300 a month — but the paycheck that actually lands is $2,800 after deductions. What does the course say?',
      objective: 'Take-home budgeting',
      options: [
        'Rebuild on $2,800: take-home pay is the available cash; a budget built on gross pay plans money that never arrives',
        'Keep $3,300 — deductions even out over the year',
        'Split the difference and budget on $3,050',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'calculate',
      id: 'net-worth',
      title: 'Net worth',
      prompt:
        'The household lists assets of $5,000 and debts of $2,000. What is its net worth, in dollars?',
      objective: 'Net worth',
      answer: 3000,
      unit: 'dollars',
      tolerancePct: 1,
      points: 10,
      explanation:
        'Net worth = assets − liabilities = $5,000 − $2,000 = $3,000. It is a snapshot for planning goals against — the lesson is careful that it measures a financial position, never a person\'s worth.',
    },
    {
      kind: 'decide',
      id: 'emergency-fund',
      title: 'Place the safety net',
      prompt:
        'The household is building toward three months of essential expenses ($1,500 a month, so a $4,500 target). Where does the emergency fund belong while it grows?',
      objective: 'Emergency fund placement',
      options: [
        'In accessible savings that can be reached immediately when an essential expense hits',
        'In a volatile investment, so it grows faster toward the target',
        'Applied to the credit card balance — debt reduction is the real emergency fund',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'decide',
      id: 'scam-call',
      title: 'The urgent call',
      prompt:
        'A caller claiming to be the bank\'s fraud department says the account is being emptied right now. He needs you to confirm the one-time verification code that was just texted, and to move money to a "safe account" immediately. What do you do?',
      objective: 'Consumer protection',
      options: [
        'Hang up and contact the bank independently through its official number or app; never share a one-time verification code with anyone',
        'Read him the code — the text message really did arrive, so the call must be genuine',
        'Move the money first and verify afterwards; minutes matter in a fraud',
      ],
      correct: 0,
      hardFailOptions: [1, 2],
      hardFailMessage:
        'The consumer-protection lesson\'s rule is absolute: never share a one-time verification code. The arriving text is part of the attack — the caller triggered it by attempting the sign-in himself, and the code is the last thing standing between him and the account. Urgency is the tool: a real institution is reached independently, through its verified official channel, after you hang up. This attempt cannot pass.',
      points: 12,
    },
    {
      kind: 'decide',
      id: 'debt-order',
      title: 'Order the payoff',
      prompt:
        'Minimums are covered on every debt. There is $150 extra this month. One card charges 22% APR; another charges 8% APR. Which payoff order does the lesson say generally saves the most interest?',
      objective: 'Debt repayment order',
      options: [
        'Extra principal to the 22% APR debt first — highest-rate-first generally reduces interest the most (smallest-balance-first is the motivation alternative the lesson also names)',
        'Extra principal to the 8% APR debt, to clear the "cheap" one first',
        'Skip one minimum this month and put everything on a single debt',
      ],
      correct: 0,
      points: 10,
    },
  ],
  syllabusTopics: [
    {
      topic: 'Income and expenses / Monthly budgeting',
      coverage: 'full',
      note: 'Both budgeting steps use the lessons\' own figures and their standing caution: budget from take-home, not gross.',
    },
    {
      topic: 'Net worth and goals',
      coverage: 'applied',
      note: 'The net-worth calculation reproduces the lesson\'s worked example pattern.',
    },
    {
      topic: 'Emergency funds',
      coverage: 'applied',
      note: 'The placement step scores the lesson\'s accessibility rule and its three-months-of-essentials target math.',
    },
    {
      topic: 'Consumer protection',
      coverage: 'full',
      note: 'The scam-call step hard-fails code-sharing and urgent transfers, per the lesson\'s worked example and caution.',
    },
    {
      topic: 'Debt repayment / Borrowing and APR',
      coverage: 'applied',
      note: 'The payoff step scores highest-rate-first reasoning with minimums protected, as the lessons teach.',
    },
  ],
};
