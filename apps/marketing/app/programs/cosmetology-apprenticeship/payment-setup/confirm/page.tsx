import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Compatibility callback retained only so old bookmarked return URLs
 * do not 404. New cosmetology checkout uses the canonical program flow.
 */
export default function CosmetologyPaymentSetupConfirmPage() {
  redirect('/programs/cosmetology-apprenticeship/payment-setup');
}
