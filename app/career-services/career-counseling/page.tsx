import type { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Career Counseling',
  description: 'One-on-one career counseling for Elevate graduates and enrolled students. Career planning, credential pathways, and job search strategy.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/career-services/career-counseling' },
};

export default function CareerCounselingPage() {
  return (
    <PublicLandingPage
      config={{
        breadcrumbs: [{ label: 'Career Services', href: '/career-services' }, { label: 'Career Counseling' }],
        hero: {
          image: '/images/pages/career-services-page-1.webp',
          tag: 'Career Counseling',
          tagColor: 'text-brand-blue-600',
          title: 'Plan Your Career Path',
          subtitle: 'One-on-one sessions with a career counselor to map your credential pathway, set salary targets, and build a job search strategy.',
        },
        intro: {
          heading: 'Career Counseling for Real Outcomes',
          paragraphs: [
            'Career counseling at Elevate is not generic advice. Sessions are focused on your specific program, your local job market, and the employers who hire our graduates. We help you understand what credentials to pursue, what wages to expect, and how to position yourself for the jobs you want.',
            'Available to all enrolled students and graduates at no additional cost.',
          ],
          image: '/images/pages/career-services-page-2.jpg',
        },
        features: {
          heading: 'What We Cover',
          items: [
            'Career pathway mapping: which credentials lead where',
            'Local labor market data: wages, demand, and top employers',
            'Resume and LinkedIn profile review',
            'Interview preparation and salary negotiation coaching',
            'Job search strategy and employer targeting',
            'Credential renewal and continuing education planning',
            'Career change planning for mid-career adults',
            'Referrals to employer partners actively hiring graduates',
          ],
        },
        steps: {
          heading: 'How to Schedule',
          items: [
            { title: 'Contact Career Services', desc: 'Email or call to request a counseling appointment.' },
            { title: 'Complete a Brief Intake', desc: 'Tell us your program, goals, and timeline so we can prepare.' },
            { title: 'Meet With Your Counselor', desc: 'In-person or virtual sessions, typically 45–60 minutes.' },
            { title: 'Follow Up', desc: 'We check in at 30 and 90 days to track your progress and adjust the plan.' },
          ],
        },
        cta: {
          heading: 'Schedule a Session',
          subtitle: `Free for all enrolled students and graduates. Call ${PLATFORM_DEFAULTS.supportPhone} to schedule.`,
          primaryLabel: 'Contact Career Services',
          primaryHref: '/contact',
          secondaryLabel: 'All Career Services',
          secondaryHref: '/career-services',
          bgColor: 'bg-brand-blue-700',
        },
      }}
    />
  );
}
