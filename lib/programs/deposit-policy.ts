import { BARBER_PRICING } from '@/lib/programs/pricing';

/**
 * Canonical minimum-deposit resolver used by public pricing and checkout.
 *
 * Program-specific legal/business rules belong in their source-of-truth pricing
 * module. Generic programs may use an explicitly configured deposit; only when
 * neither exists do we use the generic 10%/$100 floor.
 */
export function getMinimumDepositCents({
  slug,
  tuitionCents,
  configuredDepositCents = 0,
}: {
  slug: string;
  tuitionCents: number;
  configuredDepositCents?: number;
}): number {
  const safeTuition = Math.max(0, Math.round(tuitionCents));
  if (!safeTuition) return 0;

  if (slug === 'barber-apprenticeship') {
    const barberMinimum = Math.round(BARBER_PRICING.minDownPayment * 100);
    return Math.min(safeTuition, Math.max(barberMinimum, Math.round(configuredDepositCents || 0)));
  }

  const configured = Math.max(0, Math.round(configuredDepositCents || 0));
  if (configured > 0) return Math.min(safeTuition, configured);

  return Math.min(safeTuition, Math.max(10000, Math.round(safeTuition * 0.1)));
}
