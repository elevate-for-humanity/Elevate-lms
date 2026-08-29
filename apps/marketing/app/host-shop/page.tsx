import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'Host Site Partnerships,
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/host-shops' },
};

/** Historical singular URL retained for bookmarks and external links. */
export default function LegacyHostShopPage() {
  permanentRedirect('/partners/host-shops');
}
