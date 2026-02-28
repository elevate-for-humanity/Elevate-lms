export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Culinary Apprenticeship | ServSafe Certified | Indianapolis',
  description: 'Culinary apprenticeship in Indianapolis. Hands-on kitchen training. ServSafe Food Handler certification. Earn while you learn.',
  alternates: { canonical: `${SITE_URL}/programs/culinary-apprenticeship` },
  openGraph: {
    title: 'Culinary Apprenticeship | ServSafe Certified | Indianapolis',
    description: 'Culinary apprenticeship in Indianapolis. Hands-on kitchen training. ServSafe Food Handler certification. Earn while you learn.',
    url: `${SITE_URL}/programs/culinary-apprenticeship`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Culinary Apprenticeship | ServSafe Certified | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/training-providers-hero.mp4',
  title: 'Culinary Apprenticeship', subtitle: 'Train in professional kitchens. Earn ServSafe certification and launch your culinary career.',
  badge: 'Accepting Interest', badgeColor: 'orange',
  statusNotice: 'This apprenticeship requires employer training sites. We are actively recruiting kitchen partners. Submit an interest form to be notified when enrollment opens.',
  duration: '12 months', cost: '$0 with WIOA funding', format: 'In-kitchen OJT + classroom, Indianapolis', credential: 'ServSafe Food Handler',
  overview: 'This apprenticeship combines on-the-job training in professional kitchens with structured classroom instruction. You will learn knife skills, cooking techniques, food safety, menu planning, and kitchen management. Graduates earn ServSafe Food Handler certification and are prepared for line cook, prep cook, and kitchen supervisor positions.',
  highlights: ['Hands-on training in professional kitchens', 'Knife skills and cooking techniques', 'ServSafe Food Handler certification', 'Menu planning and food costing', 'Kitchen management and leadership', 'Earn income during your apprenticeship'],
  overviewImage: '/images/programs-fresh/culinary.jpg', overviewImageAlt: 'Culinary apprentice preparing food in a professional kitchen',
  salaryNumber: 35000, salaryLabel: 'Average starting salary for cooks in Indiana (BLS)', salaryPrefix: '$',
  curriculum: [
    { title: 'Culinary Fundamentals', topics: ['Knife skills and cuts', 'Cooking methods (sauté, braise, roast)', 'Stocks, sauces, and soups', 'Baking basics', 'Plating and presentation'] },
    { title: 'Food Safety', topics: ['ServSafe Food Handler certification', 'Temperature control', 'Cross-contamination prevention', 'Allergen awareness', 'Cleaning and sanitizing'] },
    { title: 'Kitchen Operations', topics: ['Station setup and mise en place', 'Inventory and ordering', 'Food costing and portioning', 'Menu planning', 'Waste reduction'] },
    { title: 'Career Development', topics: ['Kitchen hierarchy and roles', 'Resume and interview prep', 'Restaurant industry overview', 'Advancement pathways', 'Career placement support'] },
  ],
  credentials: ['ServSafe Food Handler (NRA exam)', 'Elevate Certificate of Completion'],
  careers: [
    { title: 'Line Cook', salary: '$30,000–$40,000' },
    { title: 'Prep Cook', salary: '$28,000–$35,000' },
    { title: 'Sous Chef (with experience)', salary: '$40,000–$55,000' },
    { title: 'Kitchen Manager', salary: '$42,000–$58,000' },
  ],
  faqs: [
    { q: 'Do I need cooking experience to apply?', a: 'No prior experience is required. This apprenticeship starts with fundamentals and builds your skills through hands-on training in a professional kitchen.' },
    { q: 'Where does the hands-on training take place?', a: 'You train at approved partner restaurant and kitchen facilities in the Indianapolis area. Elevate matches you with a training site based on your interests and location.' },
    { q: 'Do I get paid during the apprenticeship?', a: 'Yes. As a registered apprentice, you are employed by the partner kitchen and earn wages while you learn. OJT wage reimbursement may also apply for the employer.' },
    { q: 'What is ServSafe certification?', a: 'ServSafe is the industry-standard food safety certification issued by the National Restaurant Association. Most restaurants and food service employers require it. The exam is included in this program.' },
    { q: 'Is this program eligible for WIOA funding?', a: 'Yes. Eligible participants may qualify for no-cost training through WIOA. Register at Indiana Career Connect and schedule an appointment with your WorkOne career advisor.' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Interview', desc: 'Meet with program staff and tour partner kitchens.' },
    { title: 'Start Cooking', desc: 'Begin your apprenticeship in a professional kitchen.' },
  ],
  applyHref: '/inquiry?program=culinary-apprenticeship',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Apprenticeships', href: '/programs/apprenticeships' }, { label: 'Culinary' }],
};

import SponsorDisclosure from '@/components/compliance/SponsorDisclosure';

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'culinary-apprenticeship', name: config.title, slug: 'culinary-apprenticeship', description: config.subtitle, duration_weeks: 52, price: 0, image_url: `${SITE_URL}/images/programs-fresh/culinary.jpg`, category: 'Culinary', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config}><SponsorDisclosure /></ProgramPageLayout></>);
}
