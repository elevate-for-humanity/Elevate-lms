import { redirect } from 'next/navigation';

// Canonical staff portal is /staff-portal/dashboard
export default function StaffDashboardRedirect() {
  redirect('/staff-portal/dashboard');
}
