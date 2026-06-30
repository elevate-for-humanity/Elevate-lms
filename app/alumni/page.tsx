import type { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Alumni Network',
  description:
    `${PLATFORM_DEFAULTS.orgName} alumni network. Career support, continuing education, mentorship, and community for program graduates.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/alumni' },
};

export default function AlumniPage() {
  return (
    <PublicLandingPage
      config={{
        breadcrumbs: [{ label: 'About', href: '/about' }, { label: 'Alumni' }],
        hero: {
          image: '/images/pages/community-page-2.webp',
          tag: 'Alumni Network',
          tagColor: 'text-brand-blue-600',
          title: 'Once Elevate, Always Elevate',
          subtitle: 'Career support, continuing education, mentorship opportunities, and a community of graduates who have been where you are.',
        },
        intro: {
          heading: 'Your Career Does Not End at Graduation',
          paragraphs: [
            `${PLATFORM_DEFAULTS.orgName} alumni have access to ongoing career services, continuing education discounts, and a growing network of graduates working in healthcare, skilled trades, technology, and business across Indiana.`,
            'Whether you need a credential renewal, a job change, or just a connection to someone in your field — the alumni network is here.',
          ],
          image: '/images/pages/community-page-1.webp',
        },
        features: {
          heading: 'Alumni Benefits',
          items: [
            'Lifetime access to career services: resume updates, interview prep, job leads',
            'Discounted rates on continuing education and credential renewal courses',
            'Mentorship opportunities — give back by mentoring current students',
            'Alumni job board with employer partners who prefer Elevate graduates',
            'Networking events and industry meetups',
            'Priority enrollment for advanced credential programs',
            'Reference letters and employer introductions',
            'Access to the alumni Slack community and LinkedIn group',
          ],
        },
        steps: {
          heading: 'Stay Connected',
          items: [
            { title: 'Update Your Profile', desc: 'Let us know where you landed. Your outcome helps future students and our funding.' },
            { title: 'Join the Network', desc: 'Connect with other graduates on LinkedIn and in our alumni community.' },
            { title: 'Mentor a Student', desc: 'Spend an hour with a current student in your field. It makes a real difference.' },
            { title: 'Come Back for More', desc: 'Alumni get discounted rates on advanced credentials and continuing education.' },
          ],
        },
        cta: {
          heading: 'Stay in Touch',
          subtitle: `Update your contact info, access career services, or explore what's next. Call ${PLATFORM_DEFAULTS.supportPhone}.`,
          primaryLabel: 'Contact Us',
          primaryHref: '/contact',
          secondaryLabel: 'Success Stories',
          secondaryHref: '/success-stories',
          bgColor: 'bg-brand-blue-700',
        },
      }}
    />
  );
}
