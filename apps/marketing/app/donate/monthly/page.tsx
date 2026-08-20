import { permanentRedirect } from 'next/navigation';

/**
 * Monthly giving is handled by the canonical /donate checkout, which supports
 * recurring Stripe subscriptions and carries the current nonprofit disclosure.
 */
export default function MonthlyGivingPage() {
  permanentRedirect('/donate');
}
