import { redirect } from 'next/navigation';

// Canonical admin dashboard route - redirects to actual implementation
export default function AdminDashboardCanonical() {
  redirect('/dashboard');
}
