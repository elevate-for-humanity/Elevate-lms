/**
 * Unified login page for all users.
 * Students, employers, and staff all log in through this page.
 * Redirects to /admin-login for the actual authentication form.
 */

import { redirect } from 'next/navigation';

export default function LoginPage() {
  redirect('/admin-login');
}
