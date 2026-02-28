export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'CDL Training | Class A License | Indianapolis',
  description: 'Earn your CDL Class A license in 3-6 weeks. Free for eligible participants through WIOA. Truck drivers earn $50,000-$75,000/year.',
  alternates: { canonical: `${SITE_URL}/programs/cdl-training` },
  openGraph: {
    title: 'CDL Training | Class A License | Indianapolis',
    description: 'Earn your CDL Class A license in 3-6 weeks. Free for eligible participants through WIOA. Truck drivers earn $50,000-$75,000/year.',
    url: `${SITE_URL}/programs/cdl-training`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'CDL Training | Class A License | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/cdl-hero.mp4', voiceoverSrc: '/audio/heroes/cdl.mp3',
  title: 'CDL Class A Training', subtitle: 'Get your Commercial Driver\'s License in 3–6 weeks. Start earning $50,000+ your first year.',
  badge: 'Free with WIOA', badgeColor: 'green',
  duration: '3–6 weeks', cost: '$0 with WIOA funding', format: 'In-person, Indianapolis', credential: 'CDL Class A License',
  overview: 'This program prepares you for the Indiana CDL Class A license exam. Training includes classroom instruction, driving simulator practice, and behind-the-wheel training with a certified instructor. You will learn pre-trip inspection, basic vehicle control, and on-road driving. DOT physical and drug screen are required.',
  highlights: ['CDL Class A license preparation', 'Behind-the-wheel training with certified instructor', 'Pre-trip inspection and basic vehicle control', 'On-road driving in traffic conditions', 'DOT physical exam coordination', 'Job placement with trucking companies'],
  overviewImage: '/images/programs-fresh/cdl-training.jpg', overviewImageAlt: 'CDL student training with a semi-truck',
  salaryNumber: 62000, salaryLabel: 'Average annual salary for CDL drivers in Indiana (BLS)', salaryPrefix: '$',
  curriculum: [
    { title: 'CDL Knowledge', topics: ['General knowledge test prep', 'Air brakes', 'Combination vehicles', 'Hazmat endorsement (optional)', 'DOT regulations'] },
    { title: 'Pre-Trip Inspection', topics: ['Engine compartment', 'Cab and controls', 'External inspection', 'Coupling and uncoupling', 'In-cab inspection'] },
    { title: 'Basic Vehicle Control', topics: ['Straight-line backing', 'Offset backing', 'Alley dock', 'Parallel parking', 'Sight-side backing'] },
    { title: 'On-Road Driving', topics: ['Lane changes and merging', 'Intersection navigation', 'Highway driving', 'Mountain and grade driving', 'Night driving'] },
    { title: 'Career Readiness', topics: ['CDL exam scheduling', 'DOT physical requirements', 'Drug and alcohol testing', 'Trucking company applications', 'Career placement support'] },
  ],
  credentials: ['CDL Class A License (Indiana)', 'DOT Medical Card'],
  careers: [
    { title: 'OTR Truck Driver', salary: '$55,000–$75,000' },
    { title: 'Local/Regional Driver', salary: '$50,000–$65,000' },
    { title: 'Tanker Driver', salary: '$60,000–$80,000' },
    { title: 'Owner-Operator', salary: '$80,000–$150,000+' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Most CDL students qualify for free training through WIOA.' },
    { title: 'DOT Physical', desc: 'Pass the DOT physical exam and drug screen.' },
    { title: 'Start Driving', desc: 'Begin classroom and behind-the-wheel training.' },
  ],
  faqs: [
    { question: 'Is CDL training really free?', answer: 'Yes, for eligible participants. WIOA funding covers tuition, DOT physical, drug screen, and CDL exam fees. You pay nothing out of pocket if you qualify.' },
    { question: 'How long does it take to get my CDL?', answer: 'Most students complete the program in 3-6 weeks. The timeline depends on your schedule and how quickly you pass the skills tests.' },
    { question: 'Do I need a regular driver\'s license first?', answer: 'Yes. You must have a valid Indiana driver\'s license (or equivalent) before starting CDL training. You must also be at least 21 years old for interstate driving (18 for intrastate).' },
    { question: 'What about the drug test?', answer: 'CDL drivers are subject to DOT drug and alcohol testing. You must pass a pre-employment drug screen. Random testing continues throughout your driving career. This is a federal requirement.' },
  ],
  applyHref: '/apply?program=cdl-training',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Skilled Trades', href: '/programs/skilled-trades' }, { label: 'CDL Training' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'cdl-training', name: config.title, slug: 'cdl-training', description: config.subtitle, duration_weeks: 6, price: 0, image_url: `${SITE_URL}/images/programs-fresh/cdl-training.jpg`, category: 'Transportation', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
