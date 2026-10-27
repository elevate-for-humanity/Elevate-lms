export const MICROCOURSE_MARKUP_BPS = 5000;

export function retailPriceCents(providerCostCents: number): number {
  if (!Number.isSafeInteger(providerCostCents) || providerCostCents <= 0) {
    throw new Error('Provider cost must be a positive integer');
  }
  return Math.ceil((providerCostCents * (10_000 + MICROCOURSE_MARKUP_BPS)) / 10_000);
}

export function formatMoney(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function assertStripePriceMatches(
  price: { active: boolean; currency: string; unit_amount: number | null },
  expectedCents: number,
  currency: string,
): void {
  if (!price.active || price.currency !== currency || price.unit_amount !== expectedCents) {
    throw new Error('Stripe price does not match the active microcourse catalog');
  }
}
