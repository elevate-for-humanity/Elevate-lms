import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Legacy barber-program Host Shop landing page.
 * Its live approved-shop directory and approval workflow were merged into
 * the canonical cross-program Host Site page before this redirect was added.
 */
export default function LegacyBarberProgramHostShopsPage() {
  redirect('/partners/host-shops');
}
