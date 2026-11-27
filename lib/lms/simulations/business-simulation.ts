/**
 * lib/lms/simulations/business-simulation.ts
 *
 * Small Business Operations Lab — the hands-on simulation for the Business
 * Administration (ESB) course, built on the generic scenario engine
 * (lib/lms/scenario-simulation.ts) to the manifold gauge / forklift lab
 * contract. It complements the workbook's Business of Retail case lab
 * (which records into workbook answers) with a scored lesson-flow
 * simulation recorded in interaction_progress: break-even, margin versus
 * markup, discount effects, cost classification, and the cash-flow
 * timing judgments from the course's financials domain (lessons
 * esb-v2-selling-price-unit-economics, esb-v2-fixed-variable-breakeven,
 * esb-v2-cash-flow). Figures are the lessons' own worked-example style —
 * hypothetical training numbers, as the lessons themselves use.
 */
import {
  SCENARIO_SIMULATOR_KEY,
  type ScenarioSimulationConfig,
} from '@/lib/lms/scenario-simulation';

export const BUSINESS_OPERATIONS_SIM_ID = 'business-operations-lab';

export const BUSINESS_OPERATIONS_SIMULATION: ScenarioSimulationConfig = {
  simulator: SCENARIO_SIMULATOR_KEY,
  simId: BUSINESS_OPERATIONS_SIM_ID,
  title: 'Small Business Operations Lab — Price It, Break Even, Mind the Cash',
  description:
    'Run the numbers of one small offer the way the financials domain teaches: classify its costs, compute its break-even, keep markup and margin straight, judge a discount, and read a profitable-but-cash-tight month correctly. The lab is scored against the course lessons.',
  setting:
    'You are launching a small service-and-product offer. The figures below are the venture\'s working model for its first quarter.',
  badges: ['Unit economics', 'Break-even analysis', 'Cash flow'],
  objectives: [
    'Cost classification',
    'Break-even calculation',
    'Margin versus markup',
    'Discount judgment',
    'Cash-flow timing',
  ],
  instructions: [
    'State the cost definition before comparing margins — the lessons\' standing rule. Markup divides by cost; margin divides by price; they are never interchangeable.',
    'Break-even tells you the volume the model requires. It does not guarantee customers will buy it — the lessons are explicit on both halves.',
  ],
  steps: [
    {
      kind: 'inspect',
      id: 'cost-classification',
      title: 'Classify the costs',
      prompt:
        'A trainee classified this quarter\'s costs. Flag every MISclassification; pass the ones classified the way the lessons teach (fixed = unchanged over the activity range in this model; variable = changes with units).',
      objective: 'Cost classification',
      pointsEach: 3,
      items: [
        {
          id: 'rent-variable',
          label: 'Workspace rent, $900/month — listed as variable',
          observation: 'The rent is the same whether the venture sells 10 units or 200 this quarter.',
          defect: true,
        },
        {
          id: 'material-variable',
          label: 'Material per unit, $14 — listed as variable',
          observation: 'Every unit sold consumes one unit of material.',
          defect: false,
        },
        {
          id: 'delivery-fixed',
          label: 'Delivery fee per order, $6 — listed as fixed',
          observation: 'The courier charges per delivery; more orders means more fees.',
          defect: true,
        },
        {
          id: 'salary-fixed',
          label: 'Manager salary for the quarter — listed as fixed',
          observation: 'The salary does not change with this quarter\'s unit volume.',
          defect: false,
        },
        {
          id: 'packaging-variable',
          label: 'Packaging per unit, $2 — listed as variable',
          observation: 'Each shipped unit uses one package.',
          defect: false,
        },
      ],
    },
    {
      kind: 'calculate',
      id: 'break-even',
      title: 'Compute the break-even',
      prompt:
        'The offer sells at $60 per unit with variable costs of $36 per unit. Fixed costs for the quarter are $2,400. How many units must sell to break even?',
      objective: 'Break-even calculation',
      answer: 100,
      unit: 'units',
      tolerancePct: 1,
      points: 12,
      explanation:
        'Contribution per unit = $60 − $36 = $24. Break-even units = fixed costs ÷ contribution per unit = $2,400 ÷ $24 = 100 units. Below 100 the model loses money; the formula assumes price and costs hold over the range.',
    },
    {
      kind: 'calculate',
      id: 'margin-vs-markup',
      title: 'Margin, not markup',
      prompt:
        'A product costs $30 and sells for $50. What is its GROSS MARGIN percentage? (Careful: the denominator is the question.)',
      objective: 'Margin versus markup',
      answer: 40,
      unit: '%',
      tolerancePct: 1,
      points: 12,
      explanation:
        'Gross profit is $50 − $30 = $20. Gross margin divides by the selling price: $20 ÷ $50 = 40%. Markup divides by cost: $20 ÷ $30 = 66.7%. Quoting the 66.7% as "margin" overstates the offer\'s profitability — the exact confusion the lesson warns against.',
    },
    {
      kind: 'decide',
      id: 'discount-effect',
      title: 'The 10% discount',
      prompt:
        'Sales suggests a 10% discount on that $50 product (cost still $30) "because 10% off only costs us 10%." What actually happens to gross profit per unit?',
      objective: 'Discount judgment',
      options: [
        'Price falls to $45 and gross profit falls from $20 to $15 — a 25% reduction per unit, because the discount comes entirely out of profit',
        'Gross profit falls by 10%, from $20 to $18',
        'Nothing changes if the discount is temporary',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'decide',
      id: 'profitable-no-cash',
      title: 'Profitable, and out of cash',
      prompt:
        'The month closes with a healthy profit on the income statement — but the biggest customer pays on 45-day terms, rent is due Friday, and the account is short. Which reading matches the cash-flow lesson?',
      objective: 'Cash-flow timing',
      options: [
        'Earning revenue and collecting cash happen at different times; a profitable venture can still miss obligations. Work from actual receipt and payment dates — terms, timing, and working-capital composition decide Friday, not the profit figure',
        'The profit figure must be wrong; profit and cash are the same thing',
        'Spend against the receivable now — the money is earned, so it is available',
      ],
      correct: 0,
      points: 12,
    },
    {
      kind: 'decide',
      id: 'working-capital-reading',
      title: 'Reading working capital',
      prompt:
        'A lender notes the venture\'s working capital is positive and calls it "financially comfortable." What does the lesson add?',
      objective: 'Cash-flow timing',
      options: [
        'Working capital (current assets minus current liabilities) mixes cash, receivables, and inventory — which do not spend the same way. A positive figure alone does not guarantee cash on a particular date; examine what the assets consist of and when obligations fall due',
        'Positive working capital guarantees every bill can be paid on time',
        'Inventory counts as cash for payment purposes',
      ],
      correct: 0,
      points: 10,
    },
  ],
  syllabusTopics: [
    {
      topic: 'Fixed Costs, Variable Costs, and Break-Even Thinking',
      coverage: 'full',
      note: 'Classification is judged by cost behavior in the model, and break-even is computed from contribution per unit, exactly as the lesson works it.',
    },
    {
      topic: 'Selling Price and Unit Economics',
      coverage: 'full',
      note: 'The margin-versus-markup calculation and the discount step reproduce the lesson\'s own worked example and its warning.',
    },
    {
      topic: 'Cash Flow and Working Capital',
      coverage: 'full',
      note: 'Both closing decisions score the lesson\'s core distinctions: earning versus collecting, and working capital composition versus cash on a date.',
    },
    {
      topic: 'Capstone: Marketing, Operations, and Financial Plan',
      coverage: 'embedded',
      note: 'The lab is attached to the capstone financial-plan lesson and runs its numbers end to end.',
    },
  ],
};
