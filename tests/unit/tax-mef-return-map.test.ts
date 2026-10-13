import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
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
