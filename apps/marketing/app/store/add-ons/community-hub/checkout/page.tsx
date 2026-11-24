import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-static';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function CommunityHubCheckoutPage() {
  // Community Hub pricing is controlled by the canonical platform catalog.
  // This legacy checkout previously hard-coded a conflicting amount, so route
  // to the cart add flow instead. Only works once the add-to-cart resolver
  // knows the community-hub slug (fix/store-checkout-add-to-cart).
  redirect('/store/cart?add=community-hub');
}
