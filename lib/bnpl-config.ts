/**
 * BNPL (Buy Now, Pay Later) Provider Configuration
 *
 * Single source of truth for all BNPL provider names, labels, and display settings.
 * Import from here instead of hardcoding provider names in UI components.
 *
 * To add/remove a provider, update this file only.
 */

export interface BnplProvider {
  id: string;
  name: string;
  /** Tailwind classes for the pill badge */
  badgeBg: string;
  badgeText: string;
  /** Minimum order amount in dollars (0 = no minimum) */
  minAmount: number;
  /** Maximum order amount in dollars (0 = no maximum) */
  maxAmount: number;
  /** Short description shown in UI */
  description: string;
  /** Whether this provider is currently active */
  enabled: boolean;
}

export const BNPL_PROVIDERS: BnplProvider[] = [
  // --- Stripe-native (confirmed active on account) ---
  {
    id: 'klarna',
    name: 'Klarna',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-700',
    minAmount: 35,
    maxAmount: 10000,
    description: 'Pay over time',
    enabled: true,
  },
  {
    id: 'afterpay',
    name: 'Afterpay',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-700',
    minAmount: 35,
    maxAmount: 2000,
    description: '4 interest-free payments',
    enabled: true,
  },
  {
    id: 'zip',
    name: 'Zip',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
    minAmount: 35,
    maxAmount: 1500,
    description: 'Pay in 4 installments',
    enabled: true,
  },
  {
    id: 'cashapp',
    name: 'Cash App Pay',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-700',
    minAmount: 35,
    maxAmount: 0,
    description: 'Pay with Cash App',
    enabled: true,
  },
  {
    id: 'amazon_pay',
    name: 'Amazon Pay',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-700',
    minAmount: 35,
    maxAmount: 0,
    description: 'Pay with Amazon',
    enabled: true,
  },
  {
    id: 'us_bank_account',
    name: 'Bank Transfer (ACH)',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    minAmount: 35,
    maxAmount: 0,
    description: 'Direct bank transfer',
    enabled: true,
  },
  // --- Separate SDK flows ---
  {
    id: 'affirm',
    name: 'Affirm',
    badgeBg: 'bg-brand-blue-100',
    badgeText: 'text-brand-blue-700',
    minAmount: 50,
    maxAmount: 30000,
    description: 'Pay over 3–36 months',
    enabled: true, // uses /api/affirm/checkout SDK flow
  },
  {
    id: 'sezzle',
    name: 'Sezzle',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    minAmount: 35,
    maxAmount: 2500,
    description: '4 interest-free payments',
    enabled: true, // uses /api/sezzle/checkout SDK flow
  },
];

/** Active providers only */
export const ACTIVE_BNPL_PROVIDERS = BNPL_PROVIDERS.filter((p) => p.enabled);

/** Comma-separated list of active provider names for display text */
export const BNPL_PROVIDER_NAMES = ACTIVE_BNPL_PROVIDERS.map((p) => p.name).join(', ');

/** Short label: "Affirm, Sezzle & 3 more" */
export const BNPL_PROVIDER_SUMMARY = (() => {
  const names = ACTIVE_BNPL_PROVIDERS.map((p) => p.name);
  if (names.length <= 2) return names.join(' & ');
  return `${names[0]}, ${names[1]} & ${names.length - 2} more`;
})();

/** Label for checkout pages: "Affirm & Sezzle BNPL accepted" */
export const BNPL_CHECKOUT_LABEL = (() => {
  const names = ACTIVE_BNPL_PROVIDERS.slice(0, 2).map((p) => p.name);
  return `${names.join(' & ')} BNPL accepted`;
})();

/** Full sentence for descriptions */
export const BNPL_DESCRIPTION = `Split payments into installments with ${BNPL_PROVIDER_NAMES}. No hard credit check for most providers.`;

/** Get providers valid for a given dollar amount */
export function getProvidersForAmount(amount: number): BnplProvider[] {
  return ACTIVE_BNPL_PROVIDERS.filter(
    (p) => amount >= p.minAmount && (p.maxAmount === 0 || amount <= p.maxAmount)
  );
}

/** Check if BNPL is available for a given amount */
export function isBnplAvailable(amount: number): boolean {
  return getProvidersForAmount(amount).length > 0;
}
