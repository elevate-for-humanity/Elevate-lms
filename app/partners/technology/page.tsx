import { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';

export const metadata: Metadata = {
  title: 'Technology Partnership | Elevate for Humanity',
  description: 'Technology integration partnerships with Elevate for Humanity. LMS integrations, API access, and workforce data interoperability for workforce development systems.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/technology' },
};

export default function TechnologyPartnerPage() {
  return (
    <PublicLandingPage config={{
      breadcrumbs: [{ label: 'Partners', href: '/partners' }, { label: 'Technology Partners' }],
      hero: {
        image: '/images/pages/technology-sector.jpg',
        tag: 'Technology Partners',
        tagColor: 'text-brand-blue-600',
        title: 'Technology Partnership',
        subtitle: 'Integrate with the Elevate platform. API access, data interoperability, and workforce system integrations for software vendors and workforce data platforms.',
      },
      intro: {
        heading: 'Workforce Technology Integration',
        paragraphs: [
          'Elevate for Humanity partners with technology providers to improve data interoperability across workforce systems. Our platform integrates with case management systems, job boards, credential verification services, and state workforce databases.',
          'If you build tools for workforce development, career services, training delivery, or employer hiring — we want to explore how our systems can work together to serve more participants more effectively.',
        ],
        image: '/images/pages/cybersecurity-screen.jpg',
      },
      features: {
        heading: 'Integration Areas',
        items: [
          'Student enrollment and case management data exchange (REST API)',
          'Credential verification and digital badge issuance (Credly, Open Badges)',
          'Job board and employer matching integrations',
          'WIOA performance reporting data feeds (PIRL-compatible)',
          'LMS content and course interoperability (LTI 1.3)',
          'Single sign-on (SSO) for partner organizations (SAML, OAuth)',
          'Webhook event streams for enrollment, completion, and placement events',
          'White-label LMS licensing for training organizations',
        ],
      },
      steps: {
        heading: 'How to Get Started',
        items: [
          { title: 'Review Integration Options', desc: 'Contact us to discuss your system and what data or functionality you need to connect.' },
          { title: 'Technical Discovery Call', desc: 'A 30-minute call with our technical team to map out the integration scope and timeline.' },
          { title: 'Sign Data Agreement', desc: 'We execute a data sharing or licensing agreement that covers security, privacy, and use restrictions.' },
          { title: 'Build and Launch', desc: 'Our team supports your integration build and tests the connection before going live.' },
        ],
      },
      cta: {
        heading: 'Explore Integration',
        subtitle: 'Contact us to discuss technology partnership and integration opportunities.',
        primaryLabel: 'Contact Us',
        primaryHref: '/contact',
        secondaryLabel: 'View Platform Features',
        secondaryHref: '/platform',
        bgColor: 'bg-brand-blue-700',
      },
    }} />
  );
}
