import { describe, it, expect, vi, beforeEach } from 'vitest';

import { paidAccessGrantFields, grantPaidEnrollmentAccess } from '@/lib/enrollment/paid-access.mjs';
import { ensurePaidEnrollmentAccess, createOrUpdateEnrollment } from '@/lib/enrollment-service';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/enrollment/ensure-digital-binder', () => ({
  ensureDigitalBinder: vi.fn(async () => ({ binderId: 'binder-123', created: true })),
}));

const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ eq: mockEq, maybeSingle: mockMaybeSingle, single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockUpsert = vi.fn(() => ({ select: () => ({ single: mockSingle }) }));
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  upsert: mockUpsert,
  update: mockUpdate,
}));
const mockSupabase = { from: mockFrom };

vi.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabase,
}));

const NOW = '2026-11-23T20:00:00.000Z';

function selfPayRow(overrides: Record<string, unknown> = {}) {
  return {
    status: 'active',
    payment_status: 'paid',
    payment_reference: 'inv-123',
    funding_source: 'self_pay',
    funding_verified: false,
    eligibility_status: null,
    self_pay_application_verified_at: null,
    approved_at: null,
    approved_by: null,
    access_granted_at: null,
    access_status: null,
    revoked_at: null,
    cancelled_at: null,
    suspended_at: null,
    refunded_at: null,
    ...overrides,
  };
}

describe('paidAccessGrantFields', () => {
  it('grants a verified self-pay row the full patch', () => {
    const patch = paidAccessGrantFields(selfPayRow(), NOW);
    expect(patch).toEqual({
      access_status: 'active',
      access_granted_at: NOW,
      self_pay_application_verified_at: NOW,
    });
  });

  it('grants an already-approved row the minimal patch (no self-pay stamp)', () => {
    const patch = paidAccessGrantFields(
      selfPayRow({ approved_at: NOW, approved_by: 'admin-1' }),
      NOW,
    );
    expect(patch).toEqual({ access_status: 'active', access_granted_at: NOW });
  });

  it('preserves existing grant timestamps on retry (already-verified fields are left alone)', () => {
    const patch = paidAccessGrantFields(
      selfPayRow({
        access_granted_at: '2026-11-20T00:00:00.000Z',
        self_pay_application_verified_at: '2026-11-20T00:00:00.000Z',
      }),
      NOW,
    );
    // The row already carries both timestamps, so the minimal patch passes
    // the gate: the original grant time is preserved and the self-pay
    // timestamp is not overwritten.
    expect(patch).toEqual({
      access_status: 'active',
      access_granted_at: '2026-11-20T00:00:00.000Z',
    });
  });

  it('grants a verified state-funded row with manual approval', () => {
    const patch = paidAccessGrantFields(
      selfPayRow({
        funding_source: 'wioa',
        funding_verified: true,
        eligibility_status: 'eligible',
        payment_reference: null,
        approved_at: NOW,
        approved_by: 'admin-1',
      }),
      NOW,
    );
    expect(patch).toEqual({ access_status: 'active', access_granted_at: NOW });
  });

  it('refuses a deposit-paid row', () => {
    expect(paidAccessGrantFields(selfPayRow({ payment_status: 'deposit_paid' }), NOW)).toBeNull();
  });

  it('refuses an unpaid row with no payment reference', () => {
    expect(
      paidAccessGrantFields(selfPayRow({ payment_status: 'pending', payment_reference: null }), NOW),
    ).toBeNull();
  });

  it('refuses a self-pay row with paid status but no payment reference', () => {
    expect(paidAccessGrantFields(selfPayRow({ payment_reference: null }), NOW)).toBeNull();
  });

  it('refuses a state-funded row without manual approval', () => {
    expect(
      paidAccessGrantFields(
        selfPayRow({
          funding_source: 'wioa',
          funding_verified: true,
          eligibility_status: 'eligible',
          payment_reference: null,
        }),
        NOW,
      ),
    ).toBeNull();
  });

  it('refuses a revoked row', () => {
    expect(paidAccessGrantFields(selfPayRow({ revoked_at: NOW }), NOW)).toBeNull();
  });

  it('refuses a pending-status row', () => {
    expect(paidAccessGrantFields(selfPayRow({ status: 'pending' }), NOW)).toBeNull();
  });

  it('refuses a null row', () => {
    expect(paidAccessGrantFields(null as unknown as Record<string, unknown>, NOW)).toBeNull();
  });
});

describe('grantPaidEnrollmentAccess', () => {
  function fakeDb(row: Record<string, unknown> | null) {
    const updates: Array<Record<string, unknown>> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      maybeSingle: async () => ({ data: row, error: null }),
      update: (values: Record<string, unknown>) => {
        updates.push(values);
        return { eq: async () => ({ error: null }) };
      },
    };
    return { db: { from: () => builder }, updates };
  }

  it('stamps the access fields for a qualifying row and returns true', async () => {
    const { db, updates } = fakeDb(selfPayRow());
    expect(await grantPaidEnrollmentAccess(db as never, 'enr-1')).toBe(true);
    expect(updates).toHaveLength(1);
    expect(updates[0].access_status).toBe('active');
    expect(updates[0].access_granted_at).toBeTruthy();
    expect(updates[0].self_pay_application_verified_at).toBeTruthy();
  });

  it('does not update a non-qualifying row and returns false', async () => {
    const { db, updates } = fakeDb(selfPayRow({ payment_status: 'deposit_paid' }));
    expect(await grantPaidEnrollmentAccess(db as never, 'enr-1')).toBe(false);
    expect(updates).toHaveLength(0);
  });

  it('returns false when the row does not exist', async () => {
    const { db, updates } = fakeDb(null);
    expect(await grantPaidEnrollmentAccess(db as never, 'enr-1')).toBe(false);
    expect(updates).toHaveLength(0);
  });

  it('returns false without a lookup when there is no enrollment id', async () => {
    const { db, updates } = fakeDb(selfPayRow());
    expect(await grantPaidEnrollmentAccess(db as never, '')).toBe(false);
    expect(updates).toHaveLength(0);
  });
});

describe('ensurePaidEnrollmentAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockSingle.mockResolvedValue({ data: { id: 'enrollment-123' }, error: null });
  });

  it('stamps the access fields when the row qualifies', async () => {
    mockMaybeSingle.mockResolvedValue({ data: selfPayRow(), error: null });
    await ensurePaidEnrollmentAccess(mockSupabase as never, 'user-1', 'enr-1');
    const enrollmentUpdate = mockUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(enrollmentUpdate.status).toBe('active');
    expect(enrollmentUpdate.access_status).toBe('active');
    expect(enrollmentUpdate.access_granted_at).toBeTruthy();
    expect(enrollmentUpdate.self_pay_application_verified_at).toBeTruthy();
  });

  it('does not stamp access fields when the row cannot pass the gate', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: selfPayRow({ payment_status: 'deposit_paid' }),
      error: null,
    });
    await ensurePaidEnrollmentAccess(mockSupabase as never, 'user-1', 'enr-1');
    const enrollmentUpdate = mockUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(enrollmentUpdate.status).toBe('active');
    expect(enrollmentUpdate.access_status).toBeUndefined();
    expect(enrollmentUpdate.access_granted_at).toBeUndefined();
  });
});

describe('createOrUpdateEnrollment access fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockSingle.mockResolvedValue({ data: { id: 'enrollment-123' }, error: null });
  });

  it('records payment_reference and access fields for a verified paid self-pay enrollment', async () => {
    const result = await createOrUpdateEnrollment(mockSupabase as never, {
      userId: 'user-1',
      programId: 'program-1',
      fundingSource: 'self_pay',
      amountPaidCents: 60000,
      stripeCheckoutSessionId: 'cs_test_123',
    });
    expect(result.error).toBeUndefined();
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const payload = mockUpsert.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.payment_reference).toBe('cs_test_123');
    expect(payload.payment_status).toBe('paid');
    expect(payload.access_status).toBe('active');
    expect(payload.access_granted_at).toBeTruthy();
    expect(payload.self_pay_application_verified_at).toBeTruthy();
  });

  it('records the payment intent as payment_reference when there is no checkout session', async () => {
    await createOrUpdateEnrollment(mockSupabase as never, {
      userId: 'user-1',
      programId: 'program-1',
      fundingSource: 'self_pay',
      amountPaidCents: 60000,
      stripePaymentIntentId: 'pi_test_456',
    });
    const payload = mockUpsert.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.payment_reference).toBe('pi_test_456');
    expect(payload.access_status).toBe('active');
  });

  it('does not grant access for a deposit (deposit_paid is not a verified payment)', async () => {
    await createOrUpdateEnrollment(mockSupabase as never, {
      userId: 'user-1',
      programId: 'program-1',
      fundingSource: 'self_pay',
      isDeposit: true,
      amountPaidCents: 60000,
      stripeCheckoutSessionId: 'cs_test_789',
    });
    const payload = mockUpsert.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.payment_status).toBe('deposit_paid');
    expect(payload.access_status).toBeUndefined();
    expect(payload.self_pay_application_verified_at).toBeUndefined();
    // The reference is still recorded so a later paid fulfillment can grant.
    expect(payload.payment_reference).toBe('cs_test_789');
  });
});
