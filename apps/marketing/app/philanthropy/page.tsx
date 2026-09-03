import type { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Philanthropy & Giving',
  description:
    'Support workforce development in Indiana. Your gift funds training scholarships, equipment, and career services for underserved adults seeking economic mobility.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/philanthropy' },
};

export default function PhilanthropyPage() {
  return (
    <PublicLandingPage
      config={{
        breadcrumbs: [{ label: 'About', href: '/about' }, { label: 'Philanthropy' }],
        hero: {
          image: '/images/pages/community-page-1.webp',
          tag: 'Philanthropy & Giving',
          tagColor: 'text-brand-blue-600',
          title: 'Invest in Indiana Careers',
          subtitle:
            'Your support funds training scholarships, tools, and career services for adults who need a second chance — or a first one.',
        },
        intro: {
          heading: 'Why Workforce Philanthropy Matters',
          paragraphs: [
            `Most workforce training programs charge tuition that puts them out of reach for the people who need them most. ${PLATFORM_DEFAULTS.orgName} bridges that gap through WIOA funding, employer partnerships, and philanthropic support — but funding gaps remain for students who fall just outside eligibility thresholds.`,
            `Gifts to ${PLATFORM_DEFAULTS.orgName} directly fund training scholarships, tools and equipment, exam fees, and career placement services. Every dollar goes toward measurable outcomes: credentials earned, jobs secured, wages increased.`,
          ],
          image: '/images/pages/community-page-2.webp',
        },
        features: {
          heading: 'How Your Gift Is Used',
          items: [
            'Training scholarships for students who do not qualify for WIOA or WRG funding',
            'Exam and certification fees (CompTIA, EPA 608, NHA, OSHA)',
            'Tools, uniforms, and equipment for hands-on programs',
            'Career services: resume coaching, interview prep, job placement support',
            'Childcare and transportation assistance for enrolled students',
            'Technology access: laptops and internet for remote learners',
            'Instructor development and curriculum updates',
            'Emergency student support funds for housing and food insecurity',
          ],
        },
        steps: {
          heading: 'Ways to Give',
          items: [
            { title: 'One-Time Gift', desc: 'Make a direct contribution online. Any amount funds real training outcomes.' },
            { title: 'Recurring Giving', desc: 'Set up a monthly gift to provide sustained support for our scholarship fund.' },
            { title: 'Employer Matching', desc: 'Many employers match charitable contributions. Check with your HR department.' },
            { title: 'In-Kind Donations', desc: 'Donate tools, equipment, laptops, or professional services. Contact us to arrange.' },
          ],
        },
        cta: {
          heading: 'Make a Gift Today',
          subtitle: `Every contribution directly funds a student's path to a career. Call ${PLATFORM_DEFAULTS.supportPhone} or email info@elevateforhumanity.org.`,
          primaryLabel: 'Donate Now',
          primaryHref: '/donate',
          secondaryLabel: 'Contact Us',
          secondaryHref: '/contact',
          bgColor: 'bg-brand-blue-700',
        },
      }}
    />
  );
}
