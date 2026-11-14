import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { prepareFederalReturn2026 } from '@/lib/tax-software/calculation/prepare-federal-return';
import type { TaxDependent } from '@/lib/tax-software/mef/family-types';
import { serializeMefReturn2026 } from '@/lib/tax-software/mef/serialize-return';
import { mapFederalReturn2026 } from '@/lib/tax-software/mef/return-xml';
const fixture = {
  profile: {
    firstName: 'Sam',
    lastName: 'Wheat',
    ssn: '400001037',
    birthDate: '1986-02-07',
    address: { line1: '2525 Main Street', city: 'Round Rock', state: 'TX', zip: '78680' },
    occupation: 'Baker',
  },
  financial: {
    filingStatus: 'single' as const,
    wages: [{ wages: 50510, federalWithholding: 10268 }],
  },
  w2: [
    {
      wages: 50510,
      federalWithholding: 10268,
      socialSecurityWages: 50510,
      socialSecurityTax: 3132,
      medicareWages: 50510,
      medicareTaxWithheld: 732,
      employerEin: '000000057',
      employerName: 'Doughnut Castle',
      employerAddress: {
        line1: '1518 North Mays Lane',
        city: 'Round Rock',
        state: 'TX',
        zip: '78664',
      },
    },
  ],
  configuration: {
    softwareId: '00000000',
    efin: '000000',
    createdAt: '2027-01-15T12:00:00Z',
    signatureDate: '2027-01-15',
    taxpayerPin: '12345',
    priorYearAgi: 0,
    publicIp: '8.8.8.8',
    authorizationRecorded: true,
  },
  refundAllocations: [
    {
      amount: 5385,
      routingNumber: '012345672',
      accountNumber: '12345678',
      accountType: 'checking' as const,
    },
    {
      amount: 1000,
      routingNumber: '012345672',
      accountNumber: '1234567',
      accountType: 'savings' as const,
    },
  ],
};
describe('IRS mapping', () => {
  it('preserves negative adjusted gross income on the dependent credit schedule', () => {
    const prepared = prepareFederalReturn2026(
      { filingStatus: 'single', wages: [], selfEmployment: [{ netProfit: -1000 }] },
      {
        childCreditInputs: { qualifyingChildren: 1, otherDependents: 0, ssnRequirementsMet: true },
      },
    );
    const mapped = mapFederalReturn2026({
      ...fixture,
      profile: {
        ...fixture.profile,
        dependents: [
          {
            firstName: 'Alex',
            lastName: 'Wheat',
            ssn: '400001040',
            birthDate: '2016-01-15',
            relationship: 'SON',
            claimedAsDependent: true,
            qualifiesChildTaxCredit: true,
            qualifiesOtherDependentCredit: false,
            qualifiesEic: false,
            monthsLivedWithTaxpayer: 12,
            livedInUsOverHalfYear: true,
            studentUnder24: false,
            permanentlyDisabled: false,
          },
        ],
      },
      financial: prepared.financial,
      creditInputs: prepared.creditInputs,
      w2: [],
      refundAllocations: undefined,
    });
    const xml = serializeMefReturn2026(mapped.irsFields);
    expect(xml).toContain('<ModifiedAGIAmt>-1000</ModifiedAGIAmt>');
    if (process.env.IRS_TEST_NEGATIVE_FAMILY_XML_PATH)
      writeFileSync(process.env.IRS_TEST_NEGATIVE_FAMILY_XML_PATH, xml, { mode: 0o600 });
  });
  it('exports reviewed dependents and child credit schedules in IRS order', () => {
    const dependents: TaxDependent[] = [0, 1, 2].map((i) => ({
      firstName: ['Alex', 'Jamie', 'Taylor'][i],
      lastName: 'Wheat',
      ssn: `40000104${i}`,
      birthDate: '2016-01-15',
      relationship: 'SON',
      claimedAsDependent: true,
      qualifiesChildTaxCredit: true,
      qualifiesOtherDependentCredit: false,
      qualifiesEic: true,
      monthsLivedWithTaxpayer: 12,
      livedInUsOverHalfYear: true,
      studentUnder24: false,
      permanentlyDisabled: false,
    }));
    const prepared = prepareFederalReturn2026(
      {
        filingStatus: 'single',
        wages: [
          {
            wages: 20000,
            federalWithholding: 0,
            socialSecurityTax: 1240,
            medicareTaxWithheld: 290,
          },
        ],
      },
      {
        childCreditInputs: { qualifyingChildren: 3, otherDependents: 0, ssnRequirementsMet: true },
        eicInputs: { qualifyingChildren: 3, investmentIncome: 0, eligibilityRequirementsMet: true },
      },
    );
    const mapped = mapFederalReturn2026({
      ...fixture,
      profile: { ...fixture.profile, dependents },
      financial: prepared.financial,
      creditInputs: prepared.creditInputs,
      w2: [
        {
          ...fixture.w2[0],
          wages: 20000,
          federalWithholding: 0,
          socialSecurityWages: 20000,
          medicareWages: 20000,
          socialSecurityTax: 1240,
          medicareTaxWithheld: 290,
        },
      ],
      refundAllocations: undefined,
    });
    expect(mapped.irsFields.ReturnData.IRS1040ScheduleEIC).toBeDefined();
    expect(mapped.irsFields.ReturnData.IRS1040Schedule8812).toBeDefined();
    const xml = serializeMefReturn2026(mapped.irsFields);
    expect(xml).toContain('<TotalTaxAfter1062TaxAmt>');
    if (process.env.IRS_TEST_FAMILY_XML_PATH)
      writeFileSync(process.env.IRS_TEST_FAMILY_XML_PATH, xml, { mode: 0o600 });
    expect(() =>
      mapFederalReturn2026({
        ...fixture,
        profile: { ...fixture.profile, dependents },
        financial: prepared.financial,
        creditInputs: {
          ...prepared.creditInputs,
          childCreditInputs: {
            qualifyingChildren: 1,
            otherDependents: 0,
            ssnRequirementsMet: true,
          },
        },
        w2: [
          {
            ...fixture.w2[0],
            wages: 20000,
            federalWithholding: 0,
            socialSecurityTax: 1240,
            medicareTaxWithheld: 290,
          },
        ],
        refundAllocations: undefined,
      }),
    ).toThrow('match the reviewed worksheet');
  });
  it('generates the self-employment schedules from the reviewed calculation', () => {
    const r = mapFederalReturn2026({
      ...fixture,
      financial: { ...fixture.financial, selfEmployment: [{ netProfit: 10000 }] },
      refundAllocations: undefined,
    });
    expect(r.irsFields.ReturnData.IRS1040ScheduleSE).toBeDefined();
    expect(r.irsFields.ReturnData.IRS1040Schedule1).toBeDefined();
    expect(r.irsFields.ReturnData.IRS1040Schedule2).toBeDefined();
    if (process.env.IRS_TEST_SE_XML_PATH)
      writeFileSync(process.env.IRS_TEST_SE_XML_PATH, serializeMefReturn2026(r.irsFields), {
        mode: 0o600,
      });
  });
  it('rejects assigning wage statements to a different taxpayer during export', () => {
    expect(() =>
      mapFederalReturn2026({ ...fixture, w2: [{ ...fixture.w2[0], owner: 'spouse' }] }),
    ).toThrow('match calculation');
  });

  it('maps calculated 1040, W-2 and refund split with exact document counts', () => {
    const r = mapFederalReturn2026(fixture);
    expect(r.calculation.refundAmount).toBe(6385);
    expect(r.irsFields.ReturnData['@attributes'].documentCnt).toBe(3);
    expect(r.atsAccepted).toBe(false);
    if (process.env.IRS_TEST_EXPORT_PATH)
      writeFileSync(process.env.IRS_TEST_EXPORT_PATH, JSON.stringify(r.irsFields), { mode: 0o600 });
    if (process.env.IRS_TEST_XML_PATH)
      writeFileSync(process.env.IRS_TEST_XML_PATH, serializeMefReturn2026(r.irsFields), {
        mode: 0o600,
      });
  });
  it('rejects a refund split that changes the calculated total', () => {
    expect(() =>
      mapFederalReturn2026({
        ...fixture,
        refundAllocations: [{ ...fixture.refundAllocations[0], amount: 123 }],
      }),
    ).toThrow('must equal');
  });
  it('requires recorded signature authorization', () => {
    expect(() =>
      mapFederalReturn2026({
        ...fixture,
        configuration: { ...fixture.configuration, authorizationRecorded: false },
      }),
    ).toThrow('authorization');
  });
  it('does not allow arbitrary documents to replace calculated 1040 amounts', () => {
    expect(() =>
      mapFederalReturn2026({ ...fixture, additionalIrsDocuments: { IRS1040: { TaxAmt: 0 } } }),
    ).toThrow('cannot be replaced');
  });
});
