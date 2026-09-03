import { describe, expect, it } from 'vitest';

import { getStaticProgram, STATIC_PROGRAM_MAP } from '@/data/programs';
import {
  getProgramFundingTier,
  getVerifiedProgramFunding,
  VERIFIED_WORKFORCE_FUNDED_PROGRAMS,
} from '@/lib/programs/funding-registry';
import { sanitizePublicFundingText } from '@/lib/programs/public-funding-copy';

const EXPECTED = [
  'business',
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

  it('canonicalizes the legacy business-administration alias and excludes Peer Recovery', () => {
    expect(getVerifiedProgramFunding('business')?.slug).toBe('business');
    expect(getVerifiedProgramFunding('business-administration')?.slug).toBe('business');
    expect(getProgramFundingTier('business')).toBe('workforce-funded');
    expect(getProgramFundingTier('business-administration')).toBe('workforce-funded');
    expect(getProgramFundingTier('peer-recovery-specialist')).toBe('self-pay');
  });

  it('normalizes every other static program to self-pay', () => {
    for (const raw of STATIC_PROGRAM_MAP.values()) {
      const normalized = getStaticProgram(raw.slug);
      const canonical = getVerifiedProgramFunding(raw.slug)?.slug ?? raw.slug;
      expect(normalized?.isSelfPay).toBe(!EXPECTED.includes(canonical));
      if (!EXPECTED.includes(canonical)) {
        expect(normalized?.fundingOptions).toEqual(['self_pay']);
        expect(normalized?.fundingStatement).not.toMatch(/WIOA|Workforce Ready Grant|WRG/);
      }
    }
  });

  it('keeps WRG copy limited to CDL and HVAC', () => {
    expect(getStaticProgram('business-administration')?.fundingStatement).not.toMatch(
      /Workforce Ready Grant|WRG/,
    );
    expect(getStaticProgram('cdl-training')?.fundingStatement).toMatch(/Workforce Ready Grant/);
    expect(getStaticProgram('hvac-technician')?.fundingStatement).toMatch(/Workforce Ready Grant/);
  });

  it('removes unsupported public funding guarantees', () => {
    expect(
      sanitizePublicFundingText(
        'This program is free and fully funded through JRI. Learn practical career skills.',
        'peer-recovery-specialist',
      ),
    ).toBe('Learn practical career skills.');

    expect(
      sanitizePublicFundingText(
        'WIOA covers exam and DOT physical. Safety training is included.',
        'cdl-training',
      ),
    ).toBe('Safety training is included.');

    expect(
      sanitizePublicFundingText(
        'Workforce Ready Grant eligible — $0 for most. EPA 608 exam preparation is included.',
        'hvac-technician',
      ),
    ).toBe('EPA 608 exam preparation is included.');
  });
});
