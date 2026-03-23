import { redirect } from 'next/navigation';

// Program admin dashboard redirects to the program admin portal.
// This route exists as a stable entry point for external links and redirects.
export default function ProgramAdminDashboardPage() {
  redirect('/programs/admin');
}
