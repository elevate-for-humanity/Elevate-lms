import { redirect } from 'next/navigation';

// Staff portal dashboard redirects to the admin panel.
// This route exists as a stable entry point for external links and redirects.
export default function StaffDashboardPage() {
  redirect('/admin');
}
