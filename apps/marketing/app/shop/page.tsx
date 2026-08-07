import { permanentRedirect } from 'next/navigation';

/**
 * Legacy storefront alias.
 *
 * /store is the canonical software, licensing, AI tools, demos, and course
 * commerce surface. Keep this route only as a compatibility entry point for
 * old bookmarks and external links; do not build a second storefront here.
 */
export default function ShopPage() {
  permanentRedirect('/store');
}
