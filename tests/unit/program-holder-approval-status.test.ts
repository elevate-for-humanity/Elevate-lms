import { expect, it } from 'vitest';
import { isApprovedProgramHolderStatus } from '@/lib/program-holder/onboarding-status';

it('treats approved, active, and approved_pending_mou as approved when approved_at is set', () => {
  for (const status of ['approved', 'active', 'approved_pending_mou']) {
    expect(isApprovedProgramHolderStatus(status, '2026-10-28T00:00:00Z')).toBe(true);
  }
});

it('treats approved_pending_mou as approved — it means approved, only the MOU signature is outstanding', () => {
  // This is the Nicole Newton case: the approve script sets approved_pending_mou,
  // and the old Compliance check only accepted active/approved, so her
  // "Program-holder approval" showed as outstanding even though she was approved.
  expect(isApprovedProgramHolderStatus('approved_pending_mou', '2026-10-28T00:00:00Z')).toBe(true);
});

it('does not treat a holder as approved without an approval timestamp', () => {
  expect(isApprovedProgramHolderStatus('approved_pending_mou', null)).toBe(false);
  expect(isApprovedProgramHolderStatus('approved', null)).toBe(false);
  expect(isApprovedProgramHolderStatus('approved', '')).toBe(false);
});

it('does not treat pending, rejected, or missing statuses as approved', () => {
  for (const status of ['pending', 'under_review', 'rejected', null, undefined, '']) {
    expect(isApprovedProgramHolderStatus(status, '2026-10-28T00:00:00Z')).toBe(false);
  }
});
