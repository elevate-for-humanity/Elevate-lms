
import { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';

export const metadata: Metadata = {
  title: 'Technology Partnership | Elevate for Humanity',
  description: 'Technology integration partnerships with Elevate for Humanity. LMS integrations, API access, and workforce data interoperability.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/technology' },
};

export default function TechnologyPartnerPage() {

  return (
    <PublicLandingPage config={{
      breadcrumbs: [{ label: 'Partners', href: '/partners' }, { label: 'Technology' }],
      hero: {
        image: '/images/pages/comp-cta-career.jpg',
        tag: 'Technology',
        tagColor: 'text-emerald-300',
        title: 'Technology Partnership',
        subtitle: 'Integrate with the Elevate platform. API access, data interoperability, and workforce system integrations.',
      },
      intro: {
        heading: 'Workforce Technology Integration',
        paragraphs: [
          'Elevate for Humanity partners with technology providers to improve data interoperability across workforce systems. Our platform integrates with case management systems, job boards, and state workforce databases.',
          'If you build tools for workforce development, career services, or training delivery — let\'s explore how our systems can work together.',
        ],
      },
      features: {
        heading: 'Integration Areas',
        items: [
          'Student enrollment and case management data exchange',
          'Credential verification and digital badge issuance',
          'Job board and employer matching integrations',
          'WIOA performance reporting data feeds',
          'LMS content and course interoperability (LTI)',
          'Single sign-on (SSO) for partner organizations',
        ],
      },
      cta: {
        heading: 'Explore Integration',
        subtitle: 'Contact us to discuss technology partnership and integration opportunities.',
        primaryLabel: 'Contact Us',
        primaryHref: '/contact',
        secondaryLabel: 'View Features',
        secondaryHref: '/features',
        bgColor: 'bg-emerald-700',
      },
    }} />
  );
}
