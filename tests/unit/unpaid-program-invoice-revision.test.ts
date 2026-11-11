import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  InvoiceTermsConflict,
  reviseUnpaidProgramInvoice,
  type TrackedProgramInvoice,
} from '@/lib/billing/revise-unpaid-program-invoice';
import type { ManualInvoiceInput } from '@/lib/billing/contracts';
const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  save: vi.fn(),
  saveResult: { data: { id: 'tracked' } as { id: string } | null, error: null },
}));
vi.mock('@/lib/integrations/quickbooks-client', () => ({
  loadQuickBooksConfig: async () => ({}),
  quickBooksRequest: mocks.request,
}));
const db = {
  from: () => {
    const q = {
      update: (row: unknown) => {
        mocks.save(row);
        return q;
      },
      eq: () => q,
      in: () => q,
      is: () => q,
      select: () => q,
      maybeSingle: async () => mocks.saveResult,
    };
    return q;
  },
} as unknown as SupabaseClient;
const invoice = () => ({
  Id: '799',
  SyncToken: '0',
  TotalAmt: 4980,
  Balance: 4980,
  CustomerRef: { value: '24' },
  InvoiceLink: 'https://example.test/invoice',
  Line: [
    {
      Id: '1',
      Amount: 4980,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: { ItemRef: { value: '12' } },
    },
  ],
});
const payload = {
  enrollment_id: 'enrollment',
  student_id: 'student',
  program_id: 'barber',
  required_amount_cents: 60000,
};
const stored = (): TrackedProgramInvoice => ({
  id: 'tracked',
  provider_invoice_id: '799',
  customer_external_key: 'user:student',
  customer_email: 'student@example.test',
  status: 'open',
  total_cents: 498000,
  payment_url: 'https://example.test/invoice',
  fulfillment_type: 'program_enrollment',
  fulfillment_payload: { ...payload, required_amount_cents: 498000 },
  provider_payload: invoice(),
});
const input = (): ManualInvoiceInput => ({
  allowUnpaidProgramRevision: true,
  idempotencyKey: 'program:enrollment',
  customer: { externalKey: 'user:student', displayName: 'Student', email: 'student@example.test' },
  lines: [{ canonicalKey: 'barber', name: 'Barber deposit', quantity: 1, unitAmountCents: 60000 }],
  dueDate: '2026-11-11',
  fulfillment: { type: 'program_enrollment', payload },
});
beforeEach(() => {
  mocks.request.mockReset();
  mocks.save.mockClear();
  mocks.saveResult.data = { id: 'tracked' };
  mocks.request
    .mockResolvedValueOnce({ Invoice: invoice() })
    .mockImplementationOnce(async (_db, _config, _path, options) => ({
      Invoice: {
        ...invoice(),
        SyncToken: '1',
        TotalAmt: 600,
        Balance: 600,
        PrivateNote: JSON.parse(options.body).PrivateNote,
      },
    }));
});
describe('explicit unpaid checkout revision', () => {
  it('revises the same owned invoice with the fresh SyncToken and tracks the deposit needed for the full application', async () => {
    const result = await reviseUnpaidProgramInvoice(db, stored(), input(), 60000);
    expect(result).toMatchObject({
      providerInvoiceId: '799',
      totalCents: 60000,
      paymentUrl: 'https://example.test/invoice',
    });
    const body = JSON.parse(mocks.request.mock.calls[1][3].body);
    expect(body).toMatchObject({
      Id: '799',
      SyncToken: '0',
      sparse: true,
      Line: [{ Id: '1', Amount: 600 }],
    });
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        total_cents: 60000,
        fulfillment_payload: expect.objectContaining({
          required_amount_cents: 60000,
          previous_required_amount_cents: 498000,
        }),
      }),
    );
  });
  it.each(['paid', 'part_paid', 'wrong_owner', 'wrong_program', 'no_consent', 'void'])(
    'refuses %s without modifying provider or ledger',
    async (situation) => {
      const row = stored();
      const request = input();
      const fresh = invoice();
      if (situation === 'paid') fresh.Balance = 0;
      if (situation === 'part_paid') fresh.Balance = 4380;
      if (situation === 'void') {
        fresh.Balance = 0;
        fresh.TotalAmt = 0;
      }
      if (situation === 'wrong_owner') row.customer_external_key = 'user:other';
      if (situation === 'wrong_program') row.fulfillment_payload.program_id = 'other';
      if (situation === 'no_consent') request.allowUnpaidProgramRevision = false;
      mocks.request.mockReset().mockResolvedValue({ Invoice: fresh });
      await expect(reviseUnpaidProgramInvoice(db, row, request, 60000)).rejects.toBeInstanceOf(
        InvoiceTermsConflict,
      );
      expect(mocks.request.mock.calls.every((call) => !call[3]?.method)).toBe(true);
      expect(mocks.save).not.toHaveBeenCalled();
    },
  );
  it('reconciles a retry even if the revised deposit was paid before a failed local write was recovered', async () => {
    let remote = { ...invoice(), PrivateNote: '' };
    mocks.request.mockReset().mockImplementation(async (_db, _config, _path, options) => {
      if (options?.method === 'POST') {
        const body = JSON.parse(options.body);
        remote = {
          ...remote,
          TotalAmt: 600,
          Balance: 600,
          SyncToken: '1',
          PrivateNote: body.PrivateNote,
        };
      }
      return { Invoice: remote };
    });
    mocks.saveResult.data = null;
    await expect(reviseUnpaidProgramInvoice(db, stored(), input(), 60000)).rejects.toThrow(
      'being reconciled',
    );
    remote.Balance = 0;
    mocks.saveResult.data = { id: 'tracked' };
    expect((await reviseUnpaidProgramInvoice(db, stored(), input(), 60000)).providerInvoiceId).toBe(
      '799',
    );
    expect(mocks.request.mock.calls.filter((call) => call[3]?.method === 'POST')).toHaveLength(1);
    expect(mocks.save).toHaveBeenCalledTimes(2);
  });
  it('fails closed when a payment webhook changes the ledger before reconciliation', async () => {
    mocks.saveResult.data = null;
    await expect(reviseUnpaidProgramInvoice(db, stored(), input(), 60000)).rejects.toThrow(
      'being reconciled',
    );
  });
  it('does not update the ledger when the provider rejects a stale SyncToken', async () => {
    mocks.request
      .mockReset()
      .mockResolvedValueOnce({ Invoice: invoice() })
      .mockRejectedValueOnce(new Error('Stale Object Error'));
    await expect(reviseUnpaidProgramInvoice(db, stored(), input(), 60000)).rejects.toBeInstanceOf(
      InvoiceTermsConflict,
    );
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
