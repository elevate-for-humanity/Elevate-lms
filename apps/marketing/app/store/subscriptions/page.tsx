import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Legacy subscription entry point.
 *
 * The canonical subscription experience lives at /store/plans, where plan
 * selection, add-ons, provider checkout, trial entry, plan changes, and
 * billing management are wired to the organization subscription model.
 * Keeping a second subscription UI here previously left this route calling
 * obsolete /api/store/subscribe and /api/store/customer-portal endpoints.
 */
export default function StoreSubscriptionsPage() {
  redirect('/store/plans');
}
