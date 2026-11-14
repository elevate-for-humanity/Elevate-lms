import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Legacy subscription entry point.
 *
 * The canonical subscription experience lives at /store/plans, where plan
 * selection, add-ons, Stripe checkout, trial entry, plan changes, and the
 * Stripe billing portal are wired to the organization subscription model.
 * Keeping a second subscription UI here previously left this route calling
 * obsolete /api/store/subscribe and /api/store/customer-portal endpoints.
 */
export default function StoreSubscriptionsPage() {
  redirect('/store/plans');
}
