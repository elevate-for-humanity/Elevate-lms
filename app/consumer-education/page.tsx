import type { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Consumer Education',
  description:
    'Free financial literacy, VITA tax preparation, and consumer education resources for Indiana residents. Know your rights, manage your money, and access benefits you qualify for.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/consumer-education' },
};

export default function ConsumerEducationPage() {
  return (
    <PublicLandingPage
      config={{
        breadcrumbs: [{ label: 'Community Services', href: '/community-services' }, { label: 'Consumer Education' }],
        hero: {
          image: '/images/pages/community-page-3.webp',
          tag: 'Consumer Education',
          tagColor: 'text-brand-blue-600',
          title: 'Know Your Rights. Manage Your Money.',
          subtitle: 'Free financial literacy resources, tax preparation assistance, and consumer protection guidance for Indiana residents.',
        },
        intro: {
          heading: 'Financial Literacy for Working Adults',
          paragraphs: [
            `${PLATFORM_DEFAULTS.orgName} provides free consumer education resources to help Indiana residents make informed financial decisions, access benefits they qualify for, and protect themselves from predatory practices.`,
            'Our VITA-certified volunteers prepare free federal and state tax returns for households earning under $67,000. We also offer workshops on budgeting, credit building, and navigating public benefits.',
          ],
          image: '/images/pages/community-page-4.webp',
        },
        features: {
          heading: 'What We Offer',
          items: [
            'Free VITA tax preparation for households earning under $67,000',
            'Financial literacy workshops: budgeting, saving, and credit building',
            'Benefits screening: SNAP, Medicaid, childcare assistance, utility help',
            'Consumer protection guidance: debt, predatory lending, tenant rights',
            'FAFSA and financial aid assistance for training programs',
            'Bank account opening support and credit union referrals',
            'Identity theft prevention and recovery resources',
            'One-on-one financial coaching by appointment',
          ],
        },
        steps: {
          heading: 'How to Access Services',
          items: [
            { title: 'Contact Us', desc: 'Call or email to schedule a tax appointment or financial coaching session.' },
            { title: 'Bring Your Documents', desc: 'For tax prep: photo ID, Social Security cards, W-2s, and prior year return if available.' },
            { title: 'Meet With a Counselor', desc: 'In-person or virtual sessions available. No cost, no judgment.' },
            { title: 'Get Connected', desc: 'We connect you to additional resources based on your situation.' },
          ],
        },
        cta: {
          heading: 'Schedule a Free Session',
          subtitle: `Tax prep, financial coaching, and benefits screening — all free for qualifying Indiana residents. Call ${PLATFORM_DEFAULTS.supportPhone} to schedule.`,
          primaryLabel: 'Contact Us',
          primaryHref: '/contact',
          secondaryLabel: 'Community Services',
          secondaryHref: '/community-services',
          bgColor: 'bg-brand-blue-700',
        },
      }}
    />
  );
}
