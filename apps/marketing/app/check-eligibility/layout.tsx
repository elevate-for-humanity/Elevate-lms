import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Training Eligibility Quiz | Elevate for Humanity',
  description:
    'Complete the preliminary training eligibility quiz before submitting a funded-program application. Final eligibility and authorization are determined by the responsible agency.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/eligibility/quiz' },
};

/**
 * /check-eligibility is retained only as a legacy inbound route.
 * The maintained eligibility experience is /eligibility/quiz.
 * Redirect at the layout boundary so stale CTAs/bookmarks cannot boot the
 * retired client funnel, while leaving that implementation untouched for the
 * parallel development environment.
 */
export default function CheckEligibilityLegacyLayout() {
  permanentRedirect('/eligibility/quiz');
}
