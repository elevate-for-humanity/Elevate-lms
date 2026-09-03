export const metadata = { robots: { index: false } };

import { redirect } from 'next/navigation';

export default function AdminIndexPage() {
  // Redirect to the REAL admin dashboard with live Supabase data
  redirect('/dashboard');
}
