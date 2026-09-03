// Re-export canonical SEO utilities
export { generateMetadata, generateInternalMetadata } from './metadata';
export { generatePageMetadata, generateCustomMetadata } from './page-metadata';
export { siteMetadata, SITE } from './siteMetadata';

import type { Metadata } from 'next';
import { generateMetadata } from './metadata';

/**
 * Thin alias used by marketing pages.
 * Wraps generateMetadata with the same signature as the marketing repo's buildMetadata.
 */
export function buildMetadata({
  title,
  description,
  path = '',
}: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  return generateMetadata({ title, description, path });
}
