/**
 * Flexible payment provider configuration.
 *
 * BNPL/financing providers and direct payment methods are intentionally
 * classified separately so marketing copy does not describe Cash App Pay or
 * other direct-payment rails as financing.
 */

export type PaymentProviderCategory = 'bnpl' | 'payment';

export interface BnplProvider {
  id: string;
  name: string;
  category: PaymentProviderCategory;
  stripeMethodId: string | null;
  badgeBg: string;
  badgeText: string;
  minAmount: number;
  maxAmount: number;
  description: string;
  enabled: boolean;
}

export const BNPL_PROVIDERS: BnplProvider[] = [
  {
    id: 'klarna', name: 'Klarna', category: 'bnpl', stripeMethodId: 'klarna',
    badgeBg: 'bg-pink-100', badgeText: 'text-pink-700', minAmount: 35, maxAmount: 10000,
    description: 'Installment financing offered by Klarna. Eligibility and terms are determined by Klarna.', enabled: true,
  },
  {
    id: 'afterpay', name: 'Afterpay', category: 'bnpl', stripeMethodId: 'afterpay_clearpay',
    badgeBg: 'bg-teal-100', badgeText: 'text-teal-700', minAmount: 35, maxAmount: 2000,
    description: 'Installment payments offered by Afterpay. Eligibility and terms are determined by Afterpay.', enabled: true,
  },
  {
    id: 'zip', name: 'Zip', category: 'bnpl', stripeMethodId: 'zip',
    badgeBg: 'bg-indigo-100', badgeText: 'text-indigo-700', minAmount: 35, maxAmount: 1500,
    description: 'Installment payments offered by Zip. Eligibility and terms are determined by Zip.', enabled: true,
  },
  {
    id: 'cashapp', name: 'Cash App Pay', category: 'payment', stripeMethodId: 'cashapp',
    badgeBg: 'bg-green-100', badgeText: 'text-green-700', minAmount: 35, maxAmount: 0,
    description: 'Direct payment from Cash App or a linked funding source. This is not a BNPL product.', enabled: true,
  },
  {
    id: 'amazon_pay', name: 'Amazon Pay', category: 'payment', stripeMethodId: 'amazon_pay',
    badgeBg: 'bg-orange-100', badgeText: 'text-orange-700', minAmount: 35, maxAmount: 0,
    description: 'Direct checkout using an Amazon account and saved payment method.', enabled: false,
  },
  {
    id: 'us_bank_account', name: 'Bank Transfer (ACH)', category: 'payment', stripeMethodId: 'us_bank_account',
    badgeBg: 'bg-blue-100', badgeText: 'text-blue-700', minAmount: 35, maxAmount: 0,
    description: 'Direct ACH bank payment. This is not a BNPL product.', enabled: false,
  },
  {
    id: 'affirm', name: 'Affirm', category: 'bnpl', stripeMethodId: null,
    badgeBg: 'bg-brand-blue-100', badgeText: 'text-brand-blue-700', minAmount: 50, maxAmount: 30000,
    description: 'Installment financing through Affirm. APR, approval, and terms are determined by Affirm.', enabled: true,
  },
  {
    id: 'sezzle', name: 'Sezzle', category: 'bnpl', stripeMethodId: null,
    badgeBg: 'bg-purple-100', badgeText: 'text-purple-700', minAmount: 35, maxAmount: 2500,
    description: 'Installment payments through Sezzle. Eligibility and terms are determined by Sezzle.', enabled: true,
  },
];

/** Every currently enabled flexible checkout provider. */
export const ACTIVE_PAYMENT_PROVIDERS = BNPL_PROVIDERS.filter((provider) => provider.enabled);

/** Financing/installment providers only. Direct payment methods are excluded. */
export const ACTIVE_BNPL_PROVIDERS = ACTIVE_PAYMENT_PROVIDERS.filter((provider) => provider.category === 'bnpl');

export const DIRECT_PAYMENT_PROVIDERS = ACTIVE_PAYMENT_PROVIDERS.filter((provider) => provider.category === 'payment');

export const BNPL_PROVIDER_NAMES = ACTIVE_BNPL_PROVIDERS.map((provider) => provider.name).join(', ');
export const BNPL_PROVIDER_SUMMARY = (() => {
  const names = ACTIVE_BNPL_PROVIDERS.map((provider) => provider.name);
  if (names.length <= 2) return names.join(' & ');
  return `${names[0]}, ${names[1]} & ${names.length - 2} more`;
})();
export const BNPL_CHECKOUT_LABEL = `${ACTIVE_BNPL_PROVIDERS.slice(0, 2).map((provider) => provider.name).join(' & ')} financing available`;
export const BNPL_DESCRIPTION = `Installment options may be available through ${BNPL_PROVIDER_NAMES}. Approval and terms are determined by each provider.`;

/** Financing providers valid for a given dollar amount. */
export function getBnplProvidersForAmount(amount: number): BnplProvider[] {
  return ACTIVE_BNPL_PROVIDERS.filter((provider) => amount >= provider.minAmount && (provider.maxAmount === 0 || amount <= provider.maxAmount));
}

/** Backward-compatible checkout helper: returns all enabled flexible payment providers valid for the amount. */
export function getProvidersForAmount(amount: number): BnplProvider[] {
  return ACTIVE_PAYMENT_PROVIDERS.filter((provider) => amount >= provider.minAmount && (provider.maxAmount === 0 || amount <= provider.maxAmount));
}

export function isBnplAvailable(amount: number): boolean {
  return getBnplProvidersForAmount(amount).length > 0;
}

/** Stripe-native financing methods only. */
export const STRIPE_BNPL_PAYMENT_METHODS: string[] = [
  'card',
  ...ACTIVE_BNPL_PROVIDERS.filter((provider) => provider.stripeMethodId !== null).map((provider) => provider.stripeMethodId as string),
];

/** All enabled Stripe-native payment methods, including direct-payment rails such as Cash App Pay. */
export const STRIPE_FLEXIBLE_PAYMENT_METHODS: string[] = [
  'card',
  ...ACTIVE_PAYMENT_PROVIDERS.filter((provider) => provider.stripeMethodId !== null).map((provider) => provider.stripeMethodId as string),
];

/** Backward-compatible checkout helper: all Stripe-native methods valid for the amount. */
export function getStripeMethodsForAmount(amountDollars: number): string[] {
  return [
    'card',
    ...getProvidersForAmount(amountDollars)
      .filter((provider) => provider.stripeMethodId !== null)
      .map((provider) => provider.stripeMethodId as string),
  ];
}
