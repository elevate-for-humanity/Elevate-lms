/**
 * IRS MeF XML Generator
 * Generates IRS-compliant XML for electronic filing
 */

import { TaxReturn, MeFSubmission } from '../types';

const IRS_NAMESPACE = 'http://www.irs.gov/efile';
// EFIN must be set via IRS_EFIN env var. Fallback is for local dev only.
const EFIN = process.env.IRS_EFIN || '358459';

export function generateSubmissionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${EFIN}${timestamp}${random}`.toUpperCase();
}

export function formatSSN(ssn: string): string {
  return ssn.replace(/\D/g, '');
}

export function formatEIN(ein: string): string {
  return ein.replace(/\D/g, '');
}

export function formatDate(date: string): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

export function formatCurrency(amount: number): string {
  return Math.round(amount).toString();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateReturnHeader(taxReturn: TaxReturn, softwareId: string): string {
  return `
    <ReturnHeader binaryAttachmentCnt="0">
      <ReturnTs>${new Date().toISOString()}</ReturnTs>
      <TaxYr>${taxReturn.taxYear}</TaxYr>
      <TaxPeriodBeginDt>${taxReturn.taxYear}-01-01</TaxPeriodBeginDt>
      <TaxPeriodEndDt>${taxReturn.taxYear}-12-31</TaxPeriodEndDt>
      <SoftwareId>${escapeXml(softwareId)}</SoftwareId>
      <SoftwareVersionNum>1.0</SoftwareVersionNum>
      <OriginatorGrp>
        <EFIN>${EFIN}</EFIN>
        <OriginatorTypeCd>OnlineFiler</OriginatorTypeCd>
      </OriginatorGrp>
      <PINTypeCd>Self-Select On-Line</PINTypeCd>
      <JuratDisclosureCd>Online Self Select PIN</JuratDisclosureCd>
      <PrimaryPINEnteredByCd>Taxpayer</PrimaryPINEnteredByCd>
      <PrimarySignaturePIN>${taxReturn.taxpayerSignature?.pin || ''}</PrimarySignaturePIN>
      <PrimarySignatureDt>${taxReturn.taxpayerSignature?.signedDate || formatDate(new Date().toISOString())}</PrimarySignatureDt>
      ${taxReturn.spouse && taxReturn.spouseSignature ? `
      <SpouseSignaturePIN>${taxReturn.spouseSignature.pin}</SpouseSignaturePIN>
      <SpouseSignatureDt>${taxReturn.spouseSignature.signedDate}</SpouseSignatureDt>
      ` : ''}
      ${taxReturn.priorYearAGI !== undefined ? `
      <PrimaryPriorYearAGIAmt>${formatCurrency(taxReturn.priorYearAGI)}</PrimaryPriorYearAGIAmt>
      ` : ''}
      ${taxReturn.ipPin ? `
      <IPPINGrp>
        <PrimaryIPPIN>${taxReturn.ipPin}</PrimaryIPPIN>
        ${taxReturn.spouseIpPin ? `<SpouseIPPIN>${taxReturn.spouseIpPin}</SpouseIPPIN>` : ''}
      </IPPINGrp>
      ` : ''}
      <ReturnTypeCd>1040</ReturnTypeCd>
      ${taxReturn.preparerSignature && !taxReturn.preparerSignature.selfPrepared ? `
      <PreparerFirmGrp>
        <PreparerFirmEIN>${taxReturn.preparerSignature.firmEIN ? formatEIN(taxReturn.preparerSignature.firmEIN) : ''}</PreparerFirmEIN>
        <PreparerFirmName>
          <BusinessNameLine1Txt>${escapeXml(taxReturn.preparerSignature.firmName || '')}</BusinessNameLine1Txt>
        </PreparerFirmName>
        ${taxReturn.preparerSignature.firmAddress ? `
        <PreparerUSAddress>
          <AddressLine1Txt>${escapeXml(taxReturn.preparerSignature.firmAddress.street)}</AddressLine1Txt>
          <CityNm>${escapeXml(taxReturn.preparerSignature.firmAddress.city)}</CityNm>
          <StateAbbreviationCd>${taxReturn.preparerSignature.firmAddress.state}</StateAbbreviationCd>
          <ZIPCd>${taxReturn.preparerSignature.firmAddress.zip}</ZIPCd>
        </PreparerUSAddress>
        ` : ''}
      </PreparerFirmGrp>
      <PreparerPersonGrp>
        <PTIN>${escapeXml(taxReturn.preparerSignature.ptin)}</PTIN>
        <PreparerSignatureDt>${taxReturn.preparerSignature.signedDate}</PreparerSignatureDt>
        ${taxReturn.preparerSignature.phone ? `<PhoneNum>${taxReturn.preparerSignature.phone.replace(/\D/g, '')}</PhoneNum>` : ''}
      </PreparerPersonGrp>
      ` : '<SelfPreparedInd>X</SelfPreparedInd>'}
      <Filer>
        <PrimarySSN>${formatSSN(taxReturn.taxpayer.ssn)}</PrimarySSN>
        ${taxReturn.spouse ? `<SpouseSSN>${formatSSN(taxReturn.spouse.ssn)}</SpouseSSN>` : ''}
        <NameLine1Txt>${escapeXml(taxReturn.taxpayer.firstName)} ${escapeXml(taxReturn.taxpayer.lastName)}</NameLine1Txt>
        <PrimaryNameControlTxt>${taxReturn.taxpayer.lastName.substring(0, 4).toUpperCase()}</PrimaryNameControlTxt>
        ${taxReturn.spouse ? `<SpouseNameControlTxt>${taxReturn.spouse.lastName.substring(0, 4).toUpperCase()}</SpouseNameControlTxt>` : ''}
        <USAddress>
          <AddressLine1Txt>${escapeXml(taxReturn.address.street)}</AddressLine1Txt>
          ${taxReturn.address.apartment ? `<AddressLine2Txt>${escapeXml(taxReturn.address.apartment)}</AddressLine2Txt>` : ''}
          <CityNm>${escapeXml(taxReturn.address.city)}</CityNm>
          <StateAbbreviationCd>${taxReturn.address.state}</StateAbbreviationCd>
          <ZIPCd>${taxReturn.address.zip}</ZIPCd>
        </USAddress>
      </Filer>
      ${taxReturn.directDeposit ? `
      <RefundDirectDeposit>
        <RoutingTransitNum>${taxReturn.directDeposit.routingNumber}</RoutingTransitNum>
        <BankAccountNum>${taxReturn.directDeposit.accountNumber}</BankAccountNum>
        <BankAccountTypeCd>${taxReturn.directDeposit.accountType === 'checking' ? '1' : '2'}</BankAccountTypeCd>
      </RefundDirectDeposit>
      ` : ''}
    </ReturnHeader>
  `;
}

export function generateForm1040(taxReturn: TaxReturn): string {
  const filingStatusCode = {
    'single': '1',
    'married_filing_jointly': '2',
    'married_filing_separately': '3',
    'head_of_household': '4',
    'qualifying_surviving_spouse': '5'
  }[taxReturn.filingStatus];

  return `
    <IRS1040>
      <IndividualReturnFilingStatusCd>${filingStatusCode}</IndividualReturnFilingStatusCd>
      
      ${taxReturn.dependents.length > 0 ? `
      <DependentDetail>
        ${taxReturn.dependents.map(dep => `
        <DependentInformationGrp>
          <DependentFirstNm>${escapeXml(dep.firstName)}</DependentFirstNm>
          <DependentLastNm>${escapeXml(dep.lastName)}</DependentLastNm>
          <DependentNameControlTxt>${dep.lastName.substring(0, 4).toUpperCase()}</DependentNameControlTxt>
          <DependentSSN>${formatSSN(dep.ssn)}</DependentSSN>
          <DependentRelationshipCd>${dep.relationship.toUpperCase()}</DependentRelationshipCd>
          ${dep.childTaxCredit ? '<EligibleForChildTaxCreditInd>X</EligibleForChildTaxCreditInd>' : ''}
          ${dep.otherDependentCredit ? '<EligibleForODCInd>X</EligibleForODCInd>' : ''}
        </DependentInformationGrp>
        `).join('')}
      </DependentDetail>
      ` : ''}

      <!-- Income -->
      <WagesAmt>${formatCurrency(taxReturn.w2Income.reduce((sum, w2) => sum + w2.wages, 0))}</WagesAmt>
      ${taxReturn.form1099INT && taxReturn.form1099INT.length > 0 ? `
      <TaxableInterestAmt>${formatCurrency(taxReturn.form1099INT.reduce((sum, f) => sum + f.interestIncome, 0))}</TaxableInterestAmt>
      ` : ''}
      ${taxReturn.form1099DIV && taxReturn.form1099DIV.length > 0 ? `
      <OrdinaryDividendsAmt>${formatCurrency(taxReturn.form1099DIV.reduce((sum, f) => sum + f.ordinaryDividends, 0))}</OrdinaryDividendsAmt>
      <QualifiedDividendsAmt>${formatCurrency(taxReturn.form1099DIV.reduce((sum, f) => sum + f.qualifiedDividends, 0))}</QualifiedDividendsAmt>
      ` : ''}
      ${taxReturn.scheduleCBusiness && taxReturn.scheduleCBusiness.length > 0 ? `
      <ScheduleCNetProfitLossAmt>${formatCurrency(taxReturn.scheduleCBusiness.reduce((sum, b) => sum + b.netProfit, 0))}</ScheduleCNetProfitLossAmt>
      ` : ''}
      
      <TotalIncomeAmt>${formatCurrency(taxReturn.totalIncome)}</TotalIncomeAmt>
      
      <!-- Adjustments -->
      ${taxReturn.adjustments ? `
      <TotalAdjustmentsAmt>${formatCurrency(
        (taxReturn.adjustments.educatorExpenses || 0) +
        (taxReturn.adjustments.hsaDeduction || 0) +
        (taxReturn.adjustments.selfEmploymentTax || 0) +
        (taxReturn.adjustments.selfEmployedHealthInsurance || 0) +
        (taxReturn.adjustments.iraDeduction || 0) +
        (taxReturn.adjustments.studentLoanInterest || 0)
      )}</TotalAdjustmentsAmt>
      ` : ''}
      
      <AdjustedGrossIncomeAmt>${formatCurrency(taxReturn.adjustedGrossIncome)}</AdjustedGrossIncomeAmt>
      
      <!-- Deductions -->
      ${taxReturn.deductionType === 'standard' ? `
      <TotalItemizedOrStandardDedAmt>${formatCurrency(getStandardDeduction(taxReturn))}</TotalItemizedOrStandardDedAmt>
      <StandardDeductionInd>X</StandardDeductionInd>
      ` : `
      <TotalItemizedOrStandardDedAmt>${formatCurrency(calculateItemizedDeductions(taxReturn))}</TotalItemizedOrStandardDedAmt>
      <ItemizedDeductionsInd>X</ItemizedDeductionsInd>
      `}
      
      ${taxReturn.qualifiedBusinessIncomeDeduction ? `
      <QualifiedBusinessIncomeDedAmt>${formatCurrency(taxReturn.qualifiedBusinessIncomeDeduction)}</QualifiedBusinessIncomeDedAmt>
      ` : ''}
      
      <TaxableIncomeAmt>${formatCurrency(taxReturn.taxableIncome)}</TaxableIncomeAmt>
      
      <!-- Tax -->
      <TaxAmt>${formatCurrency(taxReturn.taxBeforeCredits)}</TaxAmt>
      
      <!-- Credits -->
      ${taxReturn.credits.childTaxCredit > 0 ? `
      <ChildTaxCreditAmt>${formatCurrency(taxReturn.credits.childTaxCredit)}</ChildTaxCreditAmt>
      ` : ''}
      ${taxReturn.credits.creditForOtherDependents > 0 ? `
      <CreditForOtherDependentsAmt>${formatCurrency(taxReturn.credits.creditForOtherDependents)}</CreditForOtherDependentsAmt>
      ` : ''}
      
      <TotalCreditsAmt>${formatCurrency(taxReturn.totalCredits)}</TotalCreditsAmt>
      <TotalTaxAmt>${formatCurrency(taxReturn.totalTax)}</TotalTaxAmt>
      
      <!-- Payments -->
      <WithholdingTaxAmt>${formatCurrency(taxReturn.federalWithholding)}</WithholdingTaxAmt>
      ${taxReturn.credits.earnedIncomeCredit > 0 ? `
      <EarnedIncomeCreditAmt>${formatCurrency(taxReturn.credits.earnedIncomeCredit)}</EarnedIncomeCreditAmt>
      ` : ''}
      ${taxReturn.credits.additionalChildTaxCredit > 0 ? `
      <AdditionalChildTaxCreditAmt>${formatCurrency(taxReturn.credits.additionalChildTaxCredit)}</AdditionalChildTaxCreditAmt>
      ` : ''}
      ${taxReturn.estimatedTaxPayments ? `
      <EstimatedTaxPaymentsAmt>${formatCurrency(taxReturn.estimatedTaxPayments)}</EstimatedTaxPaymentsAmt>
      ` : ''}
      
      <TotalPaymentsAmt>${formatCurrency(taxReturn.totalPayments)}</TotalPaymentsAmt>
      
      <!-- Refund or Amount Owed -->
      ${taxReturn.refundAmount && taxReturn.refundAmount > 0 ? `
      <OverpaidAmt>${formatCurrency(taxReturn.refundAmount)}</OverpaidAmt>
      <RefundAmt>${formatCurrency(taxReturn.refundAmount)}</RefundAmt>
      ` : ''}
      ${taxReturn.amountOwed && taxReturn.amountOwed > 0 ? `
      <OwedAmt>${formatCurrency(taxReturn.amountOwed)}</OwedAmt>
      ` : ''}
    </IRS1040>
  `;
}

export function generateW2Statements(taxReturn: TaxReturn): string {
  if (!taxReturn.w2Income || taxReturn.w2Income.length === 0) return '';
  
  return `
    <IRSW2>
      ${taxReturn.w2Income.map((w2, index) => `
      <W2StateLocalTaxGrp>
        <W2StateTaxGrp>
          <StateAbbreviationCd>${w2.stateCode || taxReturn.address.state}</StateAbbreviationCd>
          <EmployerStateIdNum>${escapeXml(w2.stateEmployerID || '')}</EmployerStateIdNum>
          <StateWagesAmt>${formatCurrency(w2.stateWages || w2.wages)}</StateWagesAmt>
          <StateIncomeTaxAmt>${formatCurrency(w2.stateWithholding || 0)}</StateIncomeTaxAmt>
        </W2StateTaxGrp>
      </W2StateLocalTaxGrp>
      <EmployerEIN>${formatEIN(w2.employerEIN)}</EmployerEIN>
      <EmployerNameControlTxt>${w2.employerName.substring(0, 4).toUpperCase()}</EmployerNameControlTxt>
      <EmployerName>
        <BusinessNameLine1Txt>${escapeXml(w2.employerName)}</BusinessNameLine1Txt>
      </EmployerName>
      <EmployerUSAddress>
        <AddressLine1Txt>${escapeXml(w2.employerAddress.street)}</AddressLine1Txt>
        <CityNm>${escapeXml(w2.employerAddress.city)}</CityNm>
        <StateAbbreviationCd>${w2.employerAddress.state}</StateAbbreviationCd>
        <ZIPCd>${w2.employerAddress.zip}</ZIPCd>
      </EmployerUSAddress>
      <EmployeeSSN>${formatSSN(taxReturn.taxpayer.ssn)}</EmployeeSSN>
      <EmployeeNm>${escapeXml(taxReturn.taxpayer.firstName)} ${escapeXml(taxReturn.taxpayer.lastName)}</EmployeeNm>
      <WagesAmt>${formatCurrency(w2.wages)}</WagesAmt>
      <WithholdingAmt>${formatCurrency(w2.federalWithholding)}</WithholdingAmt>
      <SocialSecurityWagesAmt>${formatCurrency(w2.socialSecurityWages)}</SocialSecurityWagesAmt>
      <SocialSecurityTaxAmt>${formatCurrency(w2.socialSecurityTax)}</SocialSecurityTaxAmt>
      <MedicareWagesAndTipsAmt>${formatCurrency(w2.medicareWages)}</MedicareWagesAndTipsAmt>
      <MedicareTaxWithheldAmt>${formatCurrency(w2.medicareTax)}</MedicareTaxWithheldAmt>
      ${w2.retirementPlan ? '<RetirementPlanInd>X</RetirementPlanInd>' : ''}
      `).join('')}
    </IRSW2>
  `;
}

export function generateScheduleC(taxReturn: TaxReturn): string {
  if (!taxReturn.scheduleCBusiness || taxReturn.scheduleCBusiness.length === 0) return '';
  
  return taxReturn.scheduleCBusiness.map(business => `
    <IRS1040ScheduleC>
      <BusinessNameLine1Txt>${escapeXml(business.businessName)}</BusinessNameLine1Txt>
      <PrincipalBusinessActivityCd>${business.businessCode}</PrincipalBusinessActivityCd>
      ${business.ein ? `<EIN>${formatEIN(business.ein)}</EIN>` : ''}
      <AccountingMethodCd>${business.accountingMethod.toUpperCase()}</AccountingMethodCd>
      
      <TotalGrossReceiptsAmt>${formatCurrency(business.grossReceipts)}</TotalGrossReceiptsAmt>
      ${business.returns ? `<ReturnsAndAllowancesAmt>${formatCurrency(business.returns)}</ReturnsAndAllowancesAmt>` : ''}
      <GrossIncomeAmt>${formatCurrency(business.grossReceipts - (business.returns || 0))}</GrossIncomeAmt>
      ${business.costOfGoodsSold ? `<CostOfGoodsSoldAmt>${formatCurrency(business.costOfGoodsSold)}</CostOfGoodsSoldAmt>` : ''}
      <GrossProfitAmt>${formatCurrency(business.grossProfit)}</GrossProfitAmt>
      
      <!-- Expenses -->
      ${business.expenses.advertising ? `<AdvertisingAmt>${formatCurrency(business.expenses.advertising)}</AdvertisingAmt>` : ''}
      ${business.expenses.carAndTruck ? `<CarAndTruckExpensesAmt>${formatCurrency(business.expenses.carAndTruck)}</CarAndTruckExpensesAmt>` : ''}
      ${business.expenses.commissions ? `<CommissionsAndFeesAmt>${formatCurrency(business.expenses.commissions)}</CommissionsAndFeesAmt>` : ''}
      ${business.expenses.contractLabor ? `<ContractLaborAmt>${formatCurrency(business.expenses.contractLabor)}</ContractLaborAmt>` : ''}
      ${business.expenses.depreciation ? `<DepreciationAndSection179Amt>${formatCurrency(business.expenses.depreciation)}</DepreciationAndSection179Amt>` : ''}
      ${business.expenses.insurance ? `<InsuranceAmt>${formatCurrency(business.expenses.insurance)}</InsuranceAmt>` : ''}
      ${business.expenses.interestMortgage ? `<MortgageInterestPaidAmt>${formatCurrency(business.expenses.interestMortgage)}</MortgageInterestPaidAmt>` : ''}
      ${business.expenses.interestOther ? `<OtherInterestAmt>${formatCurrency(business.expenses.interestOther)}</OtherInterestAmt>` : ''}
      ${business.expenses.legal ? `<LegalAndProfessionalAmt>${formatCurrency(business.expenses.legal)}</LegalAndProfessionalAmt>` : ''}
      ${business.expenses.officeExpense ? `<OfficeExpensesAmt>${formatCurrency(business.expenses.officeExpense)}</OfficeExpensesAmt>` : ''}
      ${business.expenses.rentVehicles ? `<MachineryAndEquipmentAmt>${formatCurrency(business.expenses.rentVehicles)}</MachineryAndEquipmentAmt>` : ''}
      ${business.expenses.rentEquipment ? `<OtherBusinessPropertyAmt>${formatCurrency(business.expenses.rentEquipment)}</OtherBusinessPropertyAmt>` : ''}
      ${business.expenses.repairs ? `<RepairsAndMaintenanceAmt>${formatCurrency(business.expenses.repairs)}</RepairsAndMaintenanceAmt>` : ''}
      ${business.expenses.supplies ? `<SuppliesAmt>${formatCurrency(business.expenses.supplies)}</SuppliesAmt>` : ''}
      ${business.expenses.taxes ? `<TaxesAndLicensesAmt>${formatCurrency(business.expenses.taxes)}</TaxesAndLicensesAmt>` : ''}
      ${business.expenses.travel ? `<TravelAmt>${formatCurrency(business.expenses.travel)}</TravelAmt>` : ''}
      ${business.expenses.meals ? `<MealsAndEntertainmentAmt>${formatCurrency(business.expenses.meals)}</MealsAndEntertainmentAmt>` : ''}
      ${business.expenses.utilities ? `<UtilitiesAmt>${formatCurrency(business.expenses.utilities)}</UtilitiesAmt>` : ''}
      ${business.expenses.wages ? `<WagesAmt>${formatCurrency(business.expenses.wages)}</WagesAmt>` : ''}
      
      <TotalExpensesAmt>${formatCurrency(Object.values(business.expenses).reduce((sum, val) => sum + (val || 0), 0))}</TotalExpensesAmt>
      <NetProfitOrLossAmt>${formatCurrency(business.netProfit)}</NetProfitOrLossAmt>
    </IRS1040ScheduleC>
  `).join('');
}

export function generateScheduleA(taxReturn: TaxReturn): string {
  if (taxReturn.deductionType !== 'itemized' || !taxReturn.itemizedDeductions) return '';
  
  const deductions = taxReturn.itemizedDeductions;
  const saltCap = Math.min(
    (deductions.stateLocalTaxes || 0) + (deductions.realEstateTaxes || 0) + (deductions.personalPropertyTaxes || 0),
    10000
  );
  
  return `
    <IRS1040ScheduleA>
      ${deductions.medicalExpenses > 0 ? `
      <MedicalAndDentalExpensesAmt>${formatCurrency(deductions.medicalExpenses)}</MedicalAndDentalExpensesAmt>
      ` : ''}
      
      <StateAndLocalTaxesAmt>${formatCurrency(saltCap)}</StateAndLocalTaxesAmt>
      
      ${deductions.mortgageInterest > 0 ? `
      <MortgageInterestAmt>${formatCurrency(deductions.mortgageInterest)}</MortgageInterestAmt>
      ` : ''}
      
      ${deductions.charitableCash > 0 ? `
      <GiftsByCashOrCheckAmt>${formatCurrency(deductions.charitableCash)}</GiftsByCashOrCheckAmt>
      ` : ''}
      ${deductions.charitableNoncash ? `
      <OtherThanByCashOrCheckAmt>${formatCurrency(deductions.charitableNoncash)}</OtherThanByCashOrCheckAmt>
      ` : ''}
      
      <TotalItemizedDeductionsAmt>${formatCurrency(calculateItemizedDeductions(taxReturn))}</TotalItemizedDeductionsAmt>
    </IRS1040ScheduleA>
  `;
}

function getStandardDeduction(taxReturn: TaxReturn): number {
  // 2024 standard deduction amounts
  const standardDeductions: Record<string, number> = {
    'single': 14600,
    'married_filing_jointly': 29200,
    'married_filing_separately': 14600,
    'head_of_household': 21900,
    'qualifying_surviving_spouse': 29200
  };
  return standardDeductions[taxReturn.filingStatus] || 14600;
}

function calculateItemizedDeductions(taxReturn: TaxReturn): number {
  if (!taxReturn.itemizedDeductions) return 0;
  const d = taxReturn.itemizedDeductions;
  
  // SALT cap at $10,000
  const saltTotal = Math.min(
    (d.stateLocalTaxes || 0) + (d.realEstateTaxes || 0) + (d.personalPropertyTaxes || 0),
    10000
  );
  
  return (
    (d.medicalExpenses || 0) +
    saltTotal +
    (d.mortgageInterest || 0) +
    (d.mortgageInsurancePremiums || 0) +
    (d.charitableCash || 0) +
    (d.charitableNoncash || 0) +
    (d.casualtyLosses || 0) +
    (d.otherDeductions || 0)
  );
}

export function generateMeFXML(taxReturn: TaxReturn, softwareId: string): string {
  const submissionId = generateSubmissionId();
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Return xmlns="${IRS_NAMESPACE}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" returnVersion="2024v1.0">
  ${generateReturnHeader(taxReturn, softwareId)}
  <ReturnData documentCnt="1">
    ${generateForm1040(taxReturn)}
    ${generateW2Statements(taxReturn)}
    ${generateScheduleC(taxReturn)}
    ${generateScheduleA(taxReturn)}
  </ReturnData>
</Return>`;

  return xml.replace(/>\s+</g, '><').trim();
}

export function createMeFSubmission(taxReturn: TaxReturn, softwareId: string): MeFSubmission {
  const submissionId = generateSubmissionId();
  const xmlContent = generateMeFXML(taxReturn, softwareId);
  
  return {
    submissionId,
    efin: EFIN,
    softwareId,
    taxYear: taxReturn.taxYear,
    submissionType: 'IRS1040',
    returnData: taxReturn,
    xmlContent,
    status: 'pending'
  };
}
