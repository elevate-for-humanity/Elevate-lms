import type { Metadata } from 'next';
import { buildSiteMetadata } from '@/lib/seo/build-site-metadata';

/** @deprecated Use buildSiteMetadata from @/lib/seo/build-site-metadata */
export function buildMetadata({
  title,
  description,
  path = '',
}: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const normalized = path.startsWith('/') ? path : path ? `/${path}` : '/';
  return buildSiteMetadata({ title, description, path: normalized });
}
