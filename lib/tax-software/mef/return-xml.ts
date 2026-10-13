import { isIP } from 'node:net';
import {
  calculateFederal1040_2026,
  irsDollars,
  type Federal1040Input,
} from '../calculation/federal-1040-2026';
export type IrsAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
};
export type MefProfile = {
  firstName: string;
  lastName: string;
  ssn: string;
  birthDate: string;
  address: IrsAddress;
  occupation?: string;
  spouse?: { firstName: string; lastName: string; ssn: string; birthDate: string };
};
export type MefW2 = Federal1040Input['wages'][number] & {
  employerEin: string;
  employerName: string;
  employerAddress: IrsAddress;
  socialSecurityTax?: number;
  medicareTaxWithheld?: number;
};
export type RefundAllocation = {
  amount: number;
  routingNumber: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
};
export type MefConfiguration = {
  softwareId: string;
  efin: string;
  createdAt: string;
  signatureDate: string;
  taxpayerPin: string;
  spousePin?: string;
  priorYearAgi: number;
  spousePriorYearAgi?: number;
  publicIp: string;
  authorizationRecorded: boolean;
};
export type IrsNode = { [key: string]: string | number | boolean | IrsNode | IrsNode[] };
const name = (s: string) => s.trim().replace(/\s+/g, ' ').toUpperCase();
const control = (s: string) =>
  name(s)
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4);
const address = (a: IrsAddress): IrsNode => ({
  AddressLine1Txt: name(a.line1),
  ...(a.line2 ? { AddressLine2Txt: name(a.line2) } : {}),
  CityNm: name(a.city),
  StateAbbreviationCd: a.state.toUpperCase(),
  ZIPCd: a.zip.replace(/-/g, ''),
});
const ssn = (s: string) => {
  const v = s.replace(/-/g, '');
  if (!/^\d{9}$/.test(v)) throw new Error('Complete taxpayer identification before export');
  return v;
};
/** Build official IRS fields from calculated return data; serialize with the installed official XSD. */
export function mapFederalReturn2026(input: {
  profile: MefProfile;
  financial: Federal1040Input;
  w2: MefW2[];
  configuration: MefConfiguration;
  refundAllocations?: RefundAllocation[];
  additionalIrsDocuments?: Record<string, IrsNode | IrsNode[]>;
}) {
  const { profile: p, configuration: c, financial: f } = input;
  if (!/^\d{8}$/.test(c.softwareId) || !/^\d{6}$/.test(c.efin))
    throw new Error('Valid IRS Software ID and EFIN are required for export');
  if (!c.authorizationRecorded || !/^\d{5}$/.test(c.taxpayerPin) || c.taxpayerPin === '00000')
    throw new Error('Record the taxpayer signature authorization before export');
  if (f.filingStatus === 'married_joint' && (!p.spouse || !c.spousePin))
    throw new Error('Joint returns require spouse details and signature');
  if (f.wages.length !== input.w2.length)
    throw new Error('Every wage statement must be included in the export');
  for (let i = 0; i < input.w2.length; i++)
    if (
      (input.w2[i].owner ?? 'primary') !== (f.wages[i].owner ?? 'primary') ||
      input.w2[i].wages !== f.wages[i].wages ||
      input.w2[i].federalWithholding !== f.wages[i].federalWithholding
    )
      throw new Error('Export wage statements must match calculation inputs');
  if (!isIP(c.publicIp)) throw new Error('Valid filing connection address is required');
  if (
    input.w2.some((w) => w.owner === 'spouse') &&
    (f.filingStatus !== 'married_joint' || !p.spouse)
  )
    throw new Error('Spouse wages require a joint return and spouse details');
  const result = calculateFederal1040_2026(f),
    l = result.lines;
  const fields: IrsNode = {
    '@attributes': { documentId: 'F1040' },
    IndividualReturnFilingStatusCd: {
      single: '1',
      married_joint: '2',
      married_separate: '3',
      head_of_household: '4',
      qualifying_surviving_spouse: '5',
    }[f.filingStatus],
    VirtualCurAcquiredDurTYInd: false,
    WagesAmt: l['1a'],
    WagesSalariesAndTipsAmt: l['1z'],
    TaxableInterestAmt: l['2b'],
    QualifiedDividendsAmt: l['3a'],
    OrdinaryDividendsAmt: l['3b'],
    TaxableIRAAmt: l['4b'],
    TotalTaxablePensionsAmt: l['5b'],
    SocSecBnftAmt: irsDollars(f.socialSecurityBenefits ?? 0),
    TaxableSocSecAmt: l['6b'],
    CapitalGainLossAmt: l['7a'],
    TotalAdditionalIncomeAmt: l['8'],
    TotalIncomeAmt: l['9'],
    TotalAdjustmentsAmt: l['10'],
    AdjustedGrossIncomeAmt: l['11a'],
    TotalItemizedOrStandardDedAmt: l['12e'],
    CharitableContributionAmt: l['12f'],
    TotalAdditionalDeductionsAmt: l['13a'],
    QualifiedBusinessIncomeDedAmt: l['13b'],
    TotalDeductionsAmt: l['14'],
    TaxableIncomeAmt: l['15'],
    TaxAmt: l['16'],
    AdditionalTaxAmt: l['17'],
    TotalTaxBeforeCrAndOthTaxesAmt: l['18'],
    CTCODCAmt: l['19'],
    TotalNonrefundableCreditsAmt: l['20'],
    TotalCreditsAmt: l['21'],
    TaxLessCreditsAmt: l['22'],
    TotalAdditionalTaxesAmt: l['23'],
    TotalTaxAmt: l['24'],
    FormW2WithheldTaxAmt: l['25a'],
    WithholdingTaxAmt: l['25d'],
    EstimatedTaxPaymentsAmt: l['26'],
    EarnedIncomeCreditAmt: l['27a'],
    AdditionalChildTaxCreditAmt: l['28'],
    RefundableAmerOppCreditAmt: l['29'],
    RefundableCreditsAmt: l['32'],
    TotalPaymentsAmt: l['33'],
    OverpaidAmt: l['34'],
    RefundAmt: l['35a'],
    OwedAmt: l['37'],
    ThirdPartyDesigneeInd: false,
    ...(p.occupation ? { PrimaryOccupationTxt: name(p.occupation) } : {}),
    RefundProductCd: 'NO FINANCIAL PRODUCT',
  };
  if (f.claimedAsDependent) fields.PrimaryClaimAsDependentInd = 'X';
  if (f.mustItemize) fields.MustItemizeInd = 'X';
  const deposits = input.refundAllocations ?? [];
  if (
    deposits.length > 3 ||
    deposits.some(
      (d) =>
        !/^\d{9}$/.test(d.routingNumber) ||
        !/^\d{1,17}$/.test(d.accountNumber) ||
        !Number.isInteger(d.amount) ||
        d.amount <= 0,
    )
  )
    throw new Error('Invalid refund allocation');
  if (deposits.length && deposits.reduce((s, d) => s + d.amount, 0) !== result.refundAmount)
    throw new Error('Refund allocations must equal the calculated refund');
  const documents: Record<string, IrsNode | IrsNode[]> = {
    IRS1040: fields,
    IRSW2: input.w2.map((w, index) => ({
      '@attributes': { documentId: `W2-${index + 1}` },
      EmployeeSSN: ssn(w.owner === 'spouse' ? (p.spouse?.ssn ?? '') : p.ssn),
      EmployerEIN: w.employerEin.replace(/-/g, ''),
      EmployerNameControlTxt: control(w.employerName),
      EmployerName: { BusinessNameLine1Txt: name(w.employerName) },
      EmployerUSAddress: address(w.employerAddress),
      EmployeeNm:
        w.owner === 'spouse' && p.spouse
          ? name(`${p.spouse.firstName} ${p.spouse.lastName}`)
          : name(`${p.firstName} ${p.lastName}`),
      EmployeeUSAddress: address(p.address),
      WagesAmt: irsDollars(w.wages),
      WithholdingAmt: irsDollars(w.federalWithholding),
      SocialSecurityWagesAmt: irsDollars(w.socialSecurityWages ?? w.wages),
      SocialSecurityTaxAmt: irsDollars(w.socialSecurityTax ?? 0),
      MedicareWagesAndTipsAmt: irsDollars(w.medicareWages ?? w.wages),
      MedicareTaxWithheldAmt: irsDollars(w.medicareTaxWithheld ?? 0),
      StandardOrNonStandardCd: 'S',
    })),
  };
  if (deposits.length > 1) {
    fields.Form8888Ind = 'X';
    documents.IRS8888 = {
      '@attributes': { documentId: 'F8888' },
      DirectDepositInfoGroup: deposits.map((d) => ({
        DirectDepositRefundAmt: d.amount,
        RoutingTransitNum: d.routingNumber,
        BankAccountTypeCd: d.accountType === 'checking' ? '1' : '2',
        DepositorAccountNum: d.accountNumber,
      })),
      TotalAllocationOfRefundAmt: result.refundAmount,
    };
  } else if (deposits.length === 1) {
    fields.RoutingTransitNum = deposits[0].routingNumber;
    fields.BankAccountTypeCd = deposits[0].accountType === 'checking' ? '1' : '2';
    fields.DepositorAccountNum = deposits[0].accountNumber;
  }
  for (const [key, value] of Object.entries(input.additionalIrsDocuments ?? {})) {
    if (key === 'IRS1040' || key === 'IRSW2' || key === 'IRS8888')
      throw new Error('Calculated core documents cannot be replaced');
    documents[key] = value;
  }
  // Generate the wage and self-employment schedules directly from the same calculation.
  if (result.selfEmploymentDetails.length && !documents.IRS1040ScheduleSE) {
    documents.IRS1040ScheduleSE = result.selfEmploymentDetails
      .filter((b) => b.netEarnings >= 400)
      .map((b, i) => {
        const person = b.owner === 'spouse' ? p.spouse : p;
        if (!person) throw new Error('Spouse self-employment requires spouse details');
        return {
          '@attributes': { documentId: `SSE-${i + 1}` },
          PersonNm: name(`${person.firstName} ${person.lastName}`),
          SSN: ssn(person.ssn),
          NetNonFarmProfitLossAmt: irsDollars(b.netProfit),
          SETotalNetEarningsOrLossAmt: irsDollars(b.netProfit),
          MinimumProfitForSETaxAmt: irsDollars(b.netEarnings),
          CombinedSEAmt: irsDollars(b.netEarnings),
          CombinedSEAndChurchWagesAmt: irsDollars(b.netEarnings),
          SSTWagesRRTCompAmt: irsDollars(b.socialSecurityWages),
          TotalWagesAndUnreportedTipsAmt: irsDollars(b.socialSecurityWages),
          AllowableSEAmt: irsDollars(Math.max(0, 184500 - b.socialSecurityWages)),
          TaxBaseAmt: irsDollars(b.socialSecurityTax),
          SEBaseAmt: irsDollars(b.medicareTax),
          SelfEmploymentTaxAmt: b.tax,
          DeductibleSelfEmploymentTaxAmt: b.deduction,
        };
      });
  }
  if ((l['8'] || l['10']) && !documents.IRS1040Schedule1) {
    if (f.otherSchedule1Income || f.adjustments)
      throw new Error(
        'Specify the individual Schedule 1 income and adjustment lines before export',
      );
    documents.IRS1040Schedule1 = {
      '@attributes': { documentId: 'S1' },
      BusinessIncomeLossAmt: l['8'],
      TotalAdditionalIncomeAmt: l['8'],
      DeductibleSelfEmploymentTaxAmt: result.selfEmploymentDeduction,
      TotalAdjustmentsAmt: l['10'],
    };
  }
  if (l['23'] && !documents.IRS1040Schedule2) {
    if (
      result.additionalMedicareTax ||
      result.netInvestmentIncomeTax ||
      f.otherSchedule2Taxes ||
      f.schedule2Part1Tax
    )
      throw new Error('Specify supporting additional-tax forms before export');
    documents.IRS1040Schedule2 = {
      '@attributes': { documentId: 'S2' },
      SelfEmploymentTaxAmt: result.selfEmploymentTax,
      TotalAdditionalTaxesAmt: l['23'],
    };
  }
  const filer: IrsNode = {
    PrimarySSN: ssn(p.ssn),
    ...(p.spouse ? { SpouseSSN: ssn(p.spouse.ssn) } : {}),
    NameLine1Txt: name(
      `${p.firstName} ${p.lastName}${p.spouse ? ` & ${p.spouse.firstName} ${p.spouse.lastName}` : ''}`,
    ),
    PrimaryNameControlTxt: control(p.lastName),
    ...(p.spouse ? { SpouseNameControlTxt: control(p.spouse.lastName) } : {}),
    USAddress: address(p.address),
  };
  const header: IrsNode = {
    '@attributes': { binaryAttachmentCnt: 0 },
    ReturnTs: c.createdAt,
    TaxYr: 2026,
    TaxPeriodBeginDt: '2026-01-01',
    TaxPeriodEndDt: '2026-12-31',
    SoftwareId: c.softwareId,
    SoftwareVersionNum: '2026.1',
    OriginatorGrp: { EFIN: c.efin, OriginatorTypeCd: 'OnlineFiler' },
    SelfSelectPINGrp: {
      PrimaryBirthDt: p.birthDate,
      PrimaryPriorYearAGIAmt: c.priorYearAgi,
      ...(p.spouse
        ? { SpouseBirthDt: p.spouse.birthDate, SpousePriorYearAGIAmt: c.spousePriorYearAgi ?? 0 }
        : {}),
    },
    PINTypeCd: 'Self-Select On-Line',
    JuratDisclosureCd: 'Online Self Select PIN',
    PrimarySignaturePIN: c.taxpayerPin,
    PrimarySignatureDt: c.signatureDate,
    ...(c.spousePin ? { SpouseSignaturePIN: c.spousePin, SpouseSignatureDt: c.signatureDate } : {}),
    ReturnTypeCd: '1040',
    Filer: filer,
    FilingSecurityInformation: {
      AtSubmissionCreationGrp: {
        IPAddress:
          isIP(c.publicIp) === 4 ? { IPv4AddressTxt: c.publicIp } : { IPv6AddressTxt: c.publicIp },
      },
    },
  };
  const documentCount = Object.values(documents).reduce(
    (n, d) => n + (Array.isArray(d) ? d.length : 1),
    0,
  );
  return {
    irsFields: {
      '@attributes': { returnVersion: '2026v4.0' },
      ReturnHeader: header,
      ReturnData: { '@attributes': { documentCnt: documentCount }, ...documents },
    },
    calculation: result,
    atsAccepted: false,
  };
}
