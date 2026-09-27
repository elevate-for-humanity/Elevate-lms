import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

/**
 * Legacy sponsor-license checkout compatibility route.
 * Active billing is handled by Elevate billing with QuickBooks/PayPal.
 */
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Secure Checkout | Elevate',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  const target = new URLSearchParams();
  if (plan) target.set('plan', plan);
  target.set('payment', 'invoice');
  redirect(`/pricing/sponsor-licensing?${target.toString()}`);
}
