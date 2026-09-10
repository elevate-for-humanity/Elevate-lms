import { describe, expect, it } from 'vitest';
import { CDL_TRAINING } from '@/data/programs/cdl-training';
import { COSMETOLOGY } from '@/data/programs/cosmetology-apprenticeship';
import { CPR_FIRST_AID } from '@/data/programs/cpr-first-aid';
import { resolveProgramFundingStatus } from '@/lib/programs/funding-visibility';

describe('resolveProgramFundingStatus', () => {
  it('marks only the evidenced CDL record as workforce-fundable', () => {
    const status = resolveProgramFundingStatus(CDL_TRAINING);
    expect(status.isEtplListed).toBe(true);
    expect(status.isWioaFundable).toBe(false);
    expect(status.isWrgFundable).toBe(true);
    expect(status.showWorkforceFundingProcess).toBe(true);
    expect(status.fundingSourceLabels).toContain('Indiana ETPL');
  });

  it('does not show WIOA process for cosmetology (not ETPL)', () => {
    const status = resolveProgramFundingStatus(COSMETOLOGY);
    expect(status.isEtplListed).toBe(false);
    expect(status.showWorkforceFundingProcess).toBe(false);
    expect(status.isImpactFundable).toBe(true);
  });

  it('defaults short CPR program to self-pay messaging', () => {
    const status = resolveProgramFundingStatus(CPR_FIRST_AID);
    expect(status.showWorkforceFundingProcess).toBe(false);
    expect(status.fundabilityHeadline).toMatch(/self-pay/i);
  });
});
