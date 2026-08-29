import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'Apprenticeship Host Sites,
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/host-shops' },
};

/**
 * Keep the historical directory URL live for bookmarks while the canonical
 * promoted directory lives at /partners/host-shops. Child profile routes under
 * /host-shops/[slug] remain public profile pages.
 */
export default function LegacyHostShopsDirectoryPage() {
  permanentRedirect('/partners/host-shops');
}
