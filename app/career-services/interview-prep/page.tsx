import type { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Interview Preparation',
  description: 'Free interview preparation for Elevate students and graduates. Mock interviews, industry-specific coaching, and salary negotiation guidance.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/career-services/interview-prep' },
};

export default function InterviewPrepPage() {
  return (
    <PublicLandingPage
      config={{
        breadcrumbs: [{ label: 'Career Services', href: '/career-services' }, { label: 'Interview Prep' }],
        hero: {
          image: '/images/pages/career-services-page-2.jpg',
          tag: 'Interview Preparation',
          tagColor: 'text-brand-blue-600',
          title: 'Walk In Confident',
          subtitle: 'Mock interviews, industry-specific coaching, and salary negotiation guidance — so you are ready when the opportunity comes.',
        },
        intro: {
          heading: 'Industry-Specific Interview Coaching',
          paragraphs: [
            'Generic interview advice does not work for skilled trades, healthcare, or technical roles. Our coaching is specific to your field — the questions employers actually ask, the certifications they verify, and the red flags they watch for.',
            'Available to all enrolled students and graduates at no cost.',
          ],
          image: '/images/pages/career-services-page-1.webp',
        },
        features: {
          heading: 'What We Cover',
          items: [
            'Mock interviews with field-specific questions',
            'STAR method coaching for behavioral questions',
            'Technical question preparation by credential type',
            'Professional appearance and presentation guidance',
            'Salary research and negotiation strategy',
            'Background check and reference preparation',
            'Video interview practice for remote positions',
            'Follow-up email and thank-you note templates',
          ],
        },
        steps: {
          heading: 'How It Works',
          items: [
            { title: 'Schedule a Session', desc: 'Contact career services to book a 45-minute interview prep session.' },
            { title: 'Share Your Target Role', desc: 'Tell us the job title and employer so we can tailor the coaching.' },
            { title: 'Run the Mock Interview', desc: 'We conduct a realistic interview and give detailed feedback.' },
            { title: 'Refine and Repeat', desc: 'Most students do 2–3 sessions before their first real interview.' },
          ],
        },
        cta: {
          heading: 'Book Interview Prep',
          subtitle: `Free for all enrolled students and graduates. Call ${PLATFORM_DEFAULTS.supportPhone} to book.`,
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
