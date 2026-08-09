import { permanentRedirect } from 'next/navigation';

/**
 * Compatibility alias retained for historical business-program links.
 * The former /programs/business-administration target is not a live page, so
 * route visitors to the maintained program catalog instead of a redirect-to-404.
 */
export default function BusinessAliasPage() {
  permanentRedirect('/programs');
}
