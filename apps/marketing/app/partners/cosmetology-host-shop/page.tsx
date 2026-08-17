import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Legacy occupation-specific Host Site landing page.
 * The canonical Host Site experience now covers Barber, Cosmetology,
 * Esthetics, and Nail Technician without maintaining parallel content.
 */
export default function LegacyCosmetologyHostShopPage() {
  redirect('/partners/host-shops');
}
