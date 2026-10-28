import { expect, it } from 'vitest';
import { paymentAddendum } from '@/lib/program-holder/payment-addendum';
const terms = { title: 'Payment addendum', total_cents: 120000, start_cents: 60000,
  completion_cents: 60000, paragraphs: ['Agreed payment terms'], checklist: ['Verified completion'] };
it('binds acceptance to the holder, amounts, full terms, and checklist', () => {
  const version = paymentAddendum({ payment_addendum: terms }, 'holder-a')!.version;
  for (const [holder, changes] of [
    ['holder-b', {}], ['holder-a', { paragraphs: ['Changed terms'] }],
    ['holder-a', { checklist: ['Different release conditions'] }],
    ['holder-a', { start_cents: 50000, completion_cents: 70000 }],
  ] as const) expect(paymentAddendum({ payment_addendum: { ...terms, ...changes } }, holder)!.version).not.toBe(version);
});
it('rejects incomplete terms and inconsistent installment totals', () => {
  expect(paymentAddendum({}, 'holder')).toBeNull();
  expect(paymentAddendum({ payment_addendum: { ...terms, completion_cents: 75000 } }, 'holder')).toBeNull();
  expect(paymentAddendum({ payment_addendum: { ...terms, paragraphs: [] } }, 'holder')).toBeNull();
});
