import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { siteUrls } from '@/lib/utils/site-urls';

export const metadata: Metadata = {
  title: 'Dev Studio | Elevate for Humanity',
  description: 'AI-powered development environment for the Elevate platform.',
  robots: { index: false, follow: true },
};

/**
 * The LMS does not own Dev Studio.
 *
 * Canonical ownership:
 * - Public/product information: Marketing app `/dev-studio`
 * - Operational Dev Studio: Admin-domain root `/studio`
 *
 * Keep this compatibility route so existing LMS links/bookmarks continue to work
 * while eliminating the duplicate Dev Studio implementation from the LMS bundle.
 */
export default function DevStudioCompatibilityRoute() {
  redirect(`${siteUrls.site}/dev-studio`);
}
