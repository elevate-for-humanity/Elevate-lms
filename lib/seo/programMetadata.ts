import type { Metadata } from 'next';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageContract';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const SITE_URL = PLATFORM_DEFAULTS.siteUrl;
const SITE_NAME = PLATFORM_DEFAULTS.orgName;

/**
 * Generate Next.js Metadata from ProgramPageContract config.
 * Ensures consistent SEO across all program pages.
 */
export function generateProgramMetadata(config: ProgramPageConfig): Metadata {
  const url = `${SITE_URL}/programs/${config.slug}`;
  const imageUrl = config.heroImage
    ? `${SITE_URL}${config.heroImage}`
    : `${SITE_URL}/images/og-default.jpg`;

  return {
    title: `${config.title} | ${SITE_NAME}`,
    description: config.subtitle,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${config.title} | ${SITE_NAME}`,
      description: config.subtitle,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.subtitle,
      images: [imageUrl],
    },
    keywords: buildKeywords(config),
  };
}

/**
 * Build keywords from program config
 */
function buildKeywords(config: ProgramPageConfig): string[] {
  const keywords: string[] = [
    config.title,
    config.snapshot.programType,
    config.snapshot.credential,
    'Indianapolis',
    'Indiana',
    'training',
    'career',
  ];

  // Add funding-related keywords
  if (config.funding.options.includes('wioa')) {
    keywords.push('WIOA', 'free training', 'workforce funding');
  }
  if (config.funding.options.includes('wrg')) {
    keywords.push('Workforce Ready Grant', 'WRG', 'free training Indiana');
  }

  // Add program type keywords
  if (config.programType === 'apprenticeship') {
    keywords.push('apprenticeship', 'registered apprenticeship', 'earn while you learn');
  }
  if (config.programType === 'certificate') {
    keywords.push('certification', 'certificate program');
  }

  return keywords;
}

/**
 * Quick metadata generator for pages not yet using full config
 */
export function quickProgramMetadata(
  slug: string,
  title: string,
  description: string,
  heroImage?: string,
): Metadata {
  const url = `${SITE_URL}/programs/${slug}`;
  const imageUrl = heroImage ? `${SITE_URL}${heroImage}` : `${SITE_URL}/images/og-default.jpg`;

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}
