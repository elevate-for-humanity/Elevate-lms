import { redirect } from 'next/navigation';

// Canonical staff portal dashboard route - redirects to actual implementation
export default function StaffPortalDashboardCanonical() {
  redirect('/staff-portal/dashboard');
}
