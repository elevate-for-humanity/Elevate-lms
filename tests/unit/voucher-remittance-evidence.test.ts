import { describe, expect, it } from 'vitest';
import { getInitiatedRemittances } from '@/lib/admin/remittance-evidence';
const instruction = { kind: 'ach_initiated', currency: 'USD', processed_date: '2026-05-15', reference: 'fixture-trace', source_message_id: 'fixture-message', allocated_amount: 5000, batch_total: 10000, batch_invoice_count: 2 };
describe('voucher remittance evidence', () => {
  it('uses the allocated invoice amount without counting the whole batch twice', () => {
    expect(getInitiatedRemittances([instruction])).toEqual([{ processedDate: '2026-05-15', reference: 'fixture-trace', sourceMessageId: 'fixture-message', allocatedAmount: 5000, currency: 'USD' }]);
  });
  it('never produces a paid or settled status from an initiation notice', () => {
    const [result] = getInitiatedRemittances([{ ...instruction, settlement_confirmed: true, bank_account: 'private-extra-field' }]);
    expect(result).not.toHaveProperty('settlement_confirmed');
    expect(result).not.toHaveProperty('paid');
    expect(result).not.toHaveProperty('bank_account');
  });
  it('does not treat submission as payment evidence', () => expect(getInitiatedRemittances([{ ...instruction, kind: 'voucher_submitted' }])).toEqual([]));
  it('does not invent an allocation from the batch total', () => expect(getInitiatedRemittances([{ ...instruction, allocated_amount: undefined }])).toEqual([]));
  it.each([{ allocated_amount: -1 }, { allocated_amount: Number.NaN }, { processed_date: '2026-02-31' }, { source_message_id: '' }])('rejects incomplete or invalid evidence', difference => expect(getInitiatedRemittances([{ ...instruction, ...difference }])).toEqual([]));
});
