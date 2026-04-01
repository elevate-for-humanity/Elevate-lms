import { Metadata } from 'next';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';

export const dynamic = 'force-static';
export const revalidate = 86400;
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Micro Programs | Short-Term Certifications | Indianapolis',
  description: 'CPR, OSHA 10, ServSafe, Sanitation, and other short-term certifications. Same-day to 2-week programs.',
  alternates: { canonical: `${SITE_URL}/programs/micro-programs` },
  openGraph: {
    title: 'Micro Programs | Short-Term Certifications | Indianapolis',
    description: 'CPR, OSHA 10, ServSafe, Sanitation, and other short-term certifications. Same-day to 2-week programs.',
    url: `${SITE_URL}/programs/micro-programs`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Micro Programs | Short-Term Certifications | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/lms-learning.mp4',
  title: 'Micro Programs', subtitle: 'Short-term certifications you can earn in 1 day to 2 weeks. Stack credentials to boost your resume.',
  badge: 'Quick Certifications', badgeColor: 'red',
  duration: '1 day – 2 weeks', cost: 'Included with funded programs', format: 'In-person, Indianapolis', credential: 'Multiple Certifications',
  overview: 'Micro programs are short-term certification courses that can be completed in as little as one day. They are included at no extra cost with most funded training programs, or can be taken as standalone courses. Stack multiple certifications to make your resume stand out to employers.',
  highlights: ['Same-day certification available for some courses', 'Included with most funded training programs at no extra cost', 'Nationally recognized certifications', 'Stack multiple credentials', 'Available as standalone courses', 'No prerequisites for most courses'],
  overviewImage: '/images/pages/micro-programs.jpg', overviewImageAlt: 'Students in a certification training session',
  salaryNumber: 0, salaryLabel: 'Boost your resume with stackable credentials', salaryPrefix: '',
  curriculum: [
    { title: 'Safety Certifications', topics: ['CPR/First Aid/AED (AHA)', 'OSHA 10-Hour Construction', 'OSHA 30-Hour Construction', 'Bloodborne Pathogen Safety', 'Fire Safety Awareness'] },
    { title: 'Industry Certifications', topics: ['ServSafe Food Handler', 'Sanitation & Infection Control', 'Rise Up Certification', 'NCCER Core Curriculum', 'EPA 608 (with HVAC program)'] },
    { title: 'Professional Development', topics: ['Microsoft Office Specialist', 'QuickBooks Certified User', 'Digital Literacy', 'Workplace Readiness', 'Financial Literacy'] },
  ],
  careers: [
    { title: 'Construction Laborer (with OSHA 10/30)', salary: '$32,000–$45,000' },
    { title: 'Food Service Worker (with ServSafe)', salary: '$28,000–$36,000' },
    { title: 'Healthcare Aide (with CPR/First Aid)', salary: '$30,000–$38,000' },
    { title: 'Office Administrator (with Microsoft Office)', salary: '$34,000–$44,000' },
    { title: 'Bookkeeper (with QuickBooks)', salary: '$36,000–$48,000' },
  ],
  credentials: ['CPR/First Aid/AED (AHA/HSI issued)', 'OSHA 10/30-Hour (DOL card)', 'ServSafe Food Handler (NRA exam)', 'Elevate Sanitation Certificate', 'Rise Up (NRF Foundation)', 'NCCER Core (NCCER exam)'],
  steps: [
    { title: 'Choose a Course', desc: 'Browse available micro programs and certifications.' },
    { title: 'Register', desc: 'Sign up for the next available class date.' },
    { title: 'Complete Training', desc: 'Attend the course and pass the assessment.' },
    { title: 'Get Certified', desc: 'Receive your certification — often the same day.' },
  ],
  faqs: [
    { question: 'What do micro programs cost?', answer: 'Micro programs are included at no extra cost with most funded training programs (WIOA, WRG, Job Ready Indy). Standalone pricing varies by course. Contact us for current pricing.' },
    { question: 'Do I need to be enrolled in another program?', answer: 'No. You can take any micro program as a standalone course. However, they are included at no additional cost with most funded training programs.' },
    { question: 'How long do certifications last?', answer: 'Validity varies: CPR/First Aid is 2 years, OSHA cards do not expire, ServSafe is 5 years. Check individual course details.' },
  ],
  applyHref: '/apply?program=micro-programs',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Micro Programs' }],
};

export default function Page() {
  return <ProgramPageLayout config={config} />;
}
