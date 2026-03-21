import { redirect } from 'next/navigation';

// Canonical partner dashboard is at /partner/programs.
// This route exists as a stable entry point for external links and redirects.
export default function PartnerDashboardPage() {
  redirect('/partner/programs');
}
