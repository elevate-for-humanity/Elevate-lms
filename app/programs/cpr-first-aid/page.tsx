export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'CPR & First Aid Certification | Same-Day | Indianapolis',
  description: 'American Heart Association CPR, First Aid, and AED certification. Same-day certification available. Required for healthcare and trades programs.',
  alternates: { canonical: `${SITE_URL}/programs/cpr-first-aid` },
  openGraph: {
    title: 'CPR & First Aid Certification | Same-Day | Indianapolis',
    description: 'American Heart Association CPR, First Aid, and AED certification. Same-day certification available. Required for healthcare and trades programs.',
    url: `${SITE_URL}/programs/cpr-first-aid`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'CPR & First Aid Certification | Same-Day | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/healthcare-cna.mp4', voiceoverSrc: '/audio/heroes/cpr.mp3',
  title: 'CPR & First Aid Certification', subtitle: 'Earn American Heart Association CPR, First Aid, and AED certification in one day.',
  badge: 'Same-Day Certification', badgeColor: 'red',
  duration: '1 day (8 hours)', cost: 'Included with funded programs', format: 'In-person, Indianapolis', credential: 'AHA CPR/First Aid/AED',
  overview: 'This one-day course covers adult, child, and infant CPR, AED use, choking relief, and basic first aid. Training follows American Heart Association guidelines and includes hands-on practice with manikins and AED trainers. You receive your certification card the same day. This certification is required for all healthcare programs and many trades programs.',
  highlights: ['Adult, child, and infant CPR techniques', 'AED (Automated External Defibrillator) operation', 'Choking relief for all ages', 'Basic first aid and wound care', 'Same-day certification card', 'American Heart Association guidelines'],
  overviewImage: '/images/programs-fresh/cpr-first-aid.jpg', overviewImageAlt: 'Students practicing CPR on training manikins',
  salaryNumber: 0, salaryLabel: 'Required certification for healthcare and trades careers', salaryPrefix: '',
  curriculum: [
    { title: 'CPR Skills', topics: ['Adult CPR technique', 'Child CPR technique', 'Infant CPR technique', 'Compression depth and rate', 'Rescue breathing'] },
    { title: 'AED & Choking', topics: ['AED pad placement', 'AED operation steps', 'Adult choking relief', 'Child and infant choking', 'Recovery position'] },
    { title: 'First Aid', topics: ['Wound care and bandaging', 'Burns and heat emergencies', 'Allergic reactions', 'Seizure response', 'When to call 911'] },
  ],
  credentials: ['AHA CPR/First Aid/AED Certification (2-year validity)'],
  steps: [
    { title: 'Register', desc: 'Sign up for the next available CPR class.' },
    { title: 'Attend Class', desc: 'Complete 8 hours of instruction and hands-on practice.' },
    { title: 'Pass Skills Check', desc: 'Demonstrate CPR and AED skills for your instructor.' },
    { title: 'Get Certified', desc: 'Receive your AHA certification card the same day.' },
  ],
  faqs: [
    { question: 'How long is the certification valid?', answer: 'AHA CPR/First Aid/AED certification is valid for 2 years from the date of issue.' },
    { question: 'Is this included with other programs?', answer: 'Yes. CPR/First Aid certification is included at no extra cost with all healthcare programs (CNA, Medical Assistant, Phlebotomy) and most trades programs.' },
    { question: 'Can I take this as a standalone course?', answer: 'Yes. You can register for CPR/First Aid certification without enrolling in any other program. Contact us for the next available class date and pricing.' },
  ],
  applyHref: '/apply?program=cpr-first-aid',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Healthcare', href: '/programs/healthcare' }, { label: 'CPR & First Aid' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'cpr-first-aid', name: config.title, slug: 'cpr-first-aid', description: config.subtitle, duration_weeks: 1, price: 0, image_url: `${SITE_URL}/images/programs-fresh/cpr-first-aid.jpg`, category: 'Healthcare', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
