export type BusinessRuleIssue = {
  code: string;
  message: string;
  path?: string;
  severity: 'error' | 'warning';
};

/**
 * IRS MeF business rules that XSD validation cannot catch.
 * These are semantic checks on the XML content.
 *
 * Source: IRS Publication 4164 and MeF Business Rules for Form 1040.
 * Add rules here as they are identified from IRS ATS rejection codes.
 */
export async function validateBusinessRules(input: {
  taxYear: number;
  formType: '1040';
  xml: string;
}): Promise<BusinessRuleIssue[]> {
  const issues: BusinessRuleIssue[] = [];
  const { xml } = input;

  // IND-031: Primary SSN cannot be all zeros
  if (xml.includes('<PrimarySSN>000000000</PrimarySSN>')) {
    issues.push({
      code: 'IND-031',
      message: 'Primary SSN cannot be all zeros.',
      path: 'PrimarySSN',
      severity: 'error',
    });
  }

  // IND-510: Prior year AGI required when using self-select PIN
  if (
    xml.includes('<PrimarySignaturePIN>') &&
    !xml.includes('<PrimaryPriorYearAGIAmt>')
  ) {
    issues.push({
      code: 'IND-510',
      message: 'PrimaryPriorYearAGIAmt is required when using self-select PIN. Use 0 for first-time filers.',
      path: 'PrimaryPriorYearAGIAmt',
      severity: 'error',
    });
  }

  // IND-689: Spouse SSN required for MFJ
  if (
    xml.includes('<FilingStatus>MFJ</FilingStatus>') &&
    !xml.includes('<SpouseSSN>')
  ) {
    issues.push({
      code: 'IND-689',
      message: 'Spouse SSN is required for MFJ filing status.',
      path: 'SpouseSSN',
      severity: 'error',
    });
  }

  // R0000-902: EFIN must be present in transmission header
  if (!xml.includes('<EFIN>')) {
    issues.push({
      code: 'R0000-902',
      message: 'EFIN is missing from the transmission header.',
      path: 'EFIN',
      severity: 'error',
    });
  }

  return issues;
}
