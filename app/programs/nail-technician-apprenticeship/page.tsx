export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Nail Technician Apprenticeship | Licensed Training | Indianapolis',
  description: 'Nail technician apprenticeship in Indianapolis. Hands-on training in licensed salons. Indiana Manicurist License pathway.',
  alternates: { canonical: `${SITE_URL}/programs/nail-technician-apprenticeship` },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/cosmetology-salon.mp4',
  title: 'Nail Technician Apprenticeship', subtitle: 'Learn manicure, pedicure, gel, acrylic, and nail art. Earn your Indiana Manicurist License through hands-on salon training.',
  badge: 'Earn While You Learn', badgeColor: 'red',
  duration: '6–9 months', cost: '$3,500 (payment plans available)', format: 'In-salon OJT + classroom, Indianapolis', credential: 'Indiana Manicurist License',
  overview: 'This apprenticeship trains you in manicure, pedicure, gel nails, acrylic nails, nail art, and salon sanitation. You will work with real clients in a licensed salon under supervision. The program prepares you for the Indiana Manicurist License exam.',
  highlights: ['Manicure and pedicure techniques', 'Gel and acrylic nail application', 'Nail art and design', 'Salon sanitation and safety', 'Indiana Manicurist License exam preparation', 'Hands-on training with real clients'],
  overviewImage: '/images/programs-fresh/nail-tech.jpg', overviewImageAlt: 'Nail technician performing a manicure',
  salaryNumber: 33000, salaryLabel: 'Average annual salary for nail technicians in Indiana', salaryPrefix: '$',
  curriculum: [
    { title: 'Nail Services', topics: ['Natural nail care', 'Manicure and pedicure', 'Gel polish application', 'Acrylic nail systems', 'Nail repair and maintenance'] },
    { title: 'Nail Art', topics: ['Freehand nail art', 'Stamping and stencils', 'Foils and glitter', 'Ombre and gradient', 'Seasonal and trending designs'] },
    { title: 'Sanitation & Safety', topics: ['Indiana sanitation requirements', 'Tool disinfection', 'Bloodborne pathogen safety', 'Allergic reaction awareness', 'Ventilation and chemical safety'] },
    { title: 'Licensure Prep', topics: ['Indiana manicurist law', 'Written exam preparation', 'Practical exam preparation', 'License application', 'Continuing education'] },
  ],
  credentials: ['Indiana Manicurist License (exam prep)', 'Sanitation Certificate', 'Certificate of Completion'],
  careers: [
    { title: 'Nail Technician', salary: '$28,000–$42,000' },
    { title: 'Nail Salon Owner', salary: '$35,000–$80,000+' },
    { title: 'Spa Nail Specialist', salary: '$30,000–$45,000' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Interview', desc: 'Meet with program staff and tour partner salons.' },
    { title: 'Enroll', desc: 'Payment plans available.' },
    { title: 'Start Training', desc: 'Begin your apprenticeship in a licensed salon.' },
  ],
  applyHref: '/apply?program=nail-technician',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Apprenticeships', href: '/programs/apprenticeships' }, { label: 'Nail Technician' }],
};

import SponsorDisclosure from '@/components/compliance/SponsorDisclosure';

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'nail-technician-apprenticeship', name: config.title, slug: 'nail-technician-apprenticeship', description: config.subtitle, duration_weeks: 36, price: 3500, image_url: `${SITE_URL}/images/programs-fresh/nail-tech.jpg`, category: 'Beauty & Cosmetology', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config}><SponsorDisclosure /></ProgramPageLayout></>);
}
