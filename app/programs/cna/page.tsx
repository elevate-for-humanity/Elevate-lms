export const dynamic = 'force-static';
export const revalidate = 86400;

import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'CNA Certification Program | Free with WIOA | Indianapolis',
  description: 'Become a Certified Nursing Assistant in 4-6 weeks. State exam prep, clinical hours, and job placement included. Free for eligible participants through WIOA.',
  alternates: { canonical: `${SITE_URL}/programs/cna` },
  openGraph: {
    title: 'CNA Certification Program | Free with WIOA | Indianapolis',
    description: 'Become a Certified Nursing Assistant in 4-6 weeks. State exam prep, clinical hours, and job placement included. Free for eligible participants through WIOA.',
    url: `${SITE_URL}/programs/cna`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'CNA Certification Program | Free with WIOA | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/cna-hero.mp4',
  voiceoverSrc: '/audio/heroes/cna.mp3',

  title: 'CNA Certification',
  subtitle: 'Become a Certified Nursing Assistant in 4–6 weeks. Clinical hours, state exam prep, and job placement included.',
  badge: 'Free with WIOA',
  badgeColor: 'green',

  duration: '4–6 weeks',
  cost: '$0 with WIOA funding',
  format: 'In-person, Indianapolis',
  credential: 'Indiana CNA License',

  overview: 'This state-approved program prepares you for the Indiana CNA certification exam. You will complete classroom instruction and supervised clinical hours at a healthcare facility. Training covers patient care, vital signs, infection control, safety, and communication. Graduates are eligible to sit for the Indiana State CNA Competency Exam.',
  highlights: [
    'State-approved curriculum meeting Indiana Health requirements',
    'Supervised clinical hours at a healthcare facility',
    'Indiana CNA Competency Exam prep and scheduling',
    'CPR/First Aid and BLS certification included',
    'Job placement assistance with 50+ healthcare employer partners',
    'Scrubs, textbook, and supplies provided with funding',
  ],
  overviewImage: '/images/programs-fresh/cna-nursing.jpg',
  overviewImageAlt: 'CNA student practicing patient care skills',

  salaryNumber: 38000,
  salaryLabel: 'Average starting salary for CNAs in Indiana',
  salaryPrefix: '$',

  curriculum: [
    {
      title: 'Patient Care Fundamentals',
      topics: ['Activities of daily living (ADLs)', 'Bathing, grooming, dressing', 'Feeding and nutrition', 'Mobility and transfers', 'Bed making and positioning'],
    },
    {
      title: 'Clinical Skills',
      topics: ['Vital signs (BP, pulse, temp, respiration)', 'Intake and output measurement', 'Specimen collection', 'Catheter care', 'Blood glucose monitoring'],
    },
    {
      title: 'Safety & Infection Control',
      topics: ['Hand hygiene and PPE', 'Standard precautions', 'Fall prevention', 'Fire safety and emergency procedures', 'Body mechanics and ergonomics'],
    },
    {
      title: 'Communication & Rights',
      topics: ['Patient rights and dignity', 'HIPAA compliance', 'Documentation and reporting', 'Team communication', 'Cultural sensitivity'],
    },
    {
      title: 'Clinical Rotation',
      topics: ['Supervised patient care', 'Long-term care facility experience', 'Skills demonstration', 'Clinical evaluation', 'Professional conduct'],
    },
    {
      title: 'Exam Preparation',
      topics: ['Written exam review', 'Skills demonstration practice', 'State exam registration', 'Test-taking strategies', 'License application process'],
    },
  ],

  credentials: [
    'Indiana CNA License',
    'CPR/First Aid Certification',
    'BLS Certification',
  ],

  careers: [
    { title: 'Certified Nursing Assistant', salary: '$32,000–$42,000' },
    { title: 'Home Health Aide', salary: '$28,000–$36,000' },
    { title: 'Patient Care Technician', salary: '$34,000–$44,000' },
    { title: 'Medical Assistant (with additional training)', salary: '$36,000–$46,000' },
  ],

  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Most students qualify for free training through WIOA.' },
    { title: 'Background Check', desc: 'Healthcare programs require a background check and drug screen.' },
    { title: 'Start Training', desc: 'Begin classroom instruction and clinical rotations.' },
  ],

  faqs: [
    { question: 'Is the CNA program really free?', answer: 'Yes, for eligible participants. WIOA funding covers tuition, textbook, scrubs, supplies, and the state exam fee. You pay nothing out of pocket if you qualify.' },
    { question: 'Do I need any prior healthcare experience?', answer: 'No. This program is designed for complete beginners. You need a high school diploma or GED, and you must pass a background check and drug screen.' },
    { question: 'How soon can I start working after graduation?', answer: 'Most graduates begin working within 2-4 weeks of passing the state exam. Our career services team connects you directly with hiring employers.' },
    { question: 'What is the state exam like?', answer: 'The Indiana CNA Competency Exam has two parts: a written test (60 multiple-choice questions) and a skills demonstration (you perform 5 randomly selected skills in front of an evaluator). We prepare you for both.' },
    { question: 'Can I work while in the CNA program?', answer: 'The program is full-time during the day (Monday-Friday). Some students work evenings or weekends. Talk to your advisor about scheduling.' },
  ],

  applyHref: '/apply?program=cna',

  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Healthcare', href: '/programs/healthcare' },
    { label: 'CNA Certification' },
  ],
};

export default function Page() {
  return (
    <>
      <ProgramStructuredData program={{
        id: 'cna',
        name: 'CNA Certification Program',
        slug: 'cna',
        description: config.subtitle,
        duration_weeks: 6,
        price: 0,
        image_url: `${SITE_URL}/images/programs-fresh/cna-nursing.jpg`,
        category: 'Healthcare',
        outcomes: ['Indiana CNA License', 'CPR/First Aid Certification', 'BLS Certification'],
      }} />
      <ProgramPageLayout config={config} />
    </>
  );
}
