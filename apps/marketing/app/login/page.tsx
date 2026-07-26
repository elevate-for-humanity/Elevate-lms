/**
 * Unified login page for all users.
 * Students, employers, and staff all log in through this page.
 * Redirects to /admin-login for the actual authentication form.
 * Preserves the original redirect destination through the chain.
 */

import { redirect } from 'next/navigation';

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const target = params.redirect
    ? `/admin-login?redirect=${encodeURIComponent(params.redirect)}`
    : '/admin-login';
  redirect(target);
}
