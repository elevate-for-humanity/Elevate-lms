import type { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Job Placement',
  description: 'Job placement services for Elevate graduates. Employer connections, job leads, and placement support in healthcare, skilled trades, technology, and business.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/career-services/job-placement' },
};

export default function JobPlacementPage() {
  return (
    <PublicLandingPage
      config={{
        breadcrumbs: [{ label: 'Career Services', href: '/career-services' }, { label: 'Job Placement' }],
        hero: {
          image: '/images/pages/career-services-page-3.webp',
          tag: 'Job Placement',
          tagColor: 'text-brand-blue-600',
          title: 'From Credential to Career',
          subtitle: 'Direct employer connections, job leads, and placement support for Elevate graduates in healthcare, skilled trades, technology, and business.',
        },
        intro: {
          heading: 'We Do Not Just Train — We Place',
          paragraphs: [
            'Job placement is built into every Elevate program. We maintain active relationships with employers across Indiana who hire our graduates — and we make direct introductions when you are ready.',
            'Our placement team tracks every graduate for 90 days post-completion and works with you until you are employed in your field.',
          ],
          image: '/images/pages/career-services-page-4.webp',
        },
        features: {
          heading: 'Placement Services',
          items: [
            'Direct employer introductions to hiring partners in your field',
            'Job lead notifications matched to your credential and location',
            'Interview scheduling and preparation support',
            'Offer negotiation coaching',
            'Apprenticeship placement for DOL Registered programs',
            'Healthcare facility connections for CNA, MA, and phlebotomy graduates',
            'Employer job fair access — exclusive to Elevate graduates',
            '90-day follow-up to confirm placement and address barriers',
          ],
        },
        steps: {
          heading: 'The Placement Process',
          items: [
            { title: 'Complete Your Program', desc: 'Placement services activate when you are within 4 weeks of credential completion.' },
            { title: 'Meet With Placement Staff', desc: 'We review your resume, target employers, and geographic preferences.' },
            { title: 'Get Introduced', desc: 'We make direct introductions to employers who are actively hiring in your field.' },
            { title: 'Land the Job', desc: 'We support you through interviews and offer negotiation, then check in at 30 and 90 days.' },
          ],
        },
        cta: {
          heading: 'Ready to Work?',
          subtitle: `Job placement support is free for all Elevate graduates. Call ${PLATFORM_DEFAULTS.supportPhone}.`,
          primaryLabel: 'Contact Career Services',
          primaryHref: '/contact',
          secondaryLabel: 'Hire Our Graduates',
          secondaryHref: '/hire-graduates',
          bgColor: 'bg-brand-blue-700',
        },
      }}
    />
  );
}
