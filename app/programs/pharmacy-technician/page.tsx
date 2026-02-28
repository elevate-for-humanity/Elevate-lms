export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Pharmacy Technician | PTCB Certified | Indianapolis',
  description: 'Prepare for the PTCB Certified Pharmacy Technician exam. 10-week program. Pharmacy techs earn $37,790/year in Indiana.',
  alternates: { canonical: `${SITE_URL}/programs/pharmacy-technician` },
  openGraph: {
    title: 'Pharmacy Technician | PTCB Certified | Indianapolis',
    description: 'Prepare for the PTCB Certified Pharmacy Technician exam. 10-week program. Pharmacy techs earn $37,790/year in Indiana.',
    url: `${SITE_URL}/programs/pharmacy-technician`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Pharmacy Technician | PTCB Certified | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/healthcare-cna.mp4',
  voiceoverSrc: '/audio/heroes/healthcare.mp3',
  title: 'Pharmacy Technician', subtitle: 'Prepare medications, manage inventory, and assist pharmacists. Prepare for PTCB certification in 10 weeks.',
  badge: 'Funding Available', badgeColor: 'green',
  duration: '10 weeks', cost: '$0 with WIOA funding', format: 'In-person, Indianapolis', credential: 'PTCB Exam Prep',
  overview: 'This 10-week program covers pharmacy law, pharmacology, medication preparation, inventory management, and insurance billing. You will learn to use pharmacy software systems and practice compounding techniques. Graduates are prepared for the Pharmacy Technician Certification Board (PTCB) exam.',
  highlights: ['Pharmacy law and regulations', 'Medication preparation and compounding', 'Pharmacy software and billing systems', 'Inventory management and ordering', 'PTCB certification exam preparation', 'Externship at a pharmacy site'],
  overviewImage: '/images/programs-fresh/pharmacy.jpg', overviewImageAlt: 'Pharmacy technician preparing medications',
  salaryNumber: 37790, salaryLabel: 'Average annual salary for pharmacy techs in Indiana (BLS)', salaryPrefix: '$',
  curriculum: [
    { title: 'Pharmacology', topics: ['Drug classifications', 'Generic vs brand names', 'Drug interactions', 'Dosage forms', 'Routes of administration'] },
    { title: 'Pharmacy Law', topics: ['Federal and state regulations', 'Controlled substance schedules', 'DEA requirements', 'HIPAA compliance', 'Board of Pharmacy rules'] },
    { title: 'Medication Prep', topics: ['Prescription interpretation', 'Compounding basics', 'IV admixture introduction', 'Unit dose packaging', 'Quality control checks'] },
    { title: 'Pharmacy Operations', topics: ['Pharmacy software systems', 'Insurance billing and adjudication', 'Inventory management', 'Ordering and receiving', 'Customer service'] },
    { title: 'Certification Prep', topics: ['PTCB exam objectives', 'Pharmacy calculations', 'Practice exams', 'Externship hours', 'Career placement support'] },
  ],
  credentials: ['PTCB Exam Preparation', 'CPR/First Aid', 'Certificate of Completion'],
  careers: [
    { title: 'Pharmacy Technician (Retail)', salary: '$32,000–$42,000' },
    { title: 'Pharmacy Technician (Hospital)', salary: '$36,000–$48,000' },
    { title: 'Pharmacy Inventory Specialist', salary: '$34,000–$44,000' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Background Check', desc: 'Pharmacy programs require a background check and drug screen.' },
    { title: 'Start Training', desc: 'Begin your 10-week pharmacy technician program.' },
  ],
  faqs: [
    { question: 'Do I need pharmacy experience?', answer: 'No. This program teaches everything from the ground up. A high school diploma or GED is required.' },
    { question: 'What is the PTCB exam?', answer: 'The Pharmacy Technician Certification Board (PTCB) exam is the national certification for pharmacy technicians. Most employers require or prefer PTCB-certified technicians.' },
  ],
  applyHref: '/apply?program=pharmacy-technician',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Healthcare', href: '/programs/healthcare' }, { label: 'Pharmacy Technician' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'pharmacy-technician', name: config.title, slug: 'pharmacy-technician', description: config.subtitle, duration_weeks: 10, price: 0, image_url: `${SITE_URL}/images/programs-fresh/pharmacy.jpg`, category: 'Healthcare', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
