import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Program Holder Dashboard',
};

// Redirect to partner dashboard (shared functionality)
export default function ProgramHolderDashboardPage() {
  redirect('/partner/dashboard');
}
