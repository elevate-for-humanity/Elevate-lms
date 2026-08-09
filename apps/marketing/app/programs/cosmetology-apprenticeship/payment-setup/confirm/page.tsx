import { redirect } from 'next/navigation';

/**
 * Legacy SetupIntent callback retained only so old bookmarked/Stripe return URLs
 * do not 404. New cosmetology payments use the canonical program checkout.
 */
export default function CosmetologyPaymentSetupConfirmPage() {
  redirect('/programs/cosmetology-apprenticeship/payment-setup');
}
