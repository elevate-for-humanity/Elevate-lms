import { redirect } from 'next/navigation';

// Canonical admin dashboard is /admin/dashboard
export default function ProgramsAdminDashboardRedirect() {
  redirect('/admin/dashboard');
}
