import type { Metadata } from 'next';

type SiteMetadataInput = {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

function absoluteUrl(path = '/') {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Generates consistent Metadata for a page.
 * Title uses the root layout template ('%s | Elevate for Humanity')
 * so pass just the page-specific part, e.g. "HVAC Technician Training Program".
 */
export function siteMetadata(input: SiteMetadataInput): Metadata {
  const url = absoluteUrl(input.path || '/');

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: 'website',
      url,
      title: input.title,
      description: input.description,
      siteName: 'Elevate for Humanity',
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
    },
  };
}
