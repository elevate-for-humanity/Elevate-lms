import { describe, expect, it } from 'vitest';
import { nextInvoiceDate } from '@/lib/billing/schedule';

describe('billing schedule dates', () => {
  it('advances weekly schedules by seven days', () => expect(nextInvoiceDate('2026-09-11', 'weekly')).toBe('2026-09-18'));
  it('advances monthly schedules without local timezone drift', () => expect(nextInvoiceDate('2026-09-11', 'monthly')).toBe('2026-10-11'));
  it('advances annual schedules', () => expect(nextInvoiceDate('2026-09-11', 'annual')).toBe('2027-09-11'));
  it('clamps month-end schedules instead of skipping a month', () => expect(nextInvoiceDate('2026-01-31', 'monthly')).toBe('2026-02-28'));
});
