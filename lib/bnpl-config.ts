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
  /**
   * Stripe payment_method_types value for this provider.
   * Stripe uses different identifiers than our internal IDs
   * (e.g. "afterpay_clearpay" not "afterpay", "us_bank_account" not "bank").
   * null = not a Stripe-native method (uses separate SDK flow).
   */
  stripeMethodId: string | null;
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
  // --- Stripe-native (stripeMethodId = Stripe's payment_method_types value) ---
  {
    id: 'klarna',
    name: 'Klarna',
    stripeMethodId: 'klarna',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-700',
    minAmount: 35,
    maxAmount: 10000,
    description: 'Split into 4 interest-free payments or spread over 6–36 months. No hard credit check.',
    enabled: true,
  },
  {
    id: 'afterpay',
    name: 'Afterpay',
    stripeMethodId: 'afterpay_clearpay', // Stripe API name differs from display name
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-700',
    minAmount: 35,
    maxAmount: 2000,
    description: '4 interest-free payments every 2 weeks. Instant approval at checkout.',
    enabled: true,
  },
  {
    id: 'zip',
    name: 'Zip',
    stripeMethodId: 'zip',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
    minAmount: 35,
    maxAmount: 1500,
    description: 'Pay in 4 installments over 6 weeks. No interest on on-time payments.',
    enabled: true,
  },
  {
    id: 'cashapp',
    name: 'Cash App Pay',
    stripeMethodId: 'cashapp',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-700',
    minAmount: 35,
    maxAmount: 0,
    description: 'Pay directly from your Cash App balance or linked bank. Instant checkout.',
    enabled: true,
  },
  {
    id: 'amazon_pay',
    name: 'Amazon Pay',
    stripeMethodId: 'amazon_pay',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-700',
    minAmount: 35,
    maxAmount: 0,
    description: 'Use your Amazon account and saved payment methods to check out in seconds.',
    enabled: false, // not available on this Stripe account's Default config
  },
  {
    id: 'us_bank_account',
    name: 'Bank Transfer (ACH)',
    stripeMethodId: 'us_bank_account',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    minAmount: 35,
    maxAmount: 0,
    description: 'Direct bank transfer via ACH. No card required — link your bank account at checkout.',
    enabled: false, // not available on this Stripe account's Default config
  },
  // --- Separate SDK flows (stripeMethodId = null — not routed through Stripe) ---
  {
    id: 'affirm',
    name: 'Affirm',
    stripeMethodId: null, // uses /api/affirm/checkout SDK flow
    badgeBg: 'bg-brand-blue-100',
    badgeText: 'text-brand-blue-700',
    minAmount: 50,
    maxAmount: 30000,
    description: 'Monthly installment financing at 0–36% APR over 3–36 months. Subject to credit approval.',
    enabled: true,
  },
  {
    id: 'sezzle',
    name: 'Sezzle',
    stripeMethodId: null, // uses /api/sezzle/checkout SDK flow
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    minAmount: 35,
    maxAmount: 2500,
    description: '4 interest-free payments over 6 weeks. Quick approval, no hard credit check.',
    enabled: true,
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
    (p) => amount >= p.minAmount && (p.maxAmount === 0 || amount <= p.maxAmount),
  );
}

/** Check if BNPL is available for a given amount */
export function isBnplAvailable(amount: number): boolean {
  return getProvidersForAmount(amount).length > 0;
}

/**
 * Stripe payment_method_types array for all active Stripe-native BNPL providers.
 * Always includes 'card' as the base method.
 * Use this in stripe.checkout.sessions.create() instead of hardcoding provider names.
 *
 * Example: ['card', 'klarna', 'afterpay_clearpay', 'zip', 'cashapp', 'amazon_pay', 'us_bank_account']
 */
export const STRIPE_BNPL_PAYMENT_METHODS: string[] = [
  'card',
  ...ACTIVE_BNPL_PROVIDERS.filter((p) => p.stripeMethodId !== null).map(
    (p) => p.stripeMethodId as string,
  ),
];

/**
 * Stripe payment_method_types for providers valid for a given dollar amount.
 * Always includes 'card'.
 */
export function getStripeMethodsForAmount(amountDollars: number): string[] {
  return [
    'card',
    ...getProvidersForAmount(amountDollars)
      .filter((p) => p.stripeMethodId !== null)
      .map((p) => p.stripeMethodId as string),
  ];
}
