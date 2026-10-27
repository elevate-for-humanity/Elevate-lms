import { describe, expect, it, vi } from 'vitest';
import { recordSchoolInvoiceOrder, schoolInvoiceSnapshot } from '@/lib/billing/school-invoice-order';

const payload = {
  program_id: 'fb36dbf1-db3c-4d34-adf9-3f98f397d371',
  program_holder_id: 'ac01769d-c1d9-496c-981e-f7963e6d0f48',
  amount_cents: 220000, enrollment_id: 'enrollment', student_id: 'student',
};

describe('school invoice settlement', () => {
  it('reserves $1,100 for the school and $1,100 for Elevate from CNA tuition', () => {
    const result = schoolInvoiceSnapshot(payload)!;
    expect(result.schoolAmountCents).toBe(110000);
    expect(result.elevateAmountCents).toBe(110000);
  });
  it('rejects underpayment and a different school assignment', () => {
    expect(() => schoolInvoiceSnapshot({ ...payload, amount_cents: 110000 })).toThrow();
    expect(() => schoolInvoiceSnapshot({ ...payload, program_holder_id: 'other' })).toThrow();
  });
  it('leaves unrelated programs on their existing payment workflow', () => {
    expect(schoolInvoiceSnapshot({ program_id: 'other' })).toBeNull();
  });
  it('does not create a school liability for an unpaid student invoice', async () => {
    const upsert = vi.fn();
    const query = { select: () => query, eq: () => query,
      maybeSingle: async () => ({ data: { status: 'open', total_cents: 220000 } }) };
    const db = { from: (table: string) => table === 'billing_invoices' ? query : { upsert } };
    await expect(recordSchoolInvoiceOrder(db, 'invoice', payload)).rejects.toThrow('confirmed full');
    expect(upsert).not.toHaveBeenCalled();
  });
  it('records confirmed payment without overwriting settlement state on retries', async () => {
    const upsert = vi.fn(async (_row: any, _options: any) => ({ error: null }));
    const query = { select: () => query, eq: () => query,
      maybeSingle: async () => ({ data: { status: 'paid', total_cents: 220000 } }) };
    const db = { from: (table: string) => table === 'billing_invoices' ? query : { upsert } };
    await recordSchoolInvoiceOrder(db, 'invoice', payload);
    expect(upsert.mock.calls[0][0]).not.toHaveProperty('settlement_status');
    expect(upsert.mock.calls[0][1]).toEqual({ onConflict: 'billing_invoice_id', ignoreDuplicates: true });
  });
});
