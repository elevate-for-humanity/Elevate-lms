import path from 'node:path';
import { validateXmlAgainstXsd, type XsdValidationIssue } from './xsd';
import { validateBusinessRules, type BusinessRuleIssue } from './businessRules';

export type ValidationIssue = XsdValidationIssue | BusinessRuleIssue;

export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

/**
 * Full return validation: XSD schema + IRS business rules.
 *
 * Hard-fails if schemas are missing or xmllint is unavailable.
 * Never silently downgrades to structural-only validation.
 */
export async function validateReturnXml(input: {
  taxYear: number;
  formType: '1040';
  xml: string;
}): Promise<ValidationResult> {
  const schemaPath = path.join(
    process.cwd(),
    'lib', 'tax-software', 'schemas',
    String(input.taxYear),
    `${input.formType}.xsd`
  );

  const [xsdIssues, ruleIssues] = await Promise.all([
    validateXmlAgainstXsd({ xml: input.xml, schemaPath }),
    validateBusinessRules(input),
  ]);

  const issues: ValidationIssue[] = [...xsdIssues, ...ruleIssues];
  return {
    ok: issues.every(i => i.severity !== 'error'),
    issues,
  };
}
