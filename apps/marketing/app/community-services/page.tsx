import type { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Community Services | Elevate for Humanity',
  description:
    'Free community services for Indiana residents: VITA tax preparation, financial literacy, consumer education, reentry support, and workforce navigation.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/community-services' },
};

export default function CommunityServicesPage() {
  return (
    <PublicLandingPage
      config={{
        breadcrumbs: [{ label: 'Community Services' }],
        hero: {
          image: '/images/pages/community-page-1.jpg',
          tag: 'Community Services',
          tagColor: 'text-brand-blue-600',
          title: 'Free Services for Indiana Residents',
          subtitle: 'VITA tax preparation, financial literacy, consumer education, reentry support, and workforce navigation — all free for qualifying residents.',
        },
        intro: {
          heading: 'Beyond Training',
          paragraphs: [
            'Elevate for Humanity provides free community services that address the barriers keeping Indiana residents from economic stability. Training is one piece — but stable housing, accurate tax filing, and financial literacy are equally critical.',
            'Our community services are available to all Indiana residents, not just enrolled students. No referral required.',
          ],
          image: '/images/pages/community-page-2.jpg',
        },
        features: {
          heading: 'Available Services',
          items: [
            'VITA free tax preparation for households earning under $67,000',
            'Financial literacy workshops: budgeting, credit, and savings',
            'Benefits screening: SNAP, Medicaid, childcare, utility assistance',
            'Consumer education: debt, predatory lending, tenant rights',
            'Reentry support: employment barriers, expungement referrals',
            'Workforce navigation: WIOA eligibility, WorkOne referrals',
            'FAFSA and financial aid assistance',
            'Emergency resource referrals: food, housing, transportation',
          ],
        },
        steps: {
          heading: 'How to Access Services',
          items: [
            { title: 'Contact Us', desc: 'Call or email to describe what you need. No appointment required for most services.' },
            { title: 'Meet With a Navigator', desc: 'A community navigator will assess your situation and connect you to the right services.' },
            { title: 'Get Connected', desc: 'We provide direct referrals, warm handoffs, and follow-up to make sure you get what you need.' },
            { title: 'No Cost, No Judgment', desc: 'All community services are free and confidential.' },
          ],
        },
        cta: {
          heading: 'Get Help Today',
          subtitle: 'Free community services for all Indiana residents. No referral required. Call (317) 314-3757.',
          primaryLabel: 'Contact Us',
          primaryHref: '/contact',
          secondaryLabel: 'Consumer Education',
          secondaryHref: '/consumer-education',
          bgColor: 'bg-brand-blue-700',
        },
      }}
    />
  );
}
