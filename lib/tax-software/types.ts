/**
 * Supersonic Tax Software - Core Types
 * IRS MeF (Modernized e-File) Compatible
 */

export interface Taxpayer {
  firstName: string;
  middleInitial?: string;
  lastName: string;
  ssn: string;
  dateOfBirth: string;
  occupation?: string;
  phone?: string;
  email?: string;
}

export interface Address {
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface Spouse {
  firstName: string;
  middleInitial?: string;
  lastName: string;
  ssn: string;
  dateOfBirth: string;
  occupation?: string;
}

export interface Dependent {
  firstName: string;
  lastName: string;
  ssn: string;
  relationship: 'son' | 'daughter' | 'stepchild' | 'foster_child' | 'brother' | 'sister' | 'parent' | 'grandparent' | 'grandchild' | 'niece' | 'nephew' | 'other';
  dateOfBirth: string;
  monthsLivedWithYou: number;
  childTaxCredit: boolean;
  otherDependentCredit: boolean;
}

export interface W2Income {
  employerEIN: string;
  employerName: string;
  employerAddress: Address;
  wages: number; // Box 1
  federalWithholding: number; // Box 2
  socialSecurityWages: number; // Box 3
  socialSecurityTax: number; // Box 4
  medicareWages: number; // Box 5
  medicareTax: number; // Box 6
  socialSecurityTips?: number; // Box 7
  allocatedTips?: number; // Box 8
  dependentCareBenefits?: number; // Box 10
  nonqualifiedPlans?: number; // Box 11
  box12Codes?: Array<{ code: string; amount: number }>;
  statutoryEmployee?: boolean; // Box 13
  retirementPlan?: boolean; // Box 13
  thirdPartySickPay?: boolean; // Box 13
  stateWages?: number; // Box 16
  stateWithholding?: number; // Box 17
  localWages?: number; // Box 18
  localWithholding?: number; // Box 19
  stateCode?: string;
  stateEmployerID?: string;
  localityName?: string;
}

export interface Form1099INT {
  payerName: string;
  payerEIN: string;
  interestIncome: number; // Box 1
  earlyWithdrawalPenalty?: number; // Box 2
  usSavingsBondInterest?: number; // Box 3
  federalWithholding?: number; // Box 4
  investmentExpenses?: number; // Box 5
  foreignTaxPaid?: number; // Box 6
  taxExemptInterest?: number; // Box 8
  privateBondInterest?: number; // Box 9
}

export interface Form1099DIV {
  payerName: string;
  payerEIN: string;
  ordinaryDividends: number; // Box 1a
  qualifiedDividends: number; // Box 1b
  capitalGainDistributions?: number; // Box 2a
  unrecaptured1250Gain?: number; // Box 2b
  section1202Gain?: number; // Box 2c
  collectiblesGain?: number; // Box 2d
  nondividendDistributions?: number; // Box 3
  federalWithholding?: number; // Box 4
  investmentExpenses?: number; // Box 5
  foreignTaxPaid?: number; // Box 7
  cashLiquidation?: number; // Box 9
  noncashLiquidation?: number; // Box 10
  exemptInterestDividends?: number; // Box 12
}

export interface Form1099MISC {
  payerName: string;
  payerEIN: string;
  rents?: number; // Box 1
  royalties?: number; // Box 2
  otherIncome?: number; // Box 3
  federalWithholding?: number; // Box 4
  fishingBoatProceeds?: number; // Box 5
  medicalPayments?: number; // Box 6
  nonemployeeCompensation?: number; // Box 7 (now on 1099-NEC)
  substitutePayments?: number; // Box 8
  cropInsurance?: number; // Box 9
  grossProceeds?: number; // Box 10
  fishPurchased?: number; // Box 11
  section409ADeferrals?: number; // Box 12
  excessGoldenParachute?: number; // Box 13
  nonqualifiedDeferredComp?: number; // Box 14
}

export interface Form1099NEC {
  payerName: string;
  payerEIN: string;
  nonemployeeCompensation: number; // Box 1
  federalWithholding?: number; // Box 4
}

export interface ScheduleCBusiness {
  businessName: string;
  businessCode: string; // NAICS code
  ein?: string;
  businessAddress?: Address;
  accountingMethod: 'cash' | 'accrual' | 'other';
  grossReceipts: number;
  returns?: number;
  costOfGoodsSold?: number;
  grossProfit: number;
  otherIncome?: number;
  expenses: {
    advertising?: number;
    carAndTruck?: number;
    commissions?: number;
    contractLabor?: number;
    depletion?: number;
    depreciation?: number;
    employeeBenefits?: number;
    insurance?: number;
    interestMortgage?: number;
    interestOther?: number;
    legal?: number;
    officeExpense?: number;
    pensionPlans?: number;
    rentVehicles?: number;
    rentEquipment?: number;
    repairs?: number;
    supplies?: number;
    taxes?: number;
    travel?: number;
    meals?: number;
    utilities?: number;
    wages?: number;
    otherExpenses?: number;
  };
  netProfit: number;
}

export interface ItemizedDeductions {
  medicalExpenses: number;
  stateLocalTaxes: number; // Capped at $10,000
  realEstateTaxes: number;
  personalPropertyTaxes: number;
  mortgageInterest: number;
  mortgageInsurancePremiums?: number;
  charitableCash: number;
  charitableNoncash?: number;
  casualtyLosses?: number;
  otherDeductions?: number;
}

export interface TaxCredits {
  childTaxCredit: number;
  creditForOtherDependents: number;
  childAndDependentCareCredit?: number;
  educationCredits?: number;
  retirementSavingsCredit?: number;
  residentialEnergyCredit?: number;
  earnedIncomeCredit: number;
  additionalChildTaxCredit: number;
  americanOpportunityCredit?: number;
  premiumTaxCredit?: number;
}

export interface BankAccount {
  routingNumber: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
}

export interface TaxReturn {
  // Identification
  taxYear: number;
  efin: string;
  softwareId?: string;
  returnId: string;
  
  // Taxpayer Info
  taxpayer: Taxpayer;
  address: Address;
  filingStatus: 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household' | 'qualifying_surviving_spouse';
  
  // Spouse (if applicable)
  spouse?: Spouse;
  
  // Dependents
  dependents: Dependent[];
  
  // Income
  w2Income: W2Income[];
  form1099INT?: Form1099INT[];
  form1099DIV?: Form1099DIV[];
  form1099MISC?: Form1099MISC[];
  form1099NEC?: Form1099NEC[];
  scheduleCBusiness?: ScheduleCBusiness[];
  otherIncome?: number;
  
  // Adjustments
  adjustments?: {
    educatorExpenses?: number;
    hsaDeduction?: number;
    selfEmploymentTax?: number;
    selfEmployedHealthInsurance?: number;
    iraDeduction?: number;
    studentLoanInterest?: number;
    alimonyPaid?: number;
  };
  
  // Deductions
  deductionType: 'standard' | 'itemized';
  itemizedDeductions?: ItemizedDeductions;
  qualifiedBusinessIncomeDeduction?: number;
  
  // Tax Calculation
  totalIncome: number;
  adjustedGrossIncome: number;
  taxableIncome: number;
  taxBeforeCredits: number;
  
  // Credits
  credits: TaxCredits;
  totalCredits: number;
  
  // Payments
  federalWithholding: number;
  estimatedTaxPayments?: number;
  
  // Result
  totalTax: number;
  totalPayments: number;
  refundAmount?: number;
  amountOwed?: number;
  
  // Direct Deposit
  directDeposit?: BankAccount;
  
  // Signatures
  taxpayerSignature?: {
    pin: string;
    signedDate: string;
    ipAddress?: string;
  };
  spouseSignature?: {
    pin: string;
    signedDate: string;
    ipAddress?: string;
  };
  preparerSignature?: {
    ptin: string;
    firmEIN?: string;
    firmName?: string;
    signedDate: string;
  };
}

export interface MeFSubmission {
  submissionId: string;
  efin: string;
  softwareId: string;
  taxYear: number;
  submissionType: 'IRS1040' | 'IRS1040SR' | 'IRS1040NR';
  returnData: TaxReturn;
  xmlContent: string;
  submittedAt?: string;
  status: 'pending' | 'transmitted' | 'accepted' | 'rejected';
  acknowledgment?: MeFAcknowledgment;
}

export interface MeFAcknowledgment {
  submissionId: string;
  status: 'accepted' | 'rejected';
  acceptedAt?: string;
  rejectedAt?: string;
  errors?: MeFError[];
  dcn?: string; // Declaration Control Number (for accepted returns)
}

export interface MeFError {
  errorCode: string;
  errorCategory: 'reject' | 'alert';
  errorMessage: string;
  fieldName?: string;
  ruleNumber?: string;
}

export interface TransmissionResult {
  success: boolean;
  submissionId: string;
  transmittedAt: string;
  acknowledgment?: MeFAcknowledgment;
  error?: string;
}
