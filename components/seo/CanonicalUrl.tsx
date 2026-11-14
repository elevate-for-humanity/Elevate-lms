'use client';

import { usePathname } from 'next/navigation';
import Head from 'next/head';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;

/**
 * Generates canonical URL for the current page
 * Prevents duplicate content issues in search engines
 */
export function useCanonicalUrl(): string {
  const pathname = usePathname();

  // Remove trailing slashes and normalize
  const cleanPath = pathname?.replace(/\/+$/, '') || '';

  // Handle special cases
  if (cleanPath === '' || cleanPath === '/') {
    return SITE_URL;
  }

  return `${SITE_URL}${cleanPath}`;
}

/**
 * Component to add canonical link tag
 * Use in page components or layout
 */
export function CanonicalTag() {
  const canonicalUrl = useCanonicalUrl();

  return (
    <Head>
      <link rel="canonical" href={canonicalUrl} />
    </Head>
  );
}
