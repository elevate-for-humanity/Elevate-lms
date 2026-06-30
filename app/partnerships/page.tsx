import type { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Partnerships',
  description:
    `Strategic partnerships with employers, workforce boards, community organizations, and technology providers. Partner with ${PLATFORM_DEFAULTS.orgName} to expand workforce development impact in Indiana.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/partnerships' },
};

export default function PartnershipsPage() {
  return (
    <PublicLandingPage
      config={{
        breadcrumbs: [{ label: 'Partners', href: '/partners' }, { label: 'Partnerships' }],
        hero: {
          image: '/images/pages/about-employer-partners.webp',
          tag: 'Partnerships',
          tagColor: 'text-brand-blue-600',
          title: 'Build Something That Lasts',
          subtitle: 'Employer, workforce, community, and technology partnerships that expand access to career training across Indiana.',
        },
        intro: {
          heading: 'Partnership Types',
          paragraphs: [
            `${PLATFORM_DEFAULTS.orgName} partners with employers who hire our graduates, workforce agencies who refer participants, community organizations who serve overlapping populations, and technology providers who integrate with our platform.`,
            'Every partnership is structured around a shared outcome: more Indiana residents with industry credentials and living-wage jobs.',
          ],
          image: '/images/pages/about-career-training.webp',
        },
        features: {
          heading: 'Partnership Opportunities',
          items: [
            'Employer partnerships: hire graduates, sponsor apprentices, provide OJT sites',
            'Workforce agency referrals: WorkOne, FSSA, reentry, social services',
            'Community organization co-enrollment and wraparound services',
            'Program holder agreements: host training at your facility',
            'Technology integrations: LMS, case management, job board APIs',
            'Philanthropic partnerships: scholarship funds and in-kind support',
            'Academic articulation: credit transfer agreements with colleges',
            'Government and grant partnerships: co-applicant on workforce grants',
          ],
        },
        steps: {
          heading: 'How to Partner',
          items: [
            { title: 'Tell Us About Your Organization', desc: 'Contact us with your organization type, size, and what you are trying to accomplish.' },
            { title: 'Explore the Fit', desc: 'We identify which partnership structure makes sense and what outcomes we can commit to.' },
            { title: 'Sign an Agreement', desc: 'We execute a partnership MOU or agreement covering roles, data, and expectations.' },
            { title: 'Launch and Measure', desc: 'We track shared outcomes and report back quarterly.' },
          ],
        },
        cta: {
          heading: 'Start a Partnership Conversation',
          subtitle: `Contact us to explore how we can work together. Call ${PLATFORM_DEFAULTS.supportPhone} or use the form below.`,
          primaryLabel: 'Contact Us',
          primaryHref: '/contact',
          secondaryLabel: 'View Partner Types',
          secondaryHref: '/partners',
          bgColor: 'bg-brand-blue-700',
        },
      }}
    />
  );
}
