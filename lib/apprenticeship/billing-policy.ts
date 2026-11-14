export type ApprenticeBillingState =
  | 'current'
  | 'due'
  | 'past_due'
  | 'payment_failed'
  | 'paused_by_admin'
  | 'completed'
  | 'cancelled';

export type ApprenticeBillingPolicyInput = {
  enrollmentStatus?: string | null;
  paymentStatus?: string | null;
  stripeSubscriptionStatus?: string | null;
  nextPaymentDate?: string | null;
  balanceRemaining?: number | null;
  failedInvoiceCount?: number | null;
  graceDays?: number | null;
};

export const APPRENTICE_BILLING_POLICY = {
  defaultCurrency: 'usd',
  defaultGraceDays: 7,
  supportedIntervals: ['week', 'month'] as const,
  preserveTrainingOnPaymentFailure: true,
  requireExplicitAdminActionToTerminateTraining: true,
  requireInvoiceAuditTrail: true,
  requireStripeWebhookSync: true,
} as const;

function normalize(value?: string | null) {
  return String(value || '').trim().toLowerCase();
}

export function resolveApprenticeBillingState(
  input: ApprenticeBillingPolicyInput,
  now = new Date(),
): ApprenticeBillingState {
  const enrollment = normalize(input.enrollmentStatus);
  const payment = normalize(input.paymentStatus);
  const subscription = normalize(input.stripeSubscriptionStatus);

  if (enrollment === 'cancelled' || enrollment === 'canceled') return 'cancelled';
  if (enrollment === 'completed') return 'completed';
  if (enrollment === 'paused' && payment !== 'failed' && payment !== 'past_due') {
    return 'paused_by_admin';
  }

  if (payment === 'failed' || subscription === 'unpaid') return 'payment_failed';
  if (payment === 'past_due' || subscription === 'past_due') return 'past_due';

  const nextPayment = input.nextPaymentDate ? new Date(input.nextPaymentDate) : null;
  if (nextPayment && !Number.isNaN(nextPayment.getTime())) {
    const graceDays = Number.isFinite(input.graceDays)
      ? Number(input.graceDays)
      : APPRENTICE_BILLING_POLICY.defaultGraceDays;
    const graceEnds = new Date(nextPayment);
    graceEnds.setUTCDate(graceEnds.getUTCDate() + graceDays);
    if (now > graceEnds) return 'past_due';
    if (now >= nextPayment) return 'due';
  }

  return 'current';
}

export function shouldAllowTrainingAccess(state: ApprenticeBillingState) {
  // Financial delinquency is not an instructional deletion event. Training
  // access remains available unless an authorized administrator separately
  // pauses/cancels the enrollment under documented program policy.
  return state !== 'paused_by_admin' && state !== 'cancelled';
}

export function validateApprenticePaymentPlan(input: {
  amountCents?: number | null;
  interval?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  const errors: string[] = [];
  if (!Number.isInteger(input.amountCents) || Number(input.amountCents) <= 0) {
    errors.push('positive_amount_cents_required');
  }
  if (!APPRENTICE_BILLING_POLICY.supportedIntervals.includes(input.interval as 'week' | 'month')) {
    errors.push('supported_interval_required');
  }
  if (!input.stripeCustomerId) errors.push('stripe_customer_required');
  if (!input.stripeSubscriptionId) errors.push('stripe_subscription_required');
  return { valid: errors.length === 0, errors };
}
