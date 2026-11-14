import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Licensing | Elevate',
  robots: { index: false, follow: false },
};

/**
 * Compatibility route for the former generic subscription checkout.
 * Starter/Pro price IDs do not map to the active QuickBooks offer catalog.
 * Send visitors to the current licensing offer page so no unpriced invoice
 * or unsupported subscription can be created from an old link.
 */
export default function CheckoutPage() {
  redirect('https://www.elevateforhumanity.org/pricing/sponsor-licensing');
}
