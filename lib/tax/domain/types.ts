/**
 * Canonical return domain model.
 *
 * This is the source of truth for all tax return data.
 * UI screens, rules engines, diagnostics, print, and MeF XML serialization
 * all derive from this model. Raw XML is never the source of truth.
 */

export type FilingStatus = 'single' | 'mfj' | 'mfs' | 'hoh' | 'qw';

export type Taxpayer = {
  firstName: string;
  middleInitial?: string;
  lastName: string;
  ssn: string;
  dob: string;
  occupation?: string;
  ipPin?: string;
};

export type Dependent = {
  firstName: string;
  lastName: string;
  ssn: string;
  dob: string;
  relationship: string;
  monthsLivedWithTaxpayer?: number;
  isFullTimeStudent?: boolean;
  isDisabled?: boolean;
};

export type W2 = {
  ein: string;
  employerName: string;
  employerAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  wages: number;
  federalWithholding: number;
  socialSecurityWages?: number;
  socialSecurityTax?: number;
  medicareWages?: number;
  medicareTax?: number;
  stateCode?: string;
  stateWages?: number;
  stateWithholding?: number;
};

export type Form1099 = {
  type: 'INT' | 'DIV' | 'MISC' | 'NEC' | 'G' | 'R' | 'SSA';
  payerEIN: string;
  payerName: string;
  amount: number;
  federalWithholding?: number;
};

export type ScheduleC = {
  businessName: string;
  ein?: string;
  principalBusinessCode: string;
  grossReceipts: number;
  expenses: {
    advertising?: number;
    carAndTruck?: number;
    commissions?: number;
    insurance?: number;
    legalAndProfessional?: number;
    officeExpense?: number;
    rentOrLease?: number;
    repairs?: number;
    supplies?: number;
    taxes?: number;
    travel?: number;
    utilities?: number;
    wages?: number;
    other?: number;
  };
  netProfit: number;
};

export type ScheduleA = {
  medicalExpenses?: number;
  stateTaxesPaid?: number;
  realEstateTaxes?: number;
  mortgageInterest?: number;
  charitableCash?: number;
  charitableNonCash?: number;
  totalItemized: number;
};

export type EITCData = {
  qualifyingChildren: number;
  investmentIncome: number;
  earnedIncome: number;
  creditAmount: number;
};

export type CTCData = {
  qualifyingChildren: number;
  creditAmount: number;
  additionalCreditAmount: number;
};

export type ReturnStatus =
  | 'draft'
  | 'in_preparation'
  | 'ready_for_review'
  | 'review_changes_requested'
  | 'ready_for_signature'
  | 'ready_to_file'
  | 'transmitted'
  | 'accepted'
  | 'rejected'
  | 'correcting'
  | 'amended';

export type Return1040 = {
  id: string;
  taxYear: number;
  filingStatus: FilingStatus;

  taxpayer: Taxpayer;
  spouse?: Taxpayer;
  dependents: Dependent[];

  address: {
    street: string;
    apt?: string;
    city: string;
    state: string;
    zip: string;
    foreignCountry?: string;
  };

  // Income documents
  w2s: W2[];
  forms1099: Form1099[];

  // Schedules — present only when applicable
  schedules: {
    scheduleC?: ScheduleC;
    scheduleA?: ScheduleA;
    eitc?: EITCData;
    ctc?: CTCData;
  };

  // Computed totals — populated by the calculation engine, not entered by user
  computed?: {
    totalIncome: number;
    adjustedGrossIncome: number;
    standardDeduction: number;
    itemizedDeduction: number;
    deductionUsed: 'standard' | 'itemized';
    taxableIncome: number;
    taxBeforeCredits: number;
    totalCredits: number;
    selfEmploymentTax: number;
    totalTax: number;
    totalPayments: number;
    refundAmount: number;
    amountOwed: number;
  };

  // Identity verification
  priorYearAGI?: number;

  // Bank account for direct deposit / direct debit
  bankAccount?: {
    routingNumber: string;
    accountNumber: string;
    accountType: 'checking' | 'savings';
  };

  // Signatures
  taxpayerSignature?: {
    pin: string;
    signedAt: string;
    ipAddress?: string;
  };
  spouseSignature?: {
    pin: string;
    signedAt: string;
    ipAddress?: string;
  };

  // Preparer info (required for paid preparers)
  preparer?: {
    ptin: string;
    name: string;
    firmName?: string;
    firmEIN?: string;
    firmAddress?: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
    phone?: string;
    selfPrepared?: boolean;
  };

  metadata: {
    preparerUserId?: string;
    reviewerUserId?: string;
    officeId?: string;
    clientId?: string;
    createdByUserId: string;
    status: ReturnStatus;
    createdAt: string;
    updatedAt: string;
    transmissionId?: string;
    ackStatus?: 'pending' | 'accepted' | 'rejected';
    ackCode?: string;
    rejectionErrors?: Array<{ code: string; message: string }>;
  };
};
