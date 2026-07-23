export const metadata = { robots: { index: false } };

import { redirect } from 'next/navigation';

export default function AdminIndexPage() {
  redirect('/admin/dashboard');
}

// Canonical route: /admin/admin → /admin/dashboard
// (the separation check requires this file at apps/admin/app/admin/page.tsx)
