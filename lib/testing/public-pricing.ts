export type PublicTestingPricingState = 'verified' | 'quote';

/**
 * Public checkout must never charge provider-cost estimates.
 *
 * Only providers with an explicitly verified retail price belong in this map.
 * Provider pricing modules may still contain internal planning estimates; those
 * estimates are intentionally not treated as public checkout authority.
 */
const VERIFIED_PUBLIC_PRICING: Record<
  string,
  { state: 'verified'; verifiedOn: string; note: string }
> = {
  nha: {
    state: 'verified',
    verifiedOn: '2026-05-01',
    note: 'Owner-approved retail price: $149 NHA exam + $100 testing/administration.',
  },
};

export function getPublicTestingPricingState(providerKey: string): PublicTestingPricingState {
  return VERIFIED_PUBLIC_PRICING[providerKey]?.state ?? 'quote';
}

export function isPublicTestingPriceVerified(providerKey: string): boolean {
  return getPublicTestingPricingState(providerKey) === 'verified';
}

export function getPublicTestingPricingNote(providerKey: string): string {
  const verified = VERIFIED_PUBLIC_PRICING[providerKey];
  if (verified) return `${verified.note} Verified ${verified.verifiedOn}.`;
  return 'Current provider cost must be confirmed before payment. No estimated provider fee is charged online.';
}
