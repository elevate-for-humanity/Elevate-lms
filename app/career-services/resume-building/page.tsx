import type { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Resume Building',
  description: 'Free resume building and review for Elevate students and graduates. Credential-focused resumes that get callbacks from Indiana employers.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/career-services/resume-building' },
};

export default function ResumeBuildingPage() {
  return (
    <PublicLandingPage
      config={{
        breadcrumbs: [{ label: 'Career Services', href: '/career-services' }, { label: 'Resume Building' }],
        hero: {
          image: '/images/pages/career-services-page-4.webp',
          tag: 'Resume Building',
          tagColor: 'text-brand-blue-600',
          title: 'A Resume That Gets Callbacks',
          subtitle: 'Credential-focused resumes built for the jobs you are applying for — not a generic template.',
        },
        intro: {
          heading: 'Resumes Built for Skilled Trades and Technical Roles',
          paragraphs: [
            'Most resume templates are designed for office jobs. Skilled trades, healthcare, and technical roles require a different format — one that leads with credentials, certifications, and hands-on experience.',
            'Our career staff builds and reviews resumes specifically for the employers who hire Elevate graduates. Free for all enrolled students and graduates.',
          ],
          image: '/images/pages/career-services-page-3.webp',
        },
        features: {
          heading: 'What We Provide',
          items: [
            'Resume build from scratch for first-time job seekers',
            'Resume review and rewrite for career changers',
            'Credential and certification formatting for technical roles',
            'ATS optimization so your resume passes automated screening',
            'LinkedIn profile setup and optimization',
            'Cover letter templates by industry and role type',
            'Reference list preparation and coaching',
            'Ongoing updates as you earn new credentials',
          ],
        },
        steps: {
          heading: 'How to Get Started',
          items: [
            { title: 'Contact Career Services', desc: 'Email or call to request a resume session.' },
            { title: 'Share Your Background', desc: 'Send us your work history, credentials, and target job titles.' },
            { title: 'Review the Draft', desc: 'We build or revise your resume and walk through it with you.' },
            { title: 'Apply With Confidence', desc: 'Use your resume for job applications, apprenticeship programs, and employer fairs.' },
          ],
        },
        cta: {
          heading: 'Get Your Resume Built',
          subtitle: `Free for all enrolled students and graduates. Call ${PLATFORM_DEFAULTS.supportPhone} to get started.`,
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
