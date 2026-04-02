import { redirect } from 'next/navigation';

// Canonical partner dashboard is /program-holder/dashboard.
// role-destinations.ts sends the 'partner' role to /program-holder/dashboard.
export default function PartnerDashboardRedirect() {
  redirect('/program-holder/dashboard');
}
