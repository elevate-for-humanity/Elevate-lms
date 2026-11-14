import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const SITE = {
  name: PLATFORM_DEFAULTS.orgName,
  domain: PLATFORM_DEFAULTS.canonicalDomain,
  url: PLATFORM_DEFAULTS.siteUrl,
  ogImage: '/images/og-default.jpg',
};

type SiteMetadataInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
};

function absoluteUrl(path = '/') {
  const base = process.env.NEXT_PUBLIC_SITE_URL || SITE.url;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Generates consistent Metadata for a page.
 * Title uses the root layout template ('%s | ' + PLATFORM_DEFAULTS.orgName + '')
 * so pass just the page-specific part.
 */
export function siteMetadata(input: SiteMetadataInput): Metadata {
  const url = absoluteUrl(input.path || '/');
  const image = input.image || SITE.ogImage;

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    metadataBase: new URL(SITE.url),
    alternates: { canonical: url },
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: 'website',
      url,
      title: input.title,
      description: input.description,
      siteName: SITE.name,
      images: [{ url: image, width: 1200, height: 630, alt: input.title }],
      locale: 'en_US',
    },
  };
}
