import { describe, expect, it } from 'vitest';
import { taxReturnSourceDigest } from '@/lib/tax-software/security/return-digest';
import { taxPrivateProfileSchema } from '@/lib/tax-software/security/profile-schema';
describe('return signature authorization', () => {
  it('ignores document ordering and preserves changes in document contents', () => {
    const a = {
      w2: [
        { id: 'a', employerEin: '111111111', wages: 50000 },
        { id: 'b', wages: 10000 },
      ],
    };
    expect(taxReturnSourceDigest(a)).toBe(taxReturnSourceDigest({ w2: [...a.w2].reverse() }));
    expect(taxReturnSourceDigest(a)).not.toBe(
      taxReturnSourceDigest({ w2: [{ ...a.w2[0], employerEin: '222222222' }, a.w2[1]] }),
    );
  });
  it('rejects impossible dates even when they match the date format', () => {
    const fields = {
      profile: {
        firstName: 'Test',
        lastName: 'Taxpayer',
        ssn: '400001037',
        birthDate: '2000-02-30',
        address: { line1: '1 Main St', city: 'Austin', state: 'TX', zip: '78701' },
      },
      signature: {
        taxpayerPin: '12345',
        signatureDate: '2026-02-28',
        priorYearAgi: 0,
        authorizationRecorded: true,
      },
    };
    expect(taxPrivateProfileSchema.safeParse(fields).success).toBe(false);
    expect(
      taxPrivateProfileSchema.safeParse({
        ...fields,
        profile: { ...fields.profile, birthDate: '2000-02-29' },
      }).success,
    ).toBe(true);
    expect(
      taxPrivateProfileSchema.safeParse({
        ...fields,
        profile: { ...fields.profile, birthDate: '2000-02-29' },
        signature: { ...fields.signature, signatureDate: '2026-04-31' },
      }).success,
    ).toBe(false);
  });
});
