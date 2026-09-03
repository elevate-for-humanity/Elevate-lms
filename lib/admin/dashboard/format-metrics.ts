/**
 * Shared formatting for admin dashboard KPIs — avoids absurd MoM % and money display bugs.
 */

const MAX_DISPLAY_PCT = 99;
const MAX_PAYMENT_CENTS = 50_000_00; // $50k — flag likely bad apprenticeship rows

export function clampDisplayPercent(raw: number): number {
  if (!Number.isFinite(raw)) return 0;
  return Math.max(-MAX_DISPLAY_PCT, Math.min(MAX_DISPLAY_PCT, Math.round(raw)));
}

/** Month-over-month % with sane labels for stock metrics and zero baselines. */
export function monthOverMonthDelta(
  current: number,
  previous: number,
  options?: { stockMetric?: boolean },
): { delta: number; deltaLabel: string } {
  if (options?.stockMetric) {
    return {
      delta: 0,
      deltaLabel:
        current > 0 ? `${current.toLocaleString()} awaiting review` : 'Queue is clear',
    };
  }

  if (current === 0 && previous === 0) {
    return { delta: 0, deltaLabel: 'No change vs last month' };
  }
  if (previous === 0) {
    return {
      delta: 0,
      deltaLabel: current > 0 ? 'New activity this month (no prior-month baseline)' : 'No activity',
    };
  }

  const raw = Math.round(((current - previous) / previous) * 100);
  const clamped = clampDisplayPercent(raw);
  const sign = raw > 0 ? '+' : '';
  const label =
    Math.abs(raw) > MAX_DISPLAY_PCT
      ? `${sign}${raw}% vs last month`
      : `${sign}${clamped}% vs last month`;

  return { delta: clamped, deltaLabel: label };
}

export function formatCentsCompact(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}k`;
  return `$${dollars.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function isTestOrSuspiciousPayment(fields: {
  email?: string | null;
  label?: string | null;
  amountCents: number;
}): boolean {
  const text = [fields.email, fields.label].filter(Boolean).join(' ').toLowerCase();
  if (/\b(sample|test|demo|example|placeholder|verification)\b/.test(text)) return true;
  if (/@student\.elevate\.edu\b/.test(text)) return true;
  if (fields.amountCents <= 101) return true;
  if (fields.amountCents > MAX_PAYMENT_CENTS) return true;
  return false;
}

export function capCheckoutDollarsToCents(dollars: unknown): number {
  const d = Number(dollars ?? 0);
  if (!Number.isFinite(d) || d <= 0) return 0;
  if (d > 50_000) return 0;
  return Math.round(d * 100);
}
