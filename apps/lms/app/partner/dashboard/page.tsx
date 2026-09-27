import { redirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

/** Send legacy partner links to the role-specific portal chooser. */
export default function LegacyPartnerDashboard() {
  redirect('/partners');
}
