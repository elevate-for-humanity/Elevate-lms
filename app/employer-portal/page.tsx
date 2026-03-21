import { redirect } from 'next/navigation';

// Canonical employer dashboard is /employer/dashboard.
// This route is kept for sub-route compatibility (/employer-portal/jobs, etc.)
// but the root redirects to the canonical destination.
export default function EmployerPortalRootRedirect() {
  redirect('/employer/dashboard');
}
