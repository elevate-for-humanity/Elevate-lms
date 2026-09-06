import { describe, expect, it } from 'vitest';
import {
  evaluateIdentityClockEligibility,
  IDENTITY_TIMECLOCK_ENFORCEMENT_AT,
} from '../../lib/identity/clock-eligibility';

const approvedPart = (identity_part: string, id_type = 'drivers_license') => ({
  document_type: 'photo_id',
  status: 'approved',
  verification_status: 'verified',
  verified: true,
  metadata: { identity_part, id_type },
});

describe('identity timeclock eligibility', () => {
  it('preserves access for the transition cohort', () => {
    expect(evaluateIdentityClockEligibility('2026-09-06T23:59:59.000Z', [])).toEqual({
      eligible: true,
      basis: 'transition_cohort',
    });
  });

  it('requires all three approved identity parts for new driver licenses', () => {
    expect(evaluateIdentityClockEligibility(IDENTITY_TIMECLOCK_ENFORCEMENT_AT, [
      approvedPart('front'), approvedPart('back'), approvedPart('selfie'),
    ])).toEqual({ eligible: true, basis: 'secure_identity_verified' });
  });

  it('accepts a passport front plus selfie', () => {
    expect(evaluateIdentityClockEligibility(IDENTITY_TIMECLOCK_ENFORCEMENT_AT, [
      approvedPart('front', 'passport'), approvedPart('selfie', 'passport'),
    ])).toEqual({ eligible: true, basis: 'secure_identity_verified' });
  });

  it('does not accept an incomplete or pending package for a new apprentice', () => {
    expect(evaluateIdentityClockEligibility(IDENTITY_TIMECLOCK_ENFORCEMENT_AT, [
      approvedPart('front'),
      { ...approvedPart('selfie'), status: 'pending', verification_status: 'pending', verified: false },
    ])).toEqual({ eligible: false, basis: 'identity_required' });
  });
});
