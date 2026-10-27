// @vitest-environment node
import { it, expect } from 'vitest';
import { loadTaxCheckoutOffer } from '@/lib/tax-software/server/checkout-offer';
import { taxReturnSourceDigest } from '@/lib/tax-software/security/return-digest';
import type { createClient } from '@/lib/supabase/server';
type Db = Awaited<ReturnType<typeof createClient>>;
function sourceDb({ changed = false, failing = false, found = true } = {}) {
  const w2 = [{ wages: 10000, federal_withholding: 2500 }],
    scheduleC = [{ net_profit: 10000 }];
  const digest = taxReturnSourceDigest({
    filingStatus: 'single',
    supportingDocuments: {},
    extra: {},
    w2,
    income1099: [],
    scheduleC,
    itemized: null,
  });
  const filters: [string, unknown][] = [];
  const record = {
    id: 'return-1',
    tax_year: 2026,
    filing_status: 'single',
    status: 'in_progress',
    updated_at: 'stamp',
    return_json: {
      interview: { answers: { hasSelfEmployment: false } },
      calculation: { sourceDigest: changed ? 'old' : digest, refundAmount: 99999999 },
    },
  };
  const db = {
    from: (table: string) => {
      const result = {
        data:
          table === 'tax_returns'
            ? found
              ? record
              : null
            : table === 'tax_w2_income'
              ? w2
              : table === 'tax_schedule_c'
                ? scheduleC
                : table === 'tax_itemized_deductions'
                  ? null
                  : [],
        error: failing && table === 'tax_w2_income' ? { message: 'source unavailable' } : null,
      };
      const q = {
        select: () => q,
        eq: (key: string, value: unknown) => {
          filters.push([key, value]);
          return q;
        },
        maybeSingle: async () => result,
        then: (resolve: (r: typeof result) => unknown) => Promise.resolve(result).then(resolve),
      };
      return q;
    },
  } as unknown as Db;
  return { db, filters };
}
it('derives the business fee from canonical records despite an omitted interview answer', async () => {
  const { db, filters } = sourceDb();
  const offer = await loadTaxCheckoutOffer(db, 'return-1', 'owner-1', null);
  expect(offer!.options.upfrontAmountCents).toBe(5000);
  expect(offer!.options.federalRefundCents).not.toBe(9999999900);
  expect(filters).toContainEqual(['created_by_user_id', 'owner-1']);
  expect(filters).toContainEqual(['service_type', 'self_file']);
});
it('refuses a checkout when the saved source authorization is stale', async () => {
  await expect(
    loadTaxCheckoutOffer(sourceDb({ changed: true }).db, 'return-1', 'owner-1', null),
  ).rejects.toThrow('RECALCULATE');
});
it('does not replace an unreadable income source with a zero refund', async () => {
  await expect(
    loadTaxCheckoutOffer(sourceDb({ failing: true }).db, 'return-1', 'owner-1', null),
  ).rejects.toThrow('SOURCE_READ_FAILED');
});
it('returns no offer for a return outside the owner query', async () => {
  expect(
    await loadTaxCheckoutOffer(sourceDb({ found: false }).db, 'return-1', 'owner-1', null),
  ).toBeNull();
});
