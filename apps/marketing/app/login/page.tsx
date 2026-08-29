import { redirect } from 'next/navigation';
import { siteUrls } from '@/lib/utils/site-urls';

export const dynamic = 'force-dynamic';
export const metadata = {
  robots: { index: false, follow: false },
  title: 'Sign In,
};

/**
 * Marketing does not own authentication UI.
 * Keep one canonical login at app.elevateforhumanity.org/login and preserve
 * only the supported routing context needed by that login.
 */
export default async function MarketingLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; redirect?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const target = new URL('/login', siteUrls.app);

  if (params.next) target.searchParams.set('next', params.next);
  if (params.redirect) target.searchParams.set('redirect', params.redirect);
  if (params.reason) target.searchParams.set('reason', params.reason);

  redirect(target.toString());
}
