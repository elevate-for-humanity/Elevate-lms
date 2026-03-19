import { redirect } from 'next/navigation';

// /lms/dashboard redirects to the canonical learner dashboard
export default function LmsDashboardRedirect() {
  redirect('/learner/dashboard');
}
