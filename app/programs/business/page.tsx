export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Business Administration | Certiport Certified | Indianapolis',
  description: 'Earn IT Specialist — Business Applications certification. 5-week program covering Microsoft Office, business communication, and office management.',
  alternates: { canonical: `${SITE_URL}/programs/business` },
  openGraph: {
    title: 'Business Administration | Certiport Certified | Indianapolis',
    description: 'Earn IT Specialist — Business Applications certification. 5-week program covering Microsoft Office, business communication, and office management.',
    url: `${SITE_URL}/programs/business`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Business Administration | Certiport Certified | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/business-finance.mp4',
  title: 'Business Administration', subtitle: 'Build professional business skills. Microsoft Office, communication, and office management in 5 weeks.',
  badge: 'Self-Pay', badgeColor: 'orange',
  duration: '5 weeks', cost: '$4,550', format: 'In-person, Indianapolis', credential: 'IT Specialist — Business Applications',
  overview: 'This 5-week program covers Microsoft Office Suite, business communication, office management, and professional development. You will create business documents, spreadsheets, presentations, and learn customer service fundamentals. Graduates earn the Certiport IT Specialist — Business Applications certification.',
  highlights: ['Microsoft Word, Excel, and PowerPoint proficiency', 'Business writing and professional communication', 'Office management and procedures', 'Customer service fundamentals', 'Certiport certification exam included', 'Professional development and networking'],
  overviewImage: '/images/programs-fresh/business.jpg', overviewImageAlt: 'Business professionals in a meeting',
  salaryNumber: 45000, salaryLabel: 'Average starting salary for business administration roles', salaryPrefix: '$',
  curriculum: [
    { title: 'Microsoft Office', topics: ['Word — documents and formatting', 'Excel — formulas and data analysis', 'PowerPoint — presentations', 'Outlook — email and calendar', 'Teams — collaboration'] },
    { title: 'Business Communication', topics: ['Professional writing', 'Email etiquette', 'Presentation skills', 'Meeting management', 'Conflict resolution'] },
    { title: 'Office Management', topics: ['Filing and records management', 'Scheduling and coordination', 'Vendor and supply management', 'Budget tracking basics', 'Office technology'] },
    { title: 'Professional Development', topics: ['Resume and cover letter writing', 'Interview preparation', 'Networking strategies', 'LinkedIn profile optimization', 'Workplace professionalism'] },
    { title: 'Certification Prep', topics: ['IT Specialist exam objectives', 'Practice exams', 'On-site Certiport testing', 'Career placement support'] },
  ],
  credentials: ['IT Specialist — Business Applications (Certiport exam)', 'Elevate Certificate of Completion'],
  careers: [
    { title: 'Administrative Assistant', salary: '$35,000–$48,000' },
    { title: 'Office Manager', salary: '$42,000–$58,000' },
    { title: 'Customer Service Representative', salary: '$32,000–$42,000' },
    { title: 'Executive Assistant', salary: '$45,000–$60,000' },
  ],
  faqs: [
    { q: 'Do I need prior computer experience?', a: 'Basic computer literacy is helpful but not required. We start with fundamentals and build up to professional-level skills.' },
    { q: 'Is this program eligible for WIOA funding?', a: 'This program is self-pay. However, some participants may qualify for workforce funding through their WorkOne career advisor. Contact us for details.' },
    { q: 'What certification do I earn?', a: 'You earn the Certiport IT Specialist — Business Applications certification, recognized by employers nationwide. The exam is included in tuition.' },
    { q: 'Are payment plans available?', a: 'Yes. We offer payment plans and Buy Now Pay Later (BNPL) options through Affirm and Sezzle.' },
    { q: 'What jobs can I get after this program?', a: 'Graduates work as administrative assistants, office managers, customer service representatives, and executive assistants. Average starting salary is $35,000-$48,000.' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Enroll', desc: 'Payment plans and BNPL options available.' },
    { title: 'Attend Orientation', desc: 'Meet your instructor and review the program.' },
    { title: 'Start Training', desc: 'Begin your 5-week business administration program.' },
  ],
  applyHref: '/apply?program=business',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Business Administration' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'business', name: config.title, slug: 'business', description: config.subtitle, duration_weeks: 5, price: 4550, image_url: `${SITE_URL}/images/programs-fresh/business.jpg`, category: 'Business', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
