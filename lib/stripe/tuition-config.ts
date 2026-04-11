/**
 * TUITION CONFIGURATION
 * 
 * This file defines the locked-down payment structure for non-funded students.
 * 
 * THREE PAYMENT TIERS (in order of preference):
 * 1. Third-Party Financing (Klarna/Afterpay/Zip/Klarna) - Student approved by provider, we get paid upfront
 * 2. Employer Sponsorship - Employer pays, requires signed agreement
 * 3. Internal Payment Plan - Deposit + 6-month autopay max, strict enforcement
 * 
 * RULES:
 * - No custom terms
 * - No verbal negotiations
 * - No exceptions without Executive Director written approval
 */

// =============================================================================
// PROGRAM TUITION AMOUNTS
// =============================================================================

export interface ProgramTuition {
  programId: string;
  programName: string;
  tuitionAmount: number;
  registrationFee: number; // Non-refundable, included in tuition
  
  // Internal payment plan structure (Tier 3)
  internalPlan: {
    minDownPayment: number;
    downPaymentPercent: number;
    maxTermMonths: number;
    monthlyPayment: number;
  };
}

export const PROGRAM_TUITION: ProgramTuition[] = [
  {
    programId: 'prog-barber',
    programName: 'Barber Apprenticeship',
    tuitionAmount: 4980,
    registrationFee: 150,
    internalPlan: {
      minDownPayment: 1000,
      downPaymentPercent: 20,
      maxTermMonths: 6,
      monthlyPayment: 663, // ($4980 - $1000) / 6
    },
  },
  {
    programId: 'prog-cna',
    programName: 'CNA Training Program',
    tuitionAmount: 2200,
    registrationFee: 150,
    internalPlan: {
      minDownPayment: 600,
      downPaymentPercent: 27,
      maxTermMonths: 4,
      monthlyPayment: 400, // ($2200 - $600) / 4
    },
  },
  {
    programId: 'prog-hvac',
    programName: 'HVAC Technician',
    tuitionAmount: 4800,
    registrationFee: 150,
    internalPlan: {
      minDownPayment: 1000,
      downPaymentPercent: 21,
      maxTermMonths: 6,
      monthlyPayment: 633, // ($4800 - $1000) / 6
    },
  },
  {
    programId: 'prog-cdl',
    programName: 'CDL Training Program',
    tuitionAmount: 5200,
    registrationFee: 150,
    internalPlan: {
      minDownPayment: 1000,
      downPaymentPercent: 19,
      maxTermMonths: 6,
      monthlyPayment: 700, // ($5200 - $1000) / 6
    },
  },
  {
    programId: 'prog-business-apprentice',
    programName: 'Business Support Apprenticeship',
    tuitionAmount: 3500,
    registrationFee: 150,
    internalPlan: {
      minDownPayment: 700,
      downPaymentPercent: 20,
      maxTermMonths: 6,
      monthlyPayment: 467, // ($3500 - $700) / 6
    },
  },
  {
    programId: 'prog-esthetics-apprentice',
    programName: 'Esthetics Apprenticeship',
    tuitionAmount: 6000,
    registrationFee: 150,
    internalPlan: {
      minDownPayment: 2100,
      downPaymentPercent: 35,
      maxTermMonths: 6,
      monthlyPayment: 650, // ($6000 - $2100) / 6
    },
  },
];

// =============================================================================
// PAYMENT TIER CONFIGURATION
// =============================================================================

/**
 * TIER 1: THIRD-PARTY FINANCING
 * Student applies through Klarna/Afterpay/Zip at checkout.
 * If approved, provider pays us upfront. Provider carries default risk.
 */
export const TIER1_THIRD_PARTY_FINANCING = {
  name: 'Pay in 4',
  providers: ['klarna', 'afterpay_clearpay', 'zip'] as const,
  enabled: true,
  
  // Stripe payment method types to enable
  stripePaymentMethods: ['klarna', 'afterpay_clearpay', 'zip'] as const,
  
  // Terms (set by providers, not us)
  typicalTerms: {
    minAmount: 50,
    maxAmount: 2000,
    payments: 4,
    apr: 0, // Interest-free when paid on time
  },
  
  // What we tell students
  studentMessage: 'Pay in 4 interest-free payments with Klarna, Afterpay, or Zip. Get approved in minutes.',
  declinedMessage: 'No problem—you can use our school payment plan instead (deposit + monthly autopay).',
};

/**
 * TIER 2: EMPLOYER SPONSORSHIP
 * Employer agrees to pay tuition. Requires signed agreement before enrollment.
 */
export const TIER2_EMPLOYER_SPONSORSHIP = {
  name: 'Employer-Sponsored',
  enabled: true,
  
  requirements: [
    'Employer must be approved partner',
    'Signed employer agreement required BEFORE enrollment',
    'Agreement must specify payment schedule',
  ],
  
  // Typical structure
  typicalTerms: {
    paymentSchedule: 'monthly_post_hire',
    maxTermMonths: 12,
  },
  
  // What we tell students
  studentMessage: 'Your employer can pay your tuition directly or through payroll deduction.',
  
  // Required documents
  requiredDocuments: [
    'employer_sponsorship_agreement',
    'employer_payment_authorization',
  ],
};

/**
 * TIER 3A: INTERNAL BRIDGE PLAN
 * Short-term bridge to get student started while transitioning to permanent payor.
 * 90 DAYS MAXIMUM - NO EXCEPTIONS.
 */
export const TIER3A_BRIDGE_PLAN = {
  name: 'Bridge Payment Plan',
  enabled: true,
  
  // HARD LIMITS - DO NOT CHANGE WITHOUT EXECUTIVE APPROVAL
  rules: {
    downPayment: 600, // Fixed $600 minimum
    monthlyPayment: 200, // Fixed $200/month minimum
    maxTermMonths: 3, // 90 DAYS HARD STOP
    totalCollectedInternally: 1200, // $600 + ($200 × 3) = $1,200 max
    paymentMethod: 'autopay_only' as const,
    lateFee: 50,
    gracePeriodDays: 7,
  },
  
  // TRANSITION REQUIREMENT AT DAY 90
  transitionRequirement: {
    deadline: 90, // days
    options: [
      'employer_reimbursement',
      'third_party_financing',
      'pay_remaining_balance_in_full',
    ],
    noExtensions: true,
    noRenegotiation: true,
  },
  
  // ENFORCEMENT - AUTOMATIC, NO EXCEPTIONS
  enforcement: {
    missedPaymentAction: 'academic_pause' as const,
    missedPaymentsBeforeTermination: 2,
    credentialHoldUntilPaid: true,
    noManualPaymentOption: true,
    day90Action: 'transition_or_pause' as const,
  },
  
  // What we tell students
  studentMessage: 'Start with $500 down and $200/month for 3 months while we help you secure long-term funding.',
  
  // Required documents
  requiredDocuments: [
    'enrollment_agreement',
    'bridge_payment_agreement',
    'autopay_authorization',
    'transition_acknowledgment',
    'refund_policy_acknowledgment',
  ],
};

/**
 * TIER 3B: LONG-TERM PAYMENTS (EXTERNALIZED)
 * For any payment need below $200/month or beyond 90 days.
 * Elevate for Humanity does NOT carry these balances.
 */
export const TIER3B_EXTERNAL_FINANCING = {
  name: 'External Financing Required',
  enabled: true,
  
  // When this applies
  triggers: [
    'monthly_payment_below_200',
    'term_beyond_90_days',
    'bridge_plan_transition',
  ],
  
  // External options
  options: [
    {
      name: 'Pay in 4',
      providers: ['klarna', 'afterpay', 'zip'],
      description: 'Apply at checkout. Split into 4 interest-free payments.',
    },
    {
      name: 'Employer Reimbursement',
      description: 'Employer pays remaining balance directly or via payroll deduction.',
    },
  ],
  
  // What we tell students
  studentMessage: 'For flexible payment options, use Klarna, Afterpay, or Zip at checkout, or employer sponsorship.',
  
  // What we do NOT do
  prohibited: [
    'Internal plans longer than 90 days',
    'Internal payments below $200/month',
    'Carrying student balances beyond bridge period',
  ],
};

// =============================================================================
// REFUND POLICY
// =============================================================================

export const REFUND_POLICY = {
  registrationFee: 150, // Non-refundable
  
  beforeProgramStart: {
    refundType: 'full_minus_fee' as const,
    processingDays: 10,
  },
  
  afterProgramStart: {
    refundType: 'prorated' as const,
    noRefundAfterPercent: 50,
    calculation: '(AmountPaid - RegistrationFee) × (1 - CompletionPercent)',
  },
  
  nonRefundableItems: [
    'Registration fee ($150)',
    'Materials/supplies already issued',
    'Certification exam fees already paid to third parties',
  ],
};

// =============================================================================
// DECISION LOGIC
// =============================================================================

export type PaymentEligibility = 
  | 'funded' // WIOA, Pell, etc. - not covered by this config
  | 'pay_in_full'
  | 'third_party_financing'
  | 'employer_sponsored'
  | 'internal_plan'
  | 'not_ready'; // Cannot meet any payment option

export interface PaymentDecision {
  eligibility: PaymentEligibility;
  reason: string;
  nextStep: string;
}

/**
 * Determine payment eligibility based on student situation.
 * This implements the decision flowchart from the policy.
 */
export function determinePaymentEligibility(params: {
  isFundingEligible: boolean;
  canPayInFull: boolean;
  bnplApproved: boolean | null; // null = not yet checked
  hasEmployerSponsor: boolean;
  canPayDeposit: boolean;
}): PaymentDecision {
  const { isFundingEligible, canPayInFull, bnplApproved, hasEmployerSponsor, canPayDeposit } = params;
  
  // Step 1: Check funding eligibility
  if (isFundingEligible) {
    return {
      eligibility: 'funded',
      reason: 'Student is eligible for WIOA, Pell, or other grant funding.',
      nextStep: 'Process through funded enrollment pathway.',
    };
  }
  
  // Step 2: Can pay in full?
  if (canPayInFull) {
    return {
      eligibility: 'pay_in_full',
      reason: 'Student can pay full tuition at enrollment.',
      nextStep: 'Process pay-in-full checkout.',
    };
  }
  
  // Step 3: Third-party financing
  if (bnplApproved === true) {
    return {
      eligibility: 'third_party_financing',
      reason: 'Student approved for Klarna/Afterpay/Zip/Klarna financing.',
      nextStep: 'Complete checkout with BNPL payment method.',
    };
  }
  
  // Step 4: Employer sponsorship
  if (hasEmployerSponsor) {
    return {
      eligibility: 'employer_sponsored',
      reason: 'Student has employer willing to sponsor tuition.',
      nextStep: 'Obtain signed employer agreement, then process enrollment.',
    };
  }
  
  // Step 5: Internal payment plan
  if (canPayDeposit) {
    return {
      eligibility: 'internal_plan',
      reason: 'Student can pay deposit and commit to autopay.',
      nextStep: 'Process deposit checkout and create subscription.',
    };
  }
  
  // Step 6: Not enrollment-ready
  return {
    eligibility: 'not_ready',
    reason: 'Student cannot meet any payment option at this time.',
    nextStep: 'Provide information about funding options. Invite to return when ready.',
  };
}

// =============================================================================
// HELPERS
// =============================================================================

export function getProgramTuition(programId: string): ProgramTuition | undefined {
  return PROGRAM_TUITION.find(p => p.programId === programId);
}

export function calculateRefund(
  amountPaid: number,
  completionPercent: number,
  hasStarted: boolean
): number {
  if (!hasStarted) {
    return Math.max(0, amountPaid - REFUND_POLICY.registrationFee);
  }
  
  if (completionPercent >= REFUND_POLICY.afterProgramStart.noRefundAfterPercent) {
    return 0;
  }
  
  const refundableAmount = amountPaid - REFUND_POLICY.registrationFee;
  return Math.max(0, Math.round(refundableAmount * (1 - completionPercent / 100)));
}

// =============================================================================
// PAYMENT METHODS CONFIGURATION
// =============================================================================

export const PAYMENT_METHODS = {
  card: true,
  us_bank_account: true,
  klarna: true,
  afterpay_clearpay: true,
  zip: true,
};

// =============================================================================
// INSTALLMENT RULES - WEEKLY PAYMENTS
// =============================================================================

export const INSTALLMENT_RULES = {
  // Payment frequency
  interval: 'week' as const, // 'week' or 'month'
  
  // Enforcement
  suspendOnFailure: true,
  gracePeriodDays: 3,
  maxFailedPayments: 2,
  
  // Late fees
  lateFee: 25,
  applyLateFeeAfterDays: 7,
};

// =============================================================================
// TUITION PRODUCTS - Used by checkout
// =============================================================================

export interface TuitionProduct {
  programId: string;
  programName: string;
  totalTuition: number;
  registrationFee: number;
  
  // Pay in full option
  payInFull: {
    amount: number;
    discount: number;
  };
  
  // Installment plan (weekly payments after deposit)
  installmentPlan: {
    depositAmount: number;
    weeklyAmount: number;
    numberOfWeeks: number;
    totalPayments: number;
  };
}

export const TUITION_PRODUCTS: TuitionProduct[] = [
  {
    programId: 'prog-barber',
    programName: 'Barber Apprenticeship',
    totalTuition: 4980,
    registrationFee: 150,
    payInFull: {
      amount: 4980,
      discount: 0,
    },
    installmentPlan: {
      depositAmount: 1000,
      weeklyAmount: 166, // ($4980 - $1000) / 24 weeks
      numberOfWeeks: 24,
      totalPayments: 24,
    },
  },
  {
    programId: 'prog-cna',
    programName: 'CNA Training Program',
    totalTuition: 2200,
    registrationFee: 150,
    payInFull: {
      amount: 2200,
      discount: 0,
    },
    installmentPlan: {
      depositAmount: 600,
      weeklyAmount: 100, // ($2200 - $600) / 16 weeks
      numberOfWeeks: 16,
      totalPayments: 16,
    },
  },
  {
    programId: 'prog-hvac',
    programName: 'HVAC Technician',
    totalTuition: 4800,
    registrationFee: 150,
    payInFull: {
      amount: 4800,
      discount: 0,
    },
    installmentPlan: {
      depositAmount: 1000,
      weeklyAmount: 158, // ($4800 - $1000) / 24 weeks
      numberOfWeeks: 24,
      totalPayments: 24,
    },
  },
  {
    programId: 'prog-cdl',
    programName: 'CDL Training Program',
    totalTuition: 5200,
    registrationFee: 150,
    payInFull: {
      amount: 5200,
      discount: 0,
    },
    installmentPlan: {
      depositAmount: 1000,
      weeklyAmount: 175, // ($5200 - $1000) / 24 weeks
      numberOfWeeks: 24,
      totalPayments: 24,
    },
  },
  {
    programId: 'prog-business-apprentice',
    programName: 'Business Support Apprenticeship',
    totalTuition: 3500,
    registrationFee: 150,
    payInFull: {
      amount: 3500,
      discount: 0,
    },
    installmentPlan: {
      depositAmount: 700,
      weeklyAmount: 117, // ($3500 - $700) / 24 weeks
      numberOfWeeks: 24,
      totalPayments: 24,
    },
  },
  {
    programId: 'prog-esthetics-apprentice',
    programName: 'Esthetics Apprenticeship',
    totalTuition: 6000,
    registrationFee: 150,
    payInFull: {
      amount: 6000,
      discount: 0,
    },
    installmentPlan: {
      depositAmount: 2100,
      weeklyAmount: 163, // ($6000 - $2100) / 24 weeks
      numberOfWeeks: 24,
      totalPayments: 24,
    },
  },
];

/**
 * Get tuition config for a program
 */
export function getTuitionConfig(programId: string): TuitionProduct | undefined {
  return TUITION_PRODUCTS.find(p => p.programId === programId);
}
