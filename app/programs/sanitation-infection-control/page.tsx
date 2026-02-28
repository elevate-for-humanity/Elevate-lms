export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Sanitation & Infection Control | Certified | Indianapolis',
  description: 'Sanitation and infection control certification. Required for barber, cosmetology, and healthcare programs. 1-2 day course.',
  alternates: { canonical: `${SITE_URL}/programs/sanitation-infection-control` },
  openGraph: {
    title: 'Sanitation & Infection Control | Certified | Indianapolis',
    description: 'Sanitation and infection control certification. Required for barber, cosmetology, and healthcare programs. 1-2 day course.',
    url: `${SITE_URL}/programs/sanitation-infection-control`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Sanitation & Infection Control | Certified | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/healthcare-cna.mp4',
  title: 'Sanitation & Infection Control', subtitle: 'Earn your sanitation and infection control certification. Required for barber, cosmetology, and healthcare programs.',
  badge: 'Required Certification', badgeColor: 'red',
  duration: '1–2 days', cost: 'Included with funded programs', format: 'In-person, Indianapolis', credential: 'Sanitation Certificate',
  overview: 'This short course covers sanitation, disinfection, sterilization, bloodborne pathogen safety, and infection control procedures. It is required for all barber, cosmetology, and nail technician programs and is recommended for healthcare students. You receive your certification upon completion.',
  highlights: ['Sanitation and disinfection procedures', 'Sterilization methods and equipment', 'Bloodborne pathogen safety (OSHA BBP)', 'Indiana Board of Cosmetology requirements', 'Infection control for healthcare settings', 'Same-day or next-day certification'],
  overviewImage: '/images/programs-fresh/sanitation.jpg', overviewImageAlt: 'Sanitation training with disinfection equipment',
  salaryNumber: 0, salaryLabel: 'Required certification for beauty and healthcare careers', salaryPrefix: '',
  curriculum: [
    { title: 'Sanitation Basics', topics: ['Cleaning vs disinfecting vs sterilizing', 'EPA-registered disinfectants', 'Contact time requirements', 'Surface and tool sanitation', 'Laundry and linen handling'] },
    { title: 'Infection Control', topics: ['Bloodborne pathogen standard', 'Universal precautions', 'PPE selection and use', 'Exposure incident procedures', 'Hand hygiene protocols'] },
    { title: 'Regulatory Compliance', topics: ['Indiana Board of Cosmetology rules', 'OSHA BBP standard', 'Inspection readiness', 'Record keeping', 'Certification documentation'] },
  ],
  careers: [
    { title: 'Licensed Barber', salary: '$30,000–$60,000+' },
    { title: 'Cosmetologist', salary: '$28,000–$50,000+' },
    { title: 'Nail Technician', salary: '$26,000–$42,000' },
    { title: 'Medical Assistant', salary: '$36,000–$44,000' },
    { title: 'CNA / Patient Care Aide', salary: '$30,000–$38,000' },
  ],
  credentials: ['Elevate Sanitation & Infection Control Certificate', 'OSHA Bloodborne Pathogen Awareness (training completion)'],
  steps: [
    { title: 'Register', desc: 'Sign up for the next available sanitation class.' },
    { title: 'Attend Class', desc: 'Complete 1-2 days of instruction and demonstration.' },
    { title: 'Pass Assessment', desc: 'Demonstrate sanitation procedures and pass the written test.' },
    { title: 'Get Certified', desc: 'Receive your sanitation certificate upon completion.' },
  ],
  faqs: [
    { question: 'Is this course required?', answer: 'Yes, for all barber, cosmetology, and nail technician programs. It is also recommended for healthcare students. Indiana requires sanitation certification before you can work with clients.' },
    { question: 'Is this included with other programs?', answer: 'Yes. Sanitation certification is included at no extra cost with all beauty and apprenticeship programs. It can also be taken as a standalone course.' },
  ],
  applyHref: '/apply?program=sanitation',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Sanitation & Infection Control' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'sanitation-infection-control', name: config.title, slug: 'sanitation-infection-control', description: config.subtitle, duration_weeks: 1, price: 0, image_url: `${SITE_URL}/images/programs-fresh/sanitation.jpg`, category: 'Healthcare', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
