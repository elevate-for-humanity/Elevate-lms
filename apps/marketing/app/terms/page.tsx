import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'Terms of Service,
  description: 'Legacy Terms of Service URL retained for bookmarks and external references.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://www.elevateforhumanity.org/terms-of-service' },
};

/** Historical URL retained intentionally; the canonical document is /terms-of-service. */
export default function TermsLegacyAliasPage() {
  permanentRedirect('/terms-of-service');
}
