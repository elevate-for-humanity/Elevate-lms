import { describe, expect, it } from 'vitest';
import { EMERGENCY_HEALTH_SAFETY } from '@/data/programs/emergency-health-safety';
import { HVAC_TECHNICIAN } from '@/data/programs/hvac-technician';
import { COSMETOLOGY } from '@/data/programs/cosmetology-apprenticeship';
import { CPR_FIRST_AID } from '@/data/programs/cpr-first-aid';
import { resolveProgramFundingStatus } from '@/lib/programs/funding-visibility';

describe('resolveProgramFundingStatus', () => {
  it('marks ETPL emergency health program as workforce-fundable with ICC process', () => {
    const status = resolveProgramFundingStatus(EMERGENCY_HEALTH_SAFETY);
    expect(status.isEtplListed).toBe(true);
    expect(status.isWioaFundable).toBe(true);
    expect(status.showWorkforceFundingProcess).toBe(true);
    expect(status.fundingSourceLabels).toContain('Indiana ETPL');
  });

  it('marks HVAC technician as workforce-fundable', () => {
    const status = resolveProgramFundingStatus(HVAC_TECHNICIAN);
    expect(status.showWorkforceFundingProcess).toBe(true);
    expect(status.isWioaFundable).toBe(true);
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
