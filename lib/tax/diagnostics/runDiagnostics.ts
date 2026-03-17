import type { Return1040 } from '@/lib/tax/domain/types';

export type Diagnostic = {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
};

/**
 * Runs diagnostics against a Return1040 domain object.
 *
 * Designed to run both live during data entry (all severities) and
 * as a pre-filing gate (errors block transmission, warnings surface to preparer).
 *
 * Does NOT validate XML — that is validateReturnXml()'s job.
 * This layer catches semantic and compliance issues before serialization.
 */
export function runDiagnostics(ret: Return1040): Diagnostic[] {
  const out: Diagnostic[] = [];

  // ── Identity ──────────────────────────────────────────────────────────────

  const ssnDigits = ret.taxpayer.ssn.replace(/\D/g, '');
  if (ssnDigits.length !== 9 || ssnDigits === '000000000') {
    out.push({ code: 'TP_SSN_INVALID', severity: 'error', message: 'Taxpayer SSN must be 9 digits and cannot be all zeros.', field: 'taxpayer.ssn' });
  }

  if (!ret.taxpayer.firstName?.trim() || !ret.taxpayer.lastName?.trim()) {
    out.push({ code: 'TP_NAME_MISSING', severity: 'error', message: 'Taxpayer first and last name are required.', field: 'taxpayer' });
  }

  if (!ret.taxpayer.dob) {
    out.push({ code: 'TP_DOB_MISSING', severity: 'error', message: 'Taxpayer date of birth is required.', field: 'taxpayer.dob' });
  }

  // ── Filing status ─────────────────────────────────────────────────────────

  if (ret.filingStatus === 'mfj' && !ret.spouse) {
    out.push({ code: 'SPOUSE_REQUIRED', severity: 'error', message: 'MFJ filing status requires spouse data.', field: 'spouse' });
  }

  if (ret.filingStatus === 'mfs' && !ret.spouse?.ssn) {
    out.push({ code: 'SPOUSE_SSN_REQUIRED_MFS', severity: 'warning', message: 'MFS returns should include spouse SSN.', field: 'spouse.ssn' });
  }

  if (ret.spouse) {
    const spouseSsn = ret.spouse.ssn.replace(/\D/g, '');
    if (spouseSsn.length !== 9 || spouseSsn === '000000000') {
      out.push({ code: 'SPOUSE_SSN_INVALID', severity: 'error', message: 'Spouse SSN is invalid.', field: 'spouse.ssn' });
    }
    if (ret.spouse.ssn === ret.taxpayer.ssn) {
      out.push({ code: 'SSN_DUPLICATE', severity: 'error', message: 'Taxpayer and spouse SSN cannot be the same.', field: 'spouse.ssn' });
    }
  }

  // ── Dependents ────────────────────────────────────────────────────────────

  const depSsns: string[] = [];
  for (const [i, dep] of ret.dependents.entries()) {
    const depSsn = dep.ssn.replace(/\D/g, '');
    if (depSsn.length !== 9 || depSsn === '000000000') {
      out.push({ code: 'DEP_SSN_INVALID', severity: 'error', message: `Dependent ${i + 1} SSN is invalid.`, field: `dependents[${i}].ssn` });
    }
    if (depSsns.includes(depSsn)) {
      out.push({ code: 'DEP_SSN_DUPLICATE', severity: 'error', message: `Dependent ${i + 1} SSN is a duplicate.`, field: `dependents[${i}].ssn` });
    }
    depSsns.push(depSsn);

    if (!dep.relationship) {
      out.push({ code: 'DEP_RELATIONSHIP_MISSING', severity: 'error', message: `Dependent ${i + 1} relationship is required.`, field: `dependents[${i}].relationship` });
    }
  }

  // ── Income ────────────────────────────────────────────────────────────────

  if (ret.w2s.length === 0 && ret.forms1099.length === 0 && !ret.schedules.scheduleC) {
    out.push({ code: 'NO_INCOME_DOCS', severity: 'warning', message: 'No income documents present (W-2, 1099, or Schedule C).', field: 'w2s' });
  }

  for (const [i, w2] of ret.w2s.entries()) {
    if (!w2.ein || !/^\d{2}-\d{7}$/.test(w2.ein)) {
      out.push({ code: 'W2_EIN_INVALID', severity: 'error', message: `W-2 ${i + 1}: employer EIN format invalid (expected XX-XXXXXXX).`, field: `w2s[${i}].ein` });
    }
    if (w2.wages < 0) {
      out.push({ code: 'W2_WAGES_NEGATIVE', severity: 'error', message: `W-2 ${i + 1}: wages cannot be negative.`, field: `w2s[${i}].wages` });
    }
    if (w2.federalWithholding > w2.wages) {
      out.push({ code: 'W2_WITHHOLDING_EXCEEDS_WAGES', severity: 'warning', message: `W-2 ${i + 1}: federal withholding exceeds wages — verify.`, field: `w2s[${i}].federalWithholding` });
    }
  }

  // ── Schedule C ────────────────────────────────────────────────────────────

  if (ret.schedules.scheduleC) {
    const sc = ret.schedules.scheduleC;
    if (sc.grossReceipts < 0) {
      out.push({ code: 'SCHC_GROSS_NEGATIVE', severity: 'error', message: 'Schedule C gross receipts cannot be negative.', field: 'schedules.scheduleC.grossReceipts' });
    }
    if (!sc.principalBusinessCode || !/^\d{6}$/.test(sc.principalBusinessCode)) {
      out.push({ code: 'SCHC_BUSINESS_CODE_INVALID', severity: 'error', message: 'Schedule C principal business code must be 6 digits.', field: 'schedules.scheduleC.principalBusinessCode' });
    }
  }

  // ── EITC due diligence ────────────────────────────────────────────────────

  if (ret.schedules.eitc) {
    if (ret.schedules.eitc.investmentIncome > 11600) {
      // 2024 investment income limit
      out.push({ code: 'EITC_INVESTMENT_INCOME_EXCEEDS_LIMIT', severity: 'error', message: 'Investment income exceeds EITC limit for 2024 ($11,600).', field: 'schedules.eitc.investmentIncome' });
    }
    if (ret.preparer && !ret.preparer.selfPrepared) {
      out.push({ code: 'EITC_FORM_8867_REQUIRED', severity: 'warning', message: 'Form 8867 (EITC Due Diligence) is required for paid preparers claiming EITC.', field: 'schedules.eitc' });
    }
  }

  // ── Address ───────────────────────────────────────────────────────────────

  if (!ret.address.street || !ret.address.city || !ret.address.state || !ret.address.zip) {
    out.push({ code: 'ADDRESS_INCOMPLETE', severity: 'error', message: 'Taxpayer address is incomplete.', field: 'address' });
  }

  // ── Signature ─────────────────────────────────────────────────────────────

  if (!ret.taxpayerSignature?.pin) {
    out.push({ code: 'SIGNATURE_MISSING', severity: 'error', message: 'Taxpayer signature PIN is required before filing.', field: 'taxpayerSignature' });
  }

  if (ret.filingStatus === 'mfj' && !ret.spouseSignature?.pin) {
    out.push({ code: 'SPOUSE_SIGNATURE_MISSING', severity: 'error', message: 'Spouse signature PIN is required for MFJ returns.', field: 'spouseSignature' });
  }

  // ── Preparer ──────────────────────────────────────────────────────────────

  if (ret.preparer && !ret.preparer.selfPrepared) {
    if (!ret.preparer.ptin || !/^P\d{8}$/.test(ret.preparer.ptin)) {
      out.push({ code: 'PTIN_INVALID', severity: 'error', message: 'Preparer PTIN must be in format P########.', field: 'preparer.ptin' });
    }
  }

  // ── Prior year AGI ────────────────────────────────────────────────────────

  if (ret.taxpayerSignature?.pin && ret.priorYearAGI === undefined) {
    out.push({ code: 'PRIOR_YEAR_AGI_MISSING', severity: 'warning', message: 'Prior year AGI is recommended for self-select PIN identity verification. Use 0 for first-time filers.', field: 'priorYearAGI' });
  }

  // ── Status gate ───────────────────────────────────────────────────────────

  if (ret.metadata.status === 'draft') {
    out.push({ code: 'RETURN_IN_DRAFT', severity: 'info', message: 'Return is in draft status and cannot be transmitted.', field: 'metadata.status' });
  }

  return out;
}

/**
 * Returns true if the return has no blocking errors.
 * Warnings and info do not block filing.
 */
export function isReadyToFile(ret: Return1040): boolean {
  const diagnostics = runDiagnostics(ret);
  return diagnostics.every(d => d.severity !== 'error');
}
