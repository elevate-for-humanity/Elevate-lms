import { childCredits2026 } from '../calculation/credits-2026';
import {
  irsDollars,
  type Federal1040Input,
  calculateFederal1040_2026,
} from '../calculation/federal-1040-2026';
import type { SavedFederalInputs } from '../calculation/input-schema';
import type { IrsNode, MefProfile } from './return-xml';
const upper = (s: string) => s.trim().replace(/\s+/g, ' ').toUpperCase();
const control = (s: string) =>
  upper(s)
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4);
export function mapFamilyDocuments2026(input: {
  profile: MefProfile;
  financial: Federal1040Input;
  creditInputs: SavedFederalInputs;
  calculation: ReturnType<typeof calculateFederal1040_2026>;
  documents: Record<string, IrsNode | IrsNode[]>;
  fields: IrsNode;
}) {
  const { profile, financial: f, creditInputs: extra, calculation: c, documents, fields } = input;
  const dependents = profile.dependents ?? [];
  const ids = [
    profile.ssn,
    ...(profile.spouse ? [profile.spouse.ssn] : []),
    ...dependents.map((d) => d.ssn),
  ].map((s) => s.replace(/-/g, ''));
  if (new Set(ids).size !== ids.length)
    throw new Error('Each taxpayer and dependent must have a distinct identification number');
  const claimed = dependents.filter((d) => d.claimedAsDependent);
  const children = claimed.filter((d) => d.qualifiesChildTaxCredit),
    others = claimed.filter((d) => d.qualifiesOtherDependentCredit);
  const eicChildren = dependents.filter((d) => d.qualifiesEic);
  const childInput = extra.childCreditInputs;
  if (
    childInput &&
    (childInput.qualifyingChildren !== children.length ||
      childInput.otherDependents !== others.length)
  )
    throw new Error('Dependent credit details must match the reviewed worksheet');
  if (extra.eicInputs && extra.eicInputs.qualifyingChildren !== eicChildren.length)
    throw new Error('Earned income child details must match the reviewed worksheet');
  if ((children.length || others.length) && !childInput)
    throw new Error('Complete the dependent credit worksheet before export');
  if (claimed.length) {
    fields.DependentDetail = claimed.map((d) => ({
      DependentFirstNm: upper(d.firstName),
      DependentLastNm: upper(d.lastName),
      DependentNameControlTxt: control(d.lastName),
      DependentSSN: d.ssn.replace(/-/g, ''),
      DependentRelationshipCd: d.relationship,
      ...(d.identityProtectionPin ? { IdentityProtectionPIN: d.identityProtectionPin } : {}),
      ...(d.monthsLivedWithTaxpayer >= 7 ? { YesLiveWithChildOverHalfYrInd: 'X' } : {}),
      ...(d.livedInUsOverHalfYear ? { YesLiveWithChldUSOvrHalfYrInd: 'X' } : {}),
      ...(d.studentUnder24 ? { ChildIsAStudentUnder24Ind: 'X' } : {}),
      ...(d.permanentlyDisabled ? { ChildPermanentlyDisabledInd: 'X' } : {}),
      ...(d.qualifiesChildTaxCredit
        ? { EligibleForChildTaxCreditInd: 'X' }
        : d.qualifiesOtherDependentCredit
          ? { EligibleForODCInd: 'X' }
          : {}),
    }));
    if (claimed.length > 4) fields.MoreDependentsInd = 'X';
  }
  if (c.lines['27a'] && eicChildren.length) {
    if (documents.IRS1040ScheduleEIC)
      throw new Error('Calculated earned income child information cannot be replaced');
    documents.IRS1040ScheduleEIC = {
      '@attributes': { documentId: 'SEIC' },
      QualifyingChildInformation: eicChildren.slice(0, 3).map((d) => ({
        QualifyingChildNameControlTxt: control(d.lastName),
        ChildFirstAndLastName: {
          PersonFirstNm: upper(d.firstName),
          PersonLastNm: upper(d.lastName),
        },
        QualifyingChildSSN: d.ssn.replace(/-/g, ''),
        ChildBirthYr: d.birthDate.slice(0, 4),
        ChildRelationshipCd: d.relationship,
        MonthsChildLivedWithYouCnt: String(d.monthsLivedWithTaxpayer).padStart(2, '0'),
        ChildIsAStudentUnder24Ind: d.studentUnder24,
        ChildPermanentlyDisabledInd: d.permanentlyDisabled,
        ...(d.identityProtectionPin ? { IdentityProtectionPIN: d.identityProtectionPin } : {}),
      })),
    };
  }
  if (childInput && (children.length || others.length)) {
    if (childInput.foreignEarnedIncomeExcluded) {
      if (!documents.IRS1040Schedule8812)
        throw new Error('Review foreign-income addbacks on Schedule 8812');
      return;
    }
    if (documents.IRS1040Schedule8812)
      throw new Error('Calculated dependent credit worksheet cannot be replaced');
    const earned = Math.max(
      0,
      irsDollars(
        f.wages.reduce((s, w) => s + w.wages, 0) +
          (f.selfEmployment ?? []).reduce((s, b) => s + b.netProfit, 0) -
          c.selfEmploymentDeduction,
      ),
    );
    const magi = c.adjustedGrossIncome,
      threshold = f.filingStatus === 'married_joint' ? 400000 : 200000;
    const initial = children.length * 2200 + others.length * 500,
      excess = Math.max(0, magi - threshold),
      roundedExcess = Math.ceil(excess / 1000) * 1000;
    if (!childInput.ssnRequirementsMet)
      throw new Error('Review dependent identification eligibility before export');
    const payroll = irsDollars(
      f.wages.reduce(
        (sum, w) => sum + (w.socialSecurityTax ?? 0) + (w.medicareTaxWithheld ?? 0),
        0,
      ),
    );
    const payrollAlternative = Math.max(0, payroll + c.selfEmploymentDeduction - c.lines['27a']);
    const child = childCredits2026({
      ...childInput,
      threeChildPayrollAlternative: payrollAlternative,
      filingStatus: f.filingStatus,
      modifiedAgi: Math.max(0, magi),
      earnedIncome: earned,
      availableTax: Math.max(0, c.lines['18'] - c.lines['20']),
    });
    if (child.nonrefundable !== c.lines['19'] || child.additionalChildTaxCredit !== c.lines['28'])
      throw new Error('Dependent credits differ from the reviewed calculation');
    const form: IrsNode = {
      '@attributes': { documentId: 'S8812' },
      AdjustedGrossIncomeAmt: c.adjustedGrossIncome,
      ModifiedAGIAmt: magi,
      QlfyChildUnderAgeSSNCnt: children.length,
      QlfyChildUnderAgeSSNLimtAmt: children.length * 2200,
      OtherDependentCnt: others.length,
      OtherDependentCreditAmt: others.length * 500,
      InitialCTCODCAmt: initial,
      FilingStatusThresholdCd: String(threshold),
      ExcessAdjGrossIncomeAmt: roundedExcess,
      ModifiedAGIPhaseOutAmt: irsDollars(roundedExcess * 0.05),
      CTCODCOverAGILimitInd: initial > roundedExcess * 0.05,
      CTCODCAfterAGILimitAmt: child.maximumAfterPhaseout,
      ACTCTaxLiabiltyLimitAmt: Math.max(0, c.lines['18'] - c.lines['20']),
      CTCODCAmt: c.lines['19'],
    };
    if (c.lines['28']) {
      const unused = Math.max(0, child.maximumAfterPhaseout - c.lines['19']);
      form.ClaimACTCAllFilersGrp = {
        ACTCBeforeLimitAmt: unused,
        QlfyChildUnderAgeSSNCnt: children.length,
        QlfyChildUnderAgeSSNLimtAmt: children.length * 1700,
        ACTCAfterLimitAmt: Math.min(unused, children.length * 1700),
        TotalEarnedIncomeAmt: earned,
        EarnedIncmMoreThanSpecifiedInd: earned > 2500,
        NetTotalEarnedIncomeAmt: Math.max(0, earned - 2500),
        NetEarnedIncomeCalculatedAmt: irsDollars(Math.max(0, earned - 2500) * 0.15),
        ThreeOrMoreQlfyChildrenInd: children.length >= 3,
        ...(children.length >= 3
          ? {
              FromW2Amt: payroll,
              FromTaxReturnAmt: c.selfEmploymentDeduction,
              CalcFromW2AndReturnAmt: payroll + c.selfEmploymentDeduction,
              CalcAmtFromRetPlusTaxWhldAmt: c.lines['27a'],
              CalculatedDifferenceAmt: payrollAlternative,
              LargerCalcIncomeOrDiffAmt: Math.max(
                irsDollars(Math.max(0, earned - 2500) * 0.15),
                payrollAlternative,
              ),
            }
          : {}),
      };
    }
    form.AdditionalChildTaxCreditAmt = c.lines['28'];
    documents.IRS1040Schedule8812 = form;
  }
}
