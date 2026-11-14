import { redirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

/** The partner role owns the Host Shop workspace in the canonical role map. */
export default function LegacyPartnerDashboard() {
  redirect('/host-shop/dashboard');
}
