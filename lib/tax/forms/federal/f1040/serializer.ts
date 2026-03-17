import type { Return1040 } from '@/lib/tax/domain/types';
import { mapReturn1040ToXmlDto } from './mapper';

function esc(value: string | number | undefined): string {
  if (value === undefined || value === null) return '';
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function amt(value: number): string {
  return value.toFixed(2);
}

/**
 * Serializes a Return1040 domain object to IRS MeF XML.
 * Uses mapper to produce a stable DTO first — never reads the domain object directly.
 */
export async function serialize1040ToXml(ret: Return1040): Promise<string> {
  const dto = mapReturn1040ToXmlDto(ret);

  const dependentsXml = dto.dependents.map(d => `
    <DependentDetail>
      <DependentFirstName>${esc(d.firstName)}</DependentFirstName>
      <DependentLastName>${esc(d.lastName)}</DependentLastName>
      <DependentSSN>${esc(d.ssn)}</DependentSSN>
      <DependentRelationship>${esc(d.relationship)}</DependentRelationship>
    </DependentDetail>`).join('');

  const w2sXml = dto.w2s.map(w => `
    <W2Wages>
      <EmployerEIN>${esc(w.ein)}</EmployerEIN>
      <EmployerName>${esc(w.employerName)}</EmployerName>
      <WagesAmt>${amt(w.wages)}</WagesAmt>
      <FederalWithholdingAmt>${amt(w.federalWithholding)}</FederalWithholdingAmt>
    </W2Wages>`).join('');

  const preparerXml = dto.preparer ? `
  <PreparerPersonGrp>
    <PTIN>${esc(dto.preparer.ptin)}</PTIN>
    <PreparerPersonNm>${esc(dto.preparer.name)}</PreparerPersonNm>
    ${dto.preparer.firmName ? `<PreparerFirmName>${esc(dto.preparer.firmName)}</PreparerFirmName>` : ''}
    ${dto.preparer.firmEIN ? `<PreparerFirmEIN>${esc(dto.preparer.firmEIN)}</PreparerFirmEIN>` : ''}
  </PreparerPersonGrp>` : '<SelfPreparedInd>X</SelfPreparedInd>';

  const spouseXml = dto.spouse ? `
  <SpouseNm>${esc(dto.spouse.firstName)} ${esc(dto.spouse.lastName)}</SpouseNm>
  <SpouseSSN>${esc(dto.spouse.ssn)}</SpouseSSN>
  <SpouseSignaturePIN>${esc(dto.spousePin ?? '')}</SpouseSignaturePIN>
  ${dto.spouse.ipPin ? `<SpouseIPPIN>${esc(dto.spouse.ipPin)}</SpouseIPPIN>` : ''}` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<Return xmlns="http://www.irs.gov/efile" returnVersion="${dto.taxYear}v1.0">
  <ReturnHeader binaryAttachmentCnt="0">
    <ReturnTs>${new Date().toISOString()}</ReturnTs>
    <TaxYr>${dto.taxYear}</TaxYr>
    <SoftwareId>${esc(dto.softwareId)}</SoftwareId>
    <EFIN>${esc(dto.efin)}</EFIN>
    <FilingSecurityInformation>
      <PINTypeCd>Self-Select On-Line</PINTypeCd>
      <PrimaryPINEnteredByCd>Taxpayer</PrimaryPINEnteredByCd>
      <PrimarySignaturePIN>${esc(dto.taxpayerPin)}</PrimarySignaturePIN>
      <PrimarySignatureDt>${esc(dto.signedAt)}</PrimarySignatureDt>
      <PrimaryPriorYearAGIAmt>${amt(dto.priorYearAGI)}</PrimaryPriorYearAGIAmt>
      ${dto.taxpayer.ipPin ? `<IPPINGrp><PrimaryIPPIN>${esc(dto.taxpayer.ipPin)}</PrimaryIPPIN></IPPINGrp>` : ''}
    </FilingSecurityInformation>
    ${preparerXml}
  </ReturnHeader>
  <ReturnData documentCnt="1">
    <IRS1040 documentName="IRS1040">
      <FilingStatus>${esc(dto.filingStatus)}</FilingStatus>
      <PrimaryFirstNm>${esc(dto.taxpayer.firstName)}</PrimaryFirstNm>
      <PrimaryLastNm>${esc(dto.taxpayer.lastName)}</PrimaryLastNm>
      <PrimarySSN>${esc(dto.taxpayer.ssn)}</PrimarySSN>
      ${spouseXml}
      <AddressLine1Txt>${esc(dto.address.street)}</AddressLine1Txt>
      ${dto.address.apt ? `<AddressLine2Txt>${esc(dto.address.apt)}</AddressLine2Txt>` : ''}
      <CityNm>${esc(dto.address.city)}</CityNm>
      <StateAbbreviationCd>${esc(dto.address.state)}</StateAbbreviationCd>
      <ZIPCd>${esc(dto.address.zip)}</ZIPCd>
      <DependentList>${dependentsXml}
      </DependentList>
      <W2WagesList>${w2sXml}
      </W2WagesList>
      <TotalIncomeAmt>${amt(dto.computed.totalIncome)}</TotalIncomeAmt>
      <AdjustedGrossIncomeAmt>${amt(dto.computed.adjustedGrossIncome)}</AdjustedGrossIncomeAmt>
      <TaxableIncomeAmt>${amt(dto.computed.taxableIncome)}</TaxableIncomeAmt>
      <TotalTaxAmt>${amt(dto.computed.totalTax)}</TotalTaxAmt>
      <TotalPaymentsAmt>${amt(dto.computed.totalPayments)}</TotalPaymentsAmt>
      ${dto.computed.refundAmount > 0
        ? `<RefundAmt>${amt(dto.computed.refundAmount)}</RefundAmt>`
        : `<BalanceDueAmt>${amt(dto.computed.amountOwed)}</BalanceDueAmt>`}
    </IRS1040>
  </ReturnData>
</Return>`;
}
