import { permanentRedirect } from 'next/navigation';

/**
 * Legacy product-catalog alias.
 *
 * Product pricing and merchandising now live under /store. Redirect this
 * previously indexed route so search engines and users reach the authoritative
 * catalog instead of stale prices or duplicate product definitions.
 */
export default function ProductsPage() {
  permanentRedirect('/store/apps');
}
