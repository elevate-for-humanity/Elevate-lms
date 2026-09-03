/**
 * A: Referral status machine + confirmation type logic
 *
 * Extracted from:
 *   supabase/migrations/20260626000002_agency_referral_confirmations.sql
 *   app/api/admin/referrals/confirm/route.ts
 *   app/admin/referrals/ReferralConfirmButton.tsx
 */

import { describe, it, expect } from 'vitest';

// ── Types (mirrored from route) ───────────────────────────────────────────────

type ReferralStatus =
  | 'referred'
  | 'intake_started'
  | 'enrolled'
  | 'active'
  | 'completed'
  | 'withdrawn'
  | 'cancelled';

type ConfirmationType =
  | 'receipt'
  | 'enrollment'
  | 'attendance'
  | 'completion'
  | 'placement'
  | 'no_show'
  | 'declined'
  | 'unable_to_reach';

// ── Logic extracted from the DB trigger sync_referral_acknowledgment ─────────

function advanceReferralStatus(
  current: ReferralStatus,
  confirmationType: ConfirmationType,
): ReferralStatus {
  const terminalStatuses: ReferralStatus[] = ['completed', 'withdrawn', 'cancelled'];

  switch (confirmationType) {
    case 'enrollment':
      if (['referred', 'intake_started'].includes(current)) return 'enrolled';
      return current;
    case 'completion':
      if (!terminalStatuses.includes(current)) return 'completed';
      return current;
    case 'no_show':
      if (!terminalStatuses.includes(current)) return 'withdrawn';
      return current;
    case 'declined':
      if (!terminalStatuses.includes(current)) return 'cancelled';
      return current;
    // receipt, attendance, placement, unable_to_reach don't change status
    default:
      return current;
  }
}

// ── Logic extracted from route validation ────────────────────────────────────

const VALID_CONFIRMATION_TYPES: ConfirmationType[] = [
  'receipt', 'enrollment', 'attendance', 'completion',
  'placement', 'no_show', 'declined', 'unable_to_reach',
];

const VALID_AGENCY_TYPES = [
  'american_job_center', 'workforce_board', 'vocational_rehabilitation',
  'wioa', 'jri', 'snap_et', 'fssa', 'other',
];

const VALID_REFERRAL_STATUSES: ReferralStatus[] = [
  'referred', 'intake_started', 'enrolled', 'active',
  'completed', 'withdrawn', 'cancelled',
];

function validateConfirmationRequest(body: {
  referral_id?: string;
  confirmation_type?: string;
  notes?: string;
}): { valid: boolean; error?: string } {
  if (!body.referral_id) return { valid: false, error: 'referral_id is required' };
  if (!body.confirmation_type || !VALID_CONFIRMATION_TYPES.includes(body.confirmation_type as ConfirmationType)) {
    return { valid: false, error: `Invalid confirmation_type: ${body.confirmation_type}` };
  }
  if (!body.notes?.trim()) {
    return { valid: false, error: 'Case notes are required for audit compliance' };
  }
  return { valid: true };
}

// ── Logic extracted from ReferralConfirmButton ────────────────────────────────

function isDoneStatus(status: ReferralStatus): boolean {
  return status === 'completed' || status === 'cancelled';
}

function buttonLabel(partnerAcknowledged: boolean, status: ReferralStatus): string {
  if (isDoneStatus(status)) return 'disabled';
  return partnerAcknowledged ? 'Log update' : 'Log confirmation';
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Referral status machine', () => {
  describe('advanceReferralStatus', () => {
    it('enrollment confirmation advances referred → enrolled', () => {
      expect(advanceReferralStatus('referred', 'enrollment')).toBe('enrolled');
    });

    it('enrollment confirmation advances intake_started → enrolled', () => {
      expect(advanceReferralStatus('intake_started', 'enrollment')).toBe('enrolled');
    });

    it('enrollment confirmation does NOT advance already-enrolled', () => {
      expect(advanceReferralStatus('enrolled', 'enrollment')).toBe('enrolled');
    });

    it('completion advances any non-terminal status → completed', () => {
      expect(advanceReferralStatus('enrolled', 'completion')).toBe('completed');
      expect(advanceReferralStatus('active', 'completion')).toBe('completed');
      expect(advanceReferralStatus('referred', 'completion')).toBe('completed');
    });

    it('completion does NOT regress a terminal status', () => {
      expect(advanceReferralStatus('cancelled', 'completion')).toBe('cancelled');
      expect(advanceReferralStatus('withdrawn', 'completion')).toBe('withdrawn');
    });

    it('no_show advances to withdrawn', () => {
      expect(advanceReferralStatus('referred', 'no_show')).toBe('withdrawn');
      expect(advanceReferralStatus('enrolled', 'no_show')).toBe('withdrawn');
    });

    it('no_show does NOT change already-terminal status', () => {
      expect(advanceReferralStatus('completed', 'no_show')).toBe('completed');
    });

    it('declined advances to cancelled', () => {
      expect(advanceReferralStatus('referred', 'declined')).toBe('cancelled');
    });

    it('receipt does not change status', () => {
      expect(advanceReferralStatus('referred', 'receipt')).toBe('referred');
      expect(advanceReferralStatus('enrolled', 'receipt')).toBe('enrolled');
    });

    it('attendance does not change status', () => {
      expect(advanceReferralStatus('active', 'attendance')).toBe('active');
    });

    it('placement does not change status', () => {
      expect(advanceReferralStatus('completed', 'placement')).toBe('completed');
    });

    it('unable_to_reach does not change status', () => {
      expect(advanceReferralStatus('referred', 'unable_to_reach')).toBe('referred');
    });
  });

  describe('validateConfirmationRequest', () => {
    it('rejects missing referral_id', () => {
      const r = validateConfirmationRequest({ confirmation_type: 'receipt', notes: 'ok' });
      expect(r.valid).toBe(false);
      expect(r.error).toMatch(/referral_id/);
    });

    it('rejects invalid confirmation_type', () => {
      const r = validateConfirmationRequest({ referral_id: 'abc', confirmation_type: 'bogus', notes: 'ok' });
      expect(r.valid).toBe(false);
      expect(r.error).toMatch(/Invalid confirmation_type/);
    });

    it('rejects empty notes', () => {
      const r = validateConfirmationRequest({ referral_id: 'abc', confirmation_type: 'receipt', notes: '   ' });
      expect(r.valid).toBe(false);
      expect(r.error).toMatch(/Case notes/);
    });

    it('rejects missing notes', () => {
      const r = validateConfirmationRequest({ referral_id: 'abc', confirmation_type: 'receipt' });
      expect(r.valid).toBe(false);
      expect(r.error).toMatch(/Case notes/);
    });

    it('accepts a valid request', () => {
      const r = validateConfirmationRequest({
        referral_id: 'abc-123',
        confirmation_type: 'enrollment',
        notes: 'Spoke with case manager, confirmed enrollment.',
      });
      expect(r.valid).toBe(true);
      expect(r.error).toBeUndefined();
    });

    it('accepts all valid confirmation types', () => {
      for (const type of VALID_CONFIRMATION_TYPES) {
        const r = validateConfirmationRequest({ referral_id: 'x', confirmation_type: type, notes: 'note' });
        expect(r.valid).toBe(true);
      }
    });
  });

  describe('Agency type enum', () => {
    it('contains all required FSSA/WIOA agency types', () => {
      expect(VALID_AGENCY_TYPES).toContain('fssa');
      expect(VALID_AGENCY_TYPES).toContain('wioa');
      expect(VALID_AGENCY_TYPES).toContain('snap_et');
      expect(VALID_AGENCY_TYPES).toContain('american_job_center');
    });
  });

  describe('Referral status enum completeness', () => {
    it('covers the full lifecycle', () => {
      expect(VALID_REFERRAL_STATUSES).toContain('referred');
      expect(VALID_REFERRAL_STATUSES).toContain('enrolled');
      expect(VALID_REFERRAL_STATUSES).toContain('completed');
      expect(VALID_REFERRAL_STATUSES).toContain('withdrawn');
      expect(VALID_REFERRAL_STATUSES).toContain('cancelled');
    });
  });

  describe('Button label logic', () => {
    it('shows Log confirmation when partner has not acknowledged', () => {
      expect(buttonLabel(false, 'referred')).toBe('Log confirmation');
    });

    it('shows Log update when partner has acknowledged', () => {
      expect(buttonLabel(true, 'referred')).toBe('Log update');
    });

    it('disables button for completed status', () => {
      expect(buttonLabel(true, 'completed')).toBe('disabled');
    });

    it('disables button for cancelled status', () => {
      expect(buttonLabel(false, 'cancelled')).toBe('disabled');
    });

    it('does not disable for active non-terminal statuses', () => {
      const nonTerminal: ReferralStatus[] = ['referred', 'intake_started', 'enrolled', 'active', 'withdrawn'];
      for (const s of nonTerminal) {
        expect(isDoneStatus(s)).toBe(s === 'withdrawn' ? false : false);
      }
      expect(isDoneStatus('completed')).toBe(true);
      expect(isDoneStatus('cancelled')).toBe(true);
    });
  });
});
