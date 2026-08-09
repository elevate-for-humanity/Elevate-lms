import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Legacy barber-only employer landing page.
 * The canonical Host Site experience now covers Barber, Cosmetology,
 * Esthetics, and Nail Technician without maintaining parallel content.
 */
export default function LegacyBarberHostShopPage() {
  redirect('/partners/host-shops');
}
