import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// Shared mock state so tests can control Supabase responses
let mockExistingRow: { id: string; status: string } | null = null;
let mockUpsertResult: { data: { id: string } | null; error: any } = {
  data: { id: 'new-enrollment-id' },
  error: null,
};

const mockSingle = vi.fn(() => Promise.resolve({ data: mockExistingRow, error: null }));
const mockMaybeSingle = vi.fn(() => Promise.resolve({ data: mockExistingRow, error: null }));
const mockUpsertSelect = vi.fn(() => ({ single: vi.fn(() => Promise.resolve(mockUpsertResult)) }));
const mockUpsert = vi.fn(() => ({ select: mockUpsertSelect }));
const mockEq = vi.fn(() => ({ eq: mockEq, maybeSingle: mockMaybeSingle, single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect, upsert: mockUpsert }));

const mockSupabase = { from: mockFrom } as any;

describe('createOrUpdateEnrollment — status values', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistingRow = null;
    mockUpsertResult = { data: { id: 'new-enrollment-id' }, error: null };
    mockFrom.mockReturnValue({ select: mockSelect, upsert: mockUpsert });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle, single: mockSingle });
    mockMaybeSingle.mockResolvedValue({ data: mockExistingRow, error: null });
    mockUpsert.mockReturnValue({ select: mockUpsertSelect });
    mockUpsertSelect.mockReturnValue({ single: vi.fn(() => Promise.resolve(mockUpsertResult)) });
  });

  it('writes lowercase "active" status for a standard enrollment', async () => {
    const { createOrUpdateEnrollment } = await import('@/lib/enrollment-service');

    await createOrUpdateEnrollment(mockSupabase, {
      studentId: 'student-1',
      programSlug: 'hvac-technician',
      fundingSource: 'WIOA',
    });

    const upsertCall = mockUpsert.mock.calls[0][0];
    expect(upsertCall.status).toBe('active');
  });

  it('writes lowercase "deposit_paid" status for a deposit enrollment', async () => {
    const { createOrUpdateEnrollment } = await import('@/lib/enrollment-service');

    await createOrUpdateEnrollment(mockSupabase, {
      studentId: 'student-1',
      programSlug: 'hvac-technician',
      fundingSource: 'self_pay',
      isDeposit: true,
    });

    const upsertCall = mockUpsert.mock.calls[0][0];
    expect(upsertCall.status).toBe('deposit_paid');
  });

  it('writes lowercase "paid" payment_status when amount > 0', async () => {
    const { createOrUpdateEnrollment } = await import('@/lib/enrollment-service');

    await createOrUpdateEnrollment(mockSupabase, {
      studentId: 'student-1',
      programSlug: 'hvac-technician',
      fundingSource: 'self_pay',
      amountPaidCents: 50000,
    });

    const upsertCall = mockUpsert.mock.calls[0][0];
    expect(upsertCall.payment_status).toBe('paid');
  });

  it('writes lowercase "waived" payment_status when amount is 0', async () => {
    const { createOrUpdateEnrollment } = await import('@/lib/enrollment-service');

    await createOrUpdateEnrollment(mockSupabase, {
      studentId: 'student-1',
      programSlug: 'hvac-technician',
      fundingSource: 'WIOA',
      amountPaidCents: 0,
    });

    const upsertCall = mockUpsert.mock.calls[0][0];
    expect(upsertCall.payment_status).toBe('waived');
  });

  it('returns already_active without upserting when existing status is "active"', async () => {
    mockExistingRow = { id: 'existing-id', status: 'active' };
    mockMaybeSingle.mockResolvedValue({ data: mockExistingRow, error: null });

    const { createOrUpdateEnrollment } = await import('@/lib/enrollment-service');

    const result = await createOrUpdateEnrollment(mockSupabase, {
      studentId: 'student-1',
      programSlug: 'hvac-technician',
      fundingSource: 'WIOA',
    });

    expect(result.action).toBe('already_active');
    expect(result.id).toBe('existing-id');
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('returns already_active without upserting when existing status is "completed"', async () => {
    mockExistingRow = { id: 'existing-id', status: 'completed' };
    mockMaybeSingle.mockResolvedValue({ data: mockExistingRow, error: null });

    const { createOrUpdateEnrollment } = await import('@/lib/enrollment-service');

    const result = await createOrUpdateEnrollment(mockSupabase, {
      studentId: 'student-1',
      programSlug: 'hvac-technician',
      fundingSource: 'WIOA',
    });

    expect(result.action).toBe('already_active');
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('upserts when existing status is a non-terminal value', async () => {
    mockExistingRow = { id: 'existing-id', status: 'pending' };
    mockMaybeSingle.mockResolvedValue({ data: mockExistingRow, error: null });

    const { createOrUpdateEnrollment } = await import('@/lib/enrollment-service');

    const result = await createOrUpdateEnrollment(mockSupabase, {
      studentId: 'student-1',
      programSlug: 'hvac-technician',
      fundingSource: 'WIOA',
    });

    expect(result.action).toBe('updated');
    expect(mockUpsert).toHaveBeenCalled();
  });
});
