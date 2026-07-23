/**
 * /admin/admin → /admin/dashboard
 * Required by check-admin-lms-separation.sh — canonical admin landing.
 */
export const metadata = { robots: { index: false } };

import { redirect } from 'next/navigation';

export default function AdminAdminPage() {
  redirect('/admin/dashboard');
}
