/**
 * Canonical marketing SEO metadata — use for all public pages (marketing, education, enrollment).
 * Single source: PLATFORM_DEFAULTS (not hardcoded domains or duplicate siteConfig URLs).
 */

import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export type SiteMetadataInput = {
  title: string;
  description: string;
  /** Path only, e.g. `/programs` or `/education` */
  path: string;
  /** When true, adds Open Graph metadata (default true for public marketing). */
  social?: boolean;
  noindex?: boolean;
};

export function buildSiteMetadata(input: SiteMetadataInput): Metadata {
  const base = PLATFORM_DEFAULTS.siteUrl.replace(/\/$/, '');
  const path = input.path.startsWith('/') ? input.path : `/${input.path}`;
  const url = `${base}${path}`;
  const org = PLATFORM_DEFAULTS.orgName;
  const fullTitle = input.title.includes('|') ? input.title : `${input.title} | ${org}`;

  // Use { absolute: ... } to bypass root layout template — prevents doubled site name
  const metadata: Metadata = {
    title: { absolute: fullTitle },
    description: input.description,
    alternates: { canonical: url },
  };

  if (input.noindex) {
    metadata.robots = { index: false, follow: false };
    return metadata;
  }

  if (input.social !== false) {
    metadata.openGraph = {
      title: fullTitle,
      description: input.description,
      url,
      siteName: org,
      type: 'website',
      locale: 'en_US',
    };
  }

  return metadata;
}
