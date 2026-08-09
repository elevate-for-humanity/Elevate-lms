import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Compatibility route for historical Barber Host Shop links.
 * The current application is universal across Barber, Cosmetology, Esthetics,
 * and Nail, so legacy callers must choose their actual program instead of
 * silently defaulting to Barber.
 */
export default function LegacyBarberHostShopApplyPage() {
  redirect('/partners/host-shop/apply');
}
