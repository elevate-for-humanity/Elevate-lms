export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Cosmetology Apprenticeship | Licensed Training | Indianapolis',
  description: 'Cosmetology apprenticeship in Indianapolis. Earn while you learn in licensed salons. Indiana Cosmetology License pathway.',
  alternates: { canonical: `${SITE_URL}/programs/cosmetology-apprenticeship` },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/cosmetology-salon.mp4', voiceoverSrc: '/audio/heroes/cosmetology.mp3',
  title: 'Cosmetology Apprenticeship', subtitle: 'Get paid during your apprenticeship. Become a licensed cosmetologist in 18 months with hands-on salon training.',
  badge: 'Earn While You Learn', badgeColor: 'red',
  duration: '18 months', cost: '$4,890 (payment plans available)', format: 'In-salon OJT + classroom, Indianapolis', credential: 'Indiana Cosmetology License',
  overview: 'This apprenticeship combines on-the-job training in licensed salons with structured classroom instruction. You will learn hair cutting, coloring, chemical services, skin care, nail care, and salon management. The program aligns with Indiana Professional Licensing Agency requirements for the Cosmetology License exam.',
  highlights: ['Hands-on training in licensed salons with real clients', 'Hair cutting, coloring, and chemical services', 'Skin care and nail care fundamentals', 'Salon management and client relations', 'Indiana Cosmetology License exam preparation', 'Earn income during your apprenticeship'],
  overviewImage: '/images/programs-fresh/cosmetology.jpg', overviewImageAlt: 'Cosmetology apprentice styling hair in a salon',
  salaryNumber: 35000, salaryLabel: 'Average starting salary for cosmetologists in Indiana', salaryPrefix: '$',
  curriculum: [
    { title: 'Hair Services', topics: ['Cutting and styling techniques', 'Color theory and application', 'Chemical straightening and perms', 'Extensions and weaves', 'Men\'s grooming'] },
    { title: 'Skin & Nails', topics: ['Facials and skin analysis', 'Waxing and hair removal', 'Manicure and pedicure', 'Nail art basics', 'Sanitation and safety'] },
    { title: 'Salon Business', topics: ['Client consultation', 'Retail product knowledge', 'Appointment scheduling', 'Social media marketing', 'Building a clientele'] },
    { title: 'Licensure Prep', topics: ['Indiana cosmetology law', 'Written exam preparation', 'Practical exam preparation', 'License application', 'Continuing education'] },
  ],
  credentials: ['Indiana Cosmetology License (exam prep)', 'Sanitation Certificate', 'Certificate of Completion'],
  careers: [
    { title: 'Licensed Cosmetologist', salary: '$28,000–$50,000' },
    { title: 'Hair Colorist', salary: '$35,000–$65,000' },
    { title: 'Salon Owner', salary: '$40,000–$100,000+' },
    { title: 'Bridal/Event Stylist', salary: '$35,000–$70,000' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Interview', desc: 'Meet with program staff and tour partner salons.' },
    { title: 'Enroll', desc: 'Payment plans available — weekly or monthly options.' },
    { title: 'Start Training', desc: 'Begin your apprenticeship in a licensed salon.' },
  ],
  applyHref: '/apply?program=cosmetology-apprenticeship',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Apprenticeships', href: '/programs/apprenticeships' }, { label: 'Cosmetology' }],
};

import SponsorDisclosure from '@/components/compliance/SponsorDisclosure';

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'cosmetology-apprenticeship', name: config.title, slug: 'cosmetology-apprenticeship', description: config.subtitle, duration_weeks: 78, price: 4890, image_url: `${SITE_URL}/images/programs-fresh/cosmetology.jpg`, category: 'Beauty & Cosmetology', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config}><SponsorDisclosure /></ProgramPageLayout></>);
}
