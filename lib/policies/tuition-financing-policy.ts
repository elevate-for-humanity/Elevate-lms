import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * TUITION FINANCING POLICY
 * Elevate for Humanity Career and Training Institute
 *
 * This policy governs all non-funded (non-WIOA, non-Pell) tuition payments.
 * Staff must follow this policy exactly. No verbal negotiations. No exceptions
 * without written approval from the Executive Director.
 *
 * EFFECTIVE DATE: January 2025
 * LAST UPDATED: January 2025
 */

export const TUITION_FINANCING_POLICY = {
  version: '1.0',
  effectiveDate: '2025-01-15',

  /**
   * POLICY STATEMENT
   */
  policyStatement: `
${PLATFORM_DEFAULTS.orgName} Career and Training Institute offers multiple pathways for students 
to pay tuition for non-funded programs. This policy establishes clear, consistent rules 
for tuition collection that protect both students and the institution.

The Institute is NOT a lender. All payment arrangements must follow the structures 
defined in this policy. Staff are prohibited from negotiating custom payment terms, 
waiving fees, or making verbal promises about payment flexibility.
  `.trim(),

  /**
   * PAYMENT OPTIONS (in order of preference)
   */
  paymentOptions: {
    /**
     * OPTION 1: THIRD-PARTY FINANCING (PREFERRED)
     * Student finances through approved provider. Institute receives payment upfront.
     * Default risk is carried by the financing provider, not the Institute.
     */
    thirdPartyFinancing: {
      name: 'Third-Party Tuition Financing',
      description:
        'Finance your tuition through an approved education lender. Get approved in minutes, pay over 6-24 months.',
      providers: ['Klarna/Afterpay/Zip', 'Klarna', 'Climb Credit'],
      terms: {
        minAmount: 500,
        maxAmount: 10000,
        termLengthMonths: { min: 3, max: 24 },
        typicalMonthlyPayment: { min: 225, max: 400 }, // for $5,000
        approvalType: 'soft_credit_check',
      },
      instituteBenefit:
        'Institute receives full tuition (minus small servicing fee) within days. Zero default risk.',
      studentBenefit: 'Predictable monthly payments. Build credit history. No large upfront cost.',
      eligibility: 'Students with income or fair credit history.',
    },

    /**
     * OPTION 2: EMPLOYER REIMBURSEMENT
     * Employer agrees to pay tuition on behalf of employee/new hire.
     * Must have signed employer agreement before enrollment.
     */
    employerReimbursement: {
      name: 'Employer-Sponsored Tuition',
      description: 'Your employer pays tuition directly or through payroll deduction after hire.',
      terms: {
        requiresSignedAgreement: true,
        paymentSchedule: 'monthly_post_hire',
        typicalMonthlyPayment: { min: 250, max: 500 },
        maxTermMonths: 12,
      },
      instituteBenefit: 'Employer carries payment responsibility. Strong placement incentive.',
      studentBenefit: 'No out-of-pocket cost if employer pays directly.',
      eligibility:
        'Students with confirmed employer partner willing to sign reimbursement agreement.',
      restrictions: [
        'Employer must be approved partner',
        'Signed agreement required BEFORE enrollment',
        'Not available for open enrollment',
      ],
    },

    /**
     * OPTION 3: INTERNAL INSTALLMENT PLAN (SELECTIVE)
     * Institute-managed payment plan. Use only when Options 1 and 2 are not viable.
     * Strict terms. No exceptions.
     */
    internalInstallmentPlan: {
      name: 'School Payment Plan',
      description:
        'Pay a deposit now, then fixed monthly payments via autopay. No credit check required.',
      terms: {
        minDownPayment: 1000,
        downPaymentPercent: 20, // 20% minimum
        maxTermMonths: 6, // HARD LIMIT - no longer terms
        paymentMethod: 'autopay_only', // No manual payments
        lateFeeAmount: 50,
        gracePeriodDays: 7,
      },
      enforcement: {
        missedPaymentAction: 'academic_pause', // Immediate
        missedPaymentGraceDays: 7,
        terminationAfterMissedPayments: 2,
        credentialHold: true, // No certificates until balance = $0
      },
      instituteBenefit: 'Controlled exposure. Short term. Autopay reduces collection effort.',
      studentBenefit: 'No credit check. Predictable payments. Access to training.',
      eligibility: 'Students who do not qualify for third-party financing or employer sponsorship.',
      restrictions: [
        'Maximum 6 months - no exceptions',
        'Autopay required - no manual payment option',
        'Missed payment = immediate academic pause',
        'No completion documents until paid in full',
      ],
    },

    /**
     * OPTION 4: PAY IN FULL
     * Single payment at enrollment. Simplest option.
     */
    payInFull: {
      name: 'Pay in Full',
      description: 'Pay your full tuition at enrollment and start immediately.',
      discount: 0, // No discount - tuition is tuition
      paymentMethods: ['credit_card', 'debit_card', 'ach_bank_transfer'],
      instituteBenefit: 'Immediate full payment. Zero collection risk.',
      studentBenefit: 'No ongoing payments. No interest. Immediate access.',
      eligibility: 'Any student with funds available.',
    },
  },

  /**
   * DECISION RULES FOR STAFF
   * Follow this flowchart exactly. Do not skip steps.
   */
  decisionRules: [
    {
      step: 1,
      question: 'Is the student eligible for WIOA, Pell, or other grant funding?',
      ifYes: 'Process through funded enrollment pathway. This policy does not apply.',
      ifNo: 'Continue to Step 2.',
    },
    {
      step: 2,
      question: 'Can the student pay in full today?',
      ifYes: 'Process pay-in-full enrollment. Done.',
      ifNo: 'Continue to Step 3.',
    },
    {
      step: 3,
      question: 'Does the student have income or fair credit?',
      ifYes:
        'Direct to third-party financing (Klarna/Afterpay/Zip/Klarna). If approved, process enrollment. If declined, continue to Step 4.',
      ifNo: 'Continue to Step 4.',
    },
    {
      step: 4,
      question: 'Does the student have an employer willing to sponsor tuition?',
      ifYes:
        'Verify employer is approved partner. Get signed employer agreement. Process employer-sponsored enrollment.',
      ifNo: 'Continue to Step 5.',
    },
    {
      step: 5,
      question: 'Can the student pay $1,000+ down payment and commit to 6-month autopay?',
      ifYes: 'Process internal installment plan enrollment with signed payment agreement.',
      ifNo: 'Student is not enrollment-ready at this time. Provide information about funding options and invite them to return when ready.',
    },
  ],

  /**
   * PROHIBITED ACTIONS
   * Staff may NOT do any of the following without written Executive Director approval.
   */
  prohibitedActions: [
    'Negotiate custom payment terms not listed in this policy',
    'Waive or reduce down payment requirements',
    'Extend payment terms beyond 6 months for internal plans',
    'Accept manual payments instead of autopay for installment plans',
    'Promise verbal payment flexibility',
    'Enroll students without secured funding or signed payment agreement',
    'Release certificates or credentials before balance is paid in full',
    'Make exceptions for "hardship" without documented approval',
  ],

  /**
   * REFUND POLICY
   */
  refundPolicy: {
    beforeProgramStart: {
      refundAmount: 'full_minus_registration_fee',
      registrationFee: 150,
      processingTime: '7-10 business days',
    },
    afterProgramStart: {
      method: 'prorated',
      calculation: 'Refund = (Amount Paid - Registration Fee) × (1 - Completion Percentage)',
      noRefundAfterPercent: 50,
    },
    nonRefundableItems: [
      'Registration fee ($150)',
      'Materials/supplies already issued',
      'Certification exam fees already paid',
    ],
  },

  /**
   * COMPLIANCE NOTES
   */
  compliance: {
    notALender: `
The Institute does not extend credit or make loans. Internal installment plans are 
structured tuition payments for training access, not financing arrangements. 
All marketing and enrollment language must reflect this distinction.
    `.trim(),

    requiredDisclosures: [
      'Total tuition amount',
      'Down payment amount',
      'Monthly payment amount and number of payments',
      'Consequences of missed payments',
      'Refund policy',
    ],

    requiredSignatures: [
      'Enrollment Agreement',
      'Payment Authorization (for installment plans)',
      'Autopay Authorization (for installment plans)',
      'Refund Policy Acknowledgment',
    ],
  },
};

/**
 * EXAMPLE PAYMENT STRUCTURES AT $5,000 TUITION
 */
export const EXAMPLE_PAYMENT_STRUCTURES = {
  tuitionAmount: 5000,

  payInFull: {
    dueAtEnrollment: 5000,
    monthlyPayment: 0,
    totalCost: 5000,
  },

  thirdPartyFinancing: {
    dueAtEnrollment: 0,
    monthlyPayment: 278, // ~$5,000 over 18 months
    termMonths: 18,
    totalCost: 5004, // Slight variance due to provider fees
    provider: 'Klarna/Afterpay/Zip/Klarna',
  },

  employerSponsored: {
    dueAtEnrollment: 0,
    monthlyPayment: 417, // $5,000 over 12 months post-hire
    termMonths: 12,
    totalCost: 5000,
    paidBy: 'Employer',
  },

  internalInstallmentPlan: {
    dueAtEnrollment: 1000, // 20% down
    monthlyPayment: 667, // Remaining $4,000 over 6 months
    termMonths: 6,
    totalCost: 5000,
    autopayRequired: true,
  },
};

export default TUITION_FINANCING_POLICY;
