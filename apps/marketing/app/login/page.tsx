import { redirect } from 'next/navigation';
import { siteUrls } from '@/lib/utils/site-urls';
import { getPublicRuntimeService } from '@/lib/health/public-runtime-service';
import { StoreSignIn } from '@/components/store/StoreSignIn';
import { storeSignInReturnPath } from '@/lib/store/sign-in-return.mjs';

export const dynamic = 'force-dynamic';
export const metadata = {
  robots: { index: false, follow: false },
  title: 'Sign In | Elevate for Humanity',
};

/**
 * Store owns its sign-in UI and uses its own authenticated API.
 * Marketing retains the canonical LMS login.
 * Keep one canonical login at app.elevateforhumanity.org/login and preserve
 * only the supported routing context needed by that login.
 */
export default async function MarketingLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; redirect?: string; reason?: string }>;
}) {
  const params = await searchParams;
  if (getPublicRuntimeService() === 'store') {
    return <StoreSignIn returnPath={storeSignInReturnPath(params.next || params.redirect)} />;
  }
  const target = new URL('/login', siteUrls.app);

  if (params.next) target.searchParams.set('next', params.next);
  if (params.redirect) target.searchParams.set('redirect', params.redirect);
  if (params.reason) target.searchParams.set('reason', params.reason);

  redirect(target.toString());
}
