import { redirect } from 'next/navigation';

// Tour step routes to /admin/dashboard — redirect to the demo admin page
// which renders the full dashboard with sandbox data
export default function DemoDashboardRedirect() {
  redirect('/demo/admin');
}
