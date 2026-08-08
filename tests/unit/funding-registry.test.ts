import { describe, expect, it } from 'vitest';

import { getStaticProgram, STATIC_PROGRAM_MAP } from '@/data/programs';
import {
  getProgramFundingTier,
  getVerifiedProgramFunding,
  VERIFIED_WORKFORCE_FUNDED_PROGRAMS,
} from '@/lib/programs/funding-registry';
import { sanitizePublicFundingText } from '@/lib/programs/public-funding-copy';

const EXPECTED = [
  'business-administration',
  'cdl-training',
  'financial-literacy',
  'hvac-technician',
];

describe('public funding registry', () => {
  it('contains exactly the four confirmed workforce-fundable programs', () => {
    expect(VERIFIED_WORKFORCE_FUNDED_PROGRAMS.map((program) => program.slug).sort()).toEqual(
      EXPECTED,
    );
  });

  it('canonicalizes the business alias and excludes Peer Recovery', () => {
    expect(getVerifiedProgramFunding('business')?.slug).toBe('business-administration');
    expect(getProgramFundingTier('business')).toBe('workforce-funded');
    expect(getProgramFundingTier('peer-recovery-specialist')).toBe('self-pay');
  });

  it('normalizes every other static program to self-pay', () => {
    for (const raw of STATIC_PROGRAM_MAP.values()) {
      const normalized = getStaticProgram(raw.slug);
      const canonical = getVerifiedProgramFunding(raw.slug)?.slug ?? raw.slug;
      expect(normalized?.isSelfPay).toBe(!EXPECTED.includes(canonical));
    }
  });

  it('removes unsupported public funding guarantees', () => {
    expect(
      sanitizePublicFundingText(
        'This program is free and fully funded through JRI. Learn practical career skills.',
        'peer-recovery-specialist',
      ),
    ).toBe('Learn practical career skills.');
  });
});
