/* ACT WorkKeys NCRC pricing for Elevate Testing Center.
 * 
 * STRIPE PAYMENT LINKS (Live):
 * - Applied Math: https://buy.stripe.com/aFacN53YYcjk2FR93rgIo15 ($55)
 * - Graphic Literacy: https://buy.stripe.com/9B64gzeDCgzAcgr4NbgIo16 ($55)
 * - Workplace Documents: https://buy.stripe.com/7sY7sLanm4QS80b6VjgIo17 ($55)
 * - Full NCRC Bundle (all 3): https://buy.stripe.com/00w5kD3YY6Z0a8j5RfgIo18 ($165)
 * 
 * Price breakdown per test ($55):
 * - ACT voucher fee: $18
 * - Proctor time (45 min): $22
 * - Facility overhead: $12
 * - Total cost: $52 | Margin: $3 (5.5%)
 */

export const WORKKEYS_STRIPE_PRICES = {
  appliedMath: {
    stripePriceId: 'price_1TmhS1H4a2yrVOt5X3YQMfZp',
    name: 'Applied Math',
    shortName: 'AM',
    price: 55,
    paymentLink: 'https://buy.stripe.com/aFacN53YYcjk2FR93rgIo15',
    description: 'Measures math skills for workplace tasks — measurements, calculations, data interpretation, and problem-solving. Calculator provided. 33 questions, 55 minutes.',
    duration: '55 minutes',
    questions: 33,
  },
  graphicLiteracy: {
    stripePriceId: 'price_1TmhS1H4a2yrVOt5w4PekjLd',
    name: 'Graphic Literacy',
    shortName: 'GL',
    price: 55,
    paymentLink: 'https://buy.stripe.com/9B64gzeDCgzAcgr4NbgIo16',
    description: 'Reading and interpreting workplace graphics — charts, graphs, diagrams, tables, and maps. Uses information to make decisions. 38 questions, 55 minutes.',
    duration: '55 minutes',
    questions: 38,
  },
  workplaceDocuments: {
    stripePriceId: 'price_1TmhS2H4a2yrVOt5lepQDywp',
    name: 'Workplace Documents',
    shortName: 'WD',
    price: 55,
    paymentLink: 'https://buy.stripe.com/7sY7sLanm4QS80b6VjgIo17',
    description: 'Reading and using workplace documents — forms, policies, schedules, instructions, and procedures. Finding information and following directions. 35 questions, 55 minutes.',
    duration: '55 minutes',
    questions: 35,
  },
  ncrcBundle: {
    name: 'Full NCRC Bundle',
    shortName: 'ALL-3',
    price: 165,
    paymentLink: 'https://buy.stripe.com/00w5kD3YY6Z0a8j5RfgIo18',
    description: 'All 3 WorkKeys assessments in one session. Save $55 vs individual tests. Complete all 3 to earn your NCRC credential.',
    duration: '3+ hours',
    questions: 106,
    savings: 55,
  },
} as const;

// Legacy exports for backward compatibility
export const WORKKEYS_PRICING = {
  individual: { price: 55, trueCost: 52, margin: 0.054 },
  ncrc: { price: 165, trueCost: 156, margin: 0.054 },
  agencyReferral: { price: 45, trueCost: 52, margin: -0.155 },
  retake: { price: 45, feeCents: 4500 },
  noShow: { price: 50, feeCents: 5000 },
} as const;

export const WORKKEYS_FEES = [
  { label: 'Applied Math', amount: 55, note: '$55 per test' },
  { label: 'Graphic Literacy', amount: 55, note: '$55 per test' },
  { label: 'Workplace Documents', amount: 55, note: '$55 per test' },
  { label: 'Full NCRC Bundle', amount: 165, note: 'Save $55 — all 3 tests' },
] as const;
