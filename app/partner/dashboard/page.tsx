import { redirect } from 'next/navigation';

// Canonical partner dashboard is /partner-portal.
// role-destinations.ts sends the 'partner' role here — redirect permanently.
export default function PartnerDashboardRedirect() {
  redirect('/partner-portal');
}
