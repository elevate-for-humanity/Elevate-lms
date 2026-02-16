import { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';

export const metadata: Metadata = {
  title: 'LMS Licensing & Sales | Elevate for Humanity',
  description: 'License the Elevate LMS platform for your training organization. White-label workforce training technology.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/sales' },
};

export default function SalesPage() {
  return (
    <PublicLandingPage config={{
      breadcrumbs: [{ label: 'Partners', href: '/partners' }, { label: 'LMS Licensing' }],
      hero: {
        image: '/images/artlist/office-meeting.jpg',
        tag: 'Technology',
        tagColor: 'text-purple-300',
        title: 'LMS Licensing',
        subtitle: 'License the Elevate platform for your training organization. Enrollment, LMS, career services, and compliance — all in one system.',
      },
      intro: {
        heading: 'Workforce Training Technology',
        paragraphs: [
          'The Elevate platform powers enrollment, learning management, career services, and compliance reporting for workforce training providers. It\'s built specifically for WIOA-funded programs, apprenticeships, and career certification training.',
          'License the platform for your organization and customize it with your branding, programs, and workflows. We handle hosting, updates, and technical support.',
        ],
      },
      features: {
        heading: 'Platform Capabilities',
        items: [
          'Online enrollment and application processing',
          'Learning management system with course builder',
          'Student progress tracking and certification management',
          'Career services portal with resume builder and job matching',
          'Employer portal for job posting and candidate browsing',
          'WIOA/DOL compliance reporting and data exports',
        ],
      },
      cta: {
        heading: 'Interested in Licensing?',
        subtitle: 'Contact us for a demo and pricing information.',
        primaryLabel: 'Contact Us',
        primaryHref: '/contact',
        secondaryLabel: 'View Features',
        secondaryHref: '/features',
        bgColor: 'bg-purple-700',
      },
    }} />
  );
}
