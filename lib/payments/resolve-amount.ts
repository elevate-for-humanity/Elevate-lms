/**
 * Server-side payment amount resolution.
 *
 * The server computes required_amount from (program_slug, payment_option).
 * The client-submitted amount is treated as paid_amount, never as
 * "what they're buying." Entitlement is determined by payment_option,
 * not by how much was paid.
 */

import { BARBER_PRICING } from '@/lib/programs/pricing';

export type PaymentOption = 'deposit' | 'full' | 'custom';

interface ProgramPricing {
  deposit: number;
  full: number;
  /** Maximum allowed payment (prevents fat-finger overpay) */
  max: number;
}

/** Canonical price map per program. Add new programs here. */
const PROGRAM_PRICING: Record<string, ProgramPricing> = {
  'barber-apprenticeship': {
    deposit: BARBER_PRICING.setupFee,   // $1,743
    full: BARBER_PRICING.fullPrice,     // $4,980
    max: BARBER_PRICING.fullPrice,      // Cap at full tuition
  },
  'hvac-technician': {
    deposit: 1750,
    full: 5000,
    max: 5000,
  },
};

export type AmountResolution = {
  ok: true;
  requiredAmount: number;
  paidAmount: number;
  overpayAmount: number;
  paymentOption: PaymentOption;
  programSlug: string;
} | {
  ok: false;
  error: string;
  status: number;
};

/**
 * Resolve and validate a BNPL payment amount.
 *
 * @param programSlug - Program identifier
 * @param paymentOption - What the user selected (deposit, full, custom)
 * @param clientAmount - Dollar amount submitted by the client
 * @param providerMin - BNPL provider's platform minimum (Sezzle: 35, Affirm: 50)
 * @param providerMax - BNPL provider's platform maximum (Sezzle: 2500, Affirm: none)
 */
export function resolvePaymentAmount(
  programSlug: string,
  paymentOption: string | undefined,
  clientAmount: number,
  providerMin: number,
  providerMax: number | null,
): AmountResolution {
  const pricing = PROGRAM_PRICING[programSlug];

  if (!pricing) {
    // Unknown program — fall back to provider limits only
    if (clientAmount < providerMin) {
      return { ok: false, error: `Minimum payment is $${providerMin}`, status: 400 };
    }
    if (providerMax && clientAmount > providerMax) {
      return { ok: false, error: `Maximum payment is $${providerMax.toLocaleString()}`, status: 400 };
    }
    return {
      ok: true,
      requiredAmount: clientAmount,
      paidAmount: clientAmount,
      overpayAmount: 0,
      paymentOption: 'custom' as PaymentOption,
      programSlug,
    };
  }

  // Normalize payment_option
  const option: PaymentOption =
    paymentOption === 'full' ? 'full' :
    paymentOption === 'deposit' ? 'deposit' :
    'deposit'; // Default to deposit for BNPL (safest)

  const requiredAmount = option === 'full' ? pricing.full : pricing.deposit;

  // Validate against required minimum
  if (clientAmount < requiredAmount) {
    return {
      ok: false,
      error: `Minimum payment for ${option === 'full' ? 'full tuition' : 'deposit'} is $${requiredAmount.toLocaleString()}`,
      status: 400,
    };
  }

  // Validate against provider limits
  if (clientAmount < providerMin) {
    return { ok: false, error: `Minimum payment is $${providerMin}`, status: 400 };
  }
  if (providerMax && clientAmount > providerMax) {
    return { ok: false, error: `Maximum payment is $${providerMax.toLocaleString()}`, status: 400 };
  }

  // Cap overpay: don't allow more than program total
  if (clientAmount > pricing.max) {
    return {
      ok: false,
      error: `Maximum payment is $${pricing.max.toLocaleString()} (full tuition)`,
      status: 400,
    };
  }

  return {
    ok: true,
    requiredAmount,
    paidAmount: clientAmount,
    overpayAmount: clientAmount - requiredAmount,
    paymentOption: option,
    programSlug,
  };
}
