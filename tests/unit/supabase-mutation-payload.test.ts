import { describe, expect, it } from 'vitest';
import { topLevelObjectKeys } from '../../scripts/lib/supabase-mutation-payload';

function keys(source: string) {
  return topLevelObjectKeys(source, source.indexOf('{'));
}

describe('Supabase mutation payload column scanner', () => {
  it('does not report JSON keys within a conditional spread as database columns', () => {
    const payload = `{
      remaining_invoices: remaining,
      ...(capped ? { fulfillment_payload: {
        ...schedule.fulfillment_payload,
        remaining_tuition_cents: balanceAfterInvoice,
      } } : {}),
      status: completed ? 'completed' : 'active',
      next_invoice_date: completed ? schedule.next_invoice_date : nextInvoiceDate(schedule.next_invoice_date, schedule.cadence),
      updated_at: new Date().toISOString(),
    }`;
    expect(keys(payload)).toEqual([
      'remaining_invoices', 'status', 'next_invoice_date', 'updated_at',
    ]);
  });

  it('still finds genuinely invalid top-level mutation keys', () => {
    expect(keys('{ amount_cents: 500, remaining_tuition_cents: 125, status: "active" }'))
      .toEqual(['amount_cents', 'remaining_tuition_cents', 'status']);
  });

  it('does not flatten nested JSON payloads into mutation columns', () => {
    expect(keys('{ fulfillment_payload: { note: "a,b", remaining_tuition_cents: 100 }, status: "active" }'))
      .toEqual(['fulfillment_payload', 'status']);
  });

  it('skips nested commas, parentheses and object spreads without hiding later keys', () => {
    const payload = `{
      id: "example",
      ...((flag && { first: 1, second: { deeper: 2, deeperStill: 3 } }) || { fallback: true }),
      updated_at: now,
      invalid_top_level: true,
    }`;
    expect(keys(payload)).toEqual(['id', 'updated_at', 'invalid_top_level']);
  });

  it('does not misread ternary expressions or comments as new columns', () => {
    const payload = `{
      state: problem ? { field: 1, other: 2 } : { field: 3 },
      // bogus_column: 123
      status: "active",
    }`;
    expect(keys(payload)).toEqual(['state', 'status']);
  });
});
