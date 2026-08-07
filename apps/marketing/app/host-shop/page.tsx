import { permanentRedirect } from 'next/navigation';

/**
 * Backward-compatible Host Shop entry point.
 * Keep this route because older homepage builds, bookmarks, search results,
 * and external links may still use /host-shop.
 */
export default function HostShopRedirectPage() {
  permanentRedirect('/partners/barber-host-shop');
}
