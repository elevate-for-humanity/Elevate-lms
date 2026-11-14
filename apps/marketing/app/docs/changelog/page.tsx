import { permanentRedirect } from 'next/navigation';

/**
 * Historical public changelog route. Product and public-content updates are
 * published through current canonical pages; this redirect prevents stale blog
 * or funding snippets from remaining on a duplicate indexable URL.
 */
export default function LegacyChangelogPage() {
  permanentRedirect('/blog');
}
