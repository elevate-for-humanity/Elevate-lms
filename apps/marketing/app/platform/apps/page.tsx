import { permanentRedirect } from 'next/navigation';

/**
 * Legacy platform-app catalog alias.
 *
 * /store/apps is the canonical public catalog. Keeping a single canonical
 * commerce route prevents duplicate pricing, broken database reads, and SEO
 * fragmentation while preserving old bookmarks and indexed links.
 */
export default function PlatformAppsPage() {
  permanentRedirect('/store/apps');
}
