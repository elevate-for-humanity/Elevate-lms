import { afterEach, expect, it, vi } from 'vitest';
import { createReferralPreview, verifyReferralPreview } from '@/lib/program-holder/referral-preview';

const batch = {
  actorId: 'reviewer', holderId: 'holder', programId: 'cna', limit: 2, applicationIds: ['first', 'second'],
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

it('allows only the exact server-previewed batch for the same reviewer and controls', () => {
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-only-preview-key');
  const token = createReferralPreview(batch);
  expect(verifyReferralPreview(token, batch)).toBe(true);
  expect(verifyReferralPreview(token, { ...batch, actorId: 'another-reviewer' })).toBe(false);
  expect(verifyReferralPreview(token, { ...batch, programId: 'another-program' })).toBe(false);
  expect(verifyReferralPreview(token, { ...batch, limit: 3 })).toBe(false);
  expect(verifyReferralPreview(token, { ...batch, applicationIds: ['first', 'different'] })).toBe(false);
});

it('requires a new preview after expiry', () => {
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-only-preview-key');
  vi.useFakeTimers();
  const token = createReferralPreview(batch);
  vi.advanceTimersByTime(10 * 60 * 1000);
  expect(verifyReferralPreview(token, batch)).toBe(false);
});
