import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

// The PayPal sync module pulls in server-only provider clients; stub the
// network clients so the duplicate-decision logic is testable in isolation.
// The resolver under test only touches the local database.
vi.mock('@/lib/integrations/paypal-client', () => ({
  payPalRequest: vi.fn(async () => ({ transactions: [] })),
}));
vi.mock('@/lib/integrations/quickbooks-client', () => ({
  escapeQuickBooksQuery: (value: string) => value,
  loadQuickBooksConfig: vi.fn(async () => ({})),
  quickBooksRequest: vi.fn(async () => ({})),
}));
vi.mock('server-only', () => ({}));

import { findInvoiceForScheduleWeek } from '@/lib/billing/apprentice-invoice-batch';
import { resolvePayPalPaymentTarget } from '@/lib/billing/paypal-payment-sync';

const source = (path: string) => readFileSync(path, 'utf8');

type InvoiceRow = Record<string, any>;

/** Minimal chainable stand-in for the Supabase query builder. */
class FakeQuery {
  private filters: Array<(row: InvoiceRow) => boolean> = [];
  private sortKey: string | null = null;
  private sortAsc = true;
  private limitCount: number | null = null;

  constructor(private rows: InvoiceRow[]) {}

  select(_columns: string) {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  gte(column: string, value: string) {
    this.filters.push((row) => String(row[column] ?? '') >= value);
    return this;
  }

  lte(column: string, value: string) {
    this.filters.push((row) => String(row[column] ?? '') <= value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.sortKey = column;
    this.sortAsc = options?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  maybeSingle() {
    let out = this.rows.filter((row) => this.filters.every((filter) => filter(row)));
    if (this.sortKey) {
      const key = this.sortKey;
      out = [...out].sort((a, b) => {
        const compared = String(a[key] ?? '').localeCompare(String(b[key] ?? ''));
        return this.sortAsc ? compared : -compared;
      });
    }
    if (this.limitCount !== null) out = out.slice(0, this.limitCount);
    return { data: out[0] ?? null, error: null };
  }
}

const fakeDb = (rows: InvoiceRow[]) => ({
  from: (_table: string) => new FakeQuery(rows),
});

const schedule = { id: 'schedule-1', amount_cents: 10000 };
// Monday 2026-11-23: billing week 2026-11-23 → 2026-11-29.
const payment = {
  paymentId: 'PAY-1',
  subscriptionId: 'I-SUB-1',
  paidAt: '2026-11-23T14:00:00.000Z',
  amountCents: 10000,
  currency: 'USD',
};

const fallbackRow = {
  id: 'inv-fallback',
  provider_invoice_id: 'qb-100',
  invoice_number: '2069-DP',
  total_cents: 10000,
  status: 'open',
  due_at: '2026-11-23',
  billing_schedule_id: 'schedule-1',
  idempotency_key: 'apprentice-fallback:schedule-1:2026-11-23',
  created_at: '2026-11-23T09:00:00.000Z',
};

describe('same-schedule / same-amount / same-week duplicate detector', () => {
  it('finds a fallback invoice by its deterministic idempotency key', async () => {
    const found = await findInvoiceForScheduleWeek(fakeDb([fallbackRow]) as any, {
      scheduleId: 'schedule-1',
      amountCents: 10000,
      weekStart: '2026-11-23',
    });
    expect(found?.id).toBe('inv-fallback');
  });

  it('finds a reconcile-created invoice by schedule and due date inside the week', async () => {
    const paypalRow = {
      id: 'inv-paypal',
      provider_invoice_id: 'qb-200',
      invoice_number: '2070-DP',
      total_cents: 10000,
      status: 'open',
      due_at: '2026-11-25',
      billing_schedule_id: 'schedule-1',
      idempotency_key: 'paypal:PAY-0',
      created_at: '2026-11-25T10:00:00.000Z',
    };
    const found = await findInvoiceForScheduleWeek(fakeDb([paypalRow]) as any, {
      scheduleId: 'schedule-1',
      amountCents: 10000,
      weekStart: '2026-11-23',
    });
    expect(found?.id).toBe('inv-paypal');
  });

  it('returns null when the only invoice is from a different week', async () => {
    const lastWeek = { ...fallbackRow, id: 'inv-old', due_at: '2026-11-16', idempotency_key: 'apprentice-fallback:schedule-1:2026-11-16' };
    const found = await findInvoiceForScheduleWeek(fakeDb([lastWeek]) as any, {
      scheduleId: 'schedule-1',
      amountCents: 10000,
      weekStart: '2026-11-23',
    });
    expect(found).toBeNull();
  });

  it('returns null when the amount does not match', async () => {
    const found = await findInvoiceForScheduleWeek(fakeDb([{ ...fallbackRow, total_cents: 7500 }]) as any, {
      scheduleId: 'schedule-1',
      amountCents: 10000,
      weekStart: '2026-11-23',
    });
    expect(found).toBeNull();
  });

  it('ignores failed invoice rows so a failed creation can be retried', async () => {
    const failed = { ...fallbackRow, status: 'failed' };
    const found = await findInvoiceForScheduleWeek(fakeDb([failed]) as any, {
      scheduleId: 'schedule-1',
      amountCents: 10000,
      weekStart: '2026-11-23',
    });
    expect(found).toBeNull();
  });
});

describe('reconcile is the single writer', () => {
  it('creates a new invoice when the week has no invoice at all', async () => {
    const target = await resolvePayPalPaymentTarget(fakeDb([]) as any, schedule, payment);
    expect(target).toEqual({ action: 'create' });
  });

  it('applies the payment to the week’s open fallback invoice instead of creating a second one', async () => {
    const target = await resolvePayPalPaymentTarget(fakeDb([fallbackRow]) as any, schedule, payment);
    expect(target.action).toBe('apply');
    if (target.action === 'apply') expect(target.invoice.id).toBe('inv-fallback');
  });

  it('applies the payment to an open invoice found by schedule and due date', async () => {
    const paypalRow = {
      id: 'inv-paypal',
      provider_invoice_id: 'qb-200',
      invoice_number: '2070-DP',
      total_cents: 10000,
      status: 'past_due',
      due_at: '2026-11-27',
      billing_schedule_id: 'schedule-1',
      idempotency_key: 'paypal:PAY-0',
      created_at: '2026-11-25T10:00:00.000Z',
    };
    const target = await resolvePayPalPaymentTarget(fakeDb([paypalRow]) as any, schedule, payment);
    expect(target.action).toBe('apply');
  });

  it('skips creating when the week’s invoice is already paid — the double payment needs a human refund review', async () => {
    const paid = { ...fallbackRow, status: 'paid' };
    const target = await resolvePayPalPaymentTarget(fakeDb([paid]) as any, schedule, payment);
    expect(target.action).toBe('skip-duplicate');
  });

  it('does not merge across amounts', async () => {
    const target = await resolvePayPalPaymentTarget(
      fakeDb([{ ...fallbackRow, total_cents: 7500 }]) as any,
      schedule,
      payment,
    );
    expect(target).toEqual({ action: 'create' });
  });

  it('defers instead of duplicating when the week’s invoice is still being created', async () => {
    const draft = { ...fallbackRow, status: 'draft' };
    await expect(
      resolvePayPalPaymentTarget(fakeDb([draft]) as any, schedule, payment),
    ).rejects.toThrow('cannot take the payment yet');
  });
});

describe('redesign wiring', () => {
  it('runs reconcile before the fallback in the Monday job', () => {
    const scheduler = source('.github/workflows/cron-scheduler.yml');
    expect(
      scheduler.indexOf('POST "$ADMIN_URL/api/cron/reconcile-apprentice-payments"'),
    ).toBeLessThan(
      scheduler.indexOf('POST "$ADMIN_URL/api/cron/generate-apprentice-invoices"'),
    );
  });

  it('makes the fallback consult the detector and PayPal before creating', () => {
    const fallback = source('apps/admin/app/api/cron/generate-apprentice-invoices/route.ts');
    expect(fallback).toContain('findInvoiceForScheduleWeek');
    expect(fallback).toContain('hasCompletedPayPalPaymentForWeek');
    expect(fallback).toContain("skipped: 'duplicate-invoice'");
    expect(fallback).toContain("skipped: 'paypal-payment-found'");
    expect(fallback).toContain('billingScheduleId: schedule.id');
  });

  it('makes reconcile report applied-to-existing and skipped duplicates', () => {
    const reconcile = source('apps/admin/app/api/cron/reconcile-apprentice-payments/route.ts');
    expect(reconcile).toContain('appliedToExisting');
    expect(reconcile).toContain('duplicatesSkipped');
    expect(reconcile).toContain('syncPayPalPaymentToQuickBooks');
  });

  it('records the schedule on every invoice the writers create', () => {
    const sync = source('lib/billing/paypal-payment-sync.ts');
    const provider = source('lib/billing/providers/quickbooks.ts');
    expect(sync).toContain('billingScheduleId: schedule.id');
    expect(provider).toContain('billing_schedule_id: input.billingScheduleId');
  });
});
