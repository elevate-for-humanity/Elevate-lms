export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Plumbing Technician Training | OSHA Certified | Indianapolis',
  description: '10-week plumbing program. OSHA 10, NCCER Core, residential and commercial plumbing. Free for eligible participants.',
  alternates: { canonical: `${SITE_URL}/programs/plumbing` },
  openGraph: {
    title: 'Plumbing Technician Training | OSHA Certified | Indianapolis',
    description: '10-week plumbing program. OSHA 10, NCCER Core, residential and commercial plumbing. Free for eligible participants.',
    url: `${SITE_URL}/programs/plumbing`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Plumbing Technician Training | OSHA Certified | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/electrician-trades.mp4',
  voiceoverSrc: '/audio/heroes/skilled-trades.mp3',
  title: 'Plumbing Technician', subtitle: 'Install and repair residential and commercial plumbing systems. Earn OSHA 10 and NCCER credentials in 10 weeks.',
  badge: 'Funding Available', badgeColor: 'orange',
  duration: '10 weeks', cost: '$0 with WIOA funding', format: 'Hybrid — In-person + LMS', credential: 'OSHA 10 + NCCER Core',

  // Program details
  totalHours: 200,
  schedule: 'Mon–Fri, 8:00 AM–12:00 PM (20 hrs/week)',
  eveningSchedule: 'Evening/weekend cohorts available for working adults. Contact us for schedule options.',
  cohortSize: '10–15 participants per cohort',
  admissionRequirements: ['18 years or older', 'High school diploma or GED (or actively pursuing)', 'Able to lift 50 lbs', 'No prior plumbing experience required'],
  modality: 'Hybrid — In-person hands-on labs, LMS-supported theory, live instructor sessions',
  facilityInfo: 'Elevate training center, Indianapolis',
  equipmentIncluded: 'All PPE, tools, training materials, and certification exam fees included',
  bilingualSupport: 'Bilingual (English/Spanish) instruction available. LMS supports Spanish language accessibility.',
  nextLevelJobsEligible: true,
  employerPartners: ['Jesse J. Wilkerson & Associates — Architecture & Construction'],
  selfPayCost: '$5,000',
  cohortPricing: 'Contact us for organizational/cohort pricing',
  pricingIncludes: ['200 instructional hours', 'OSHA 10-Hour certification', 'NCCER Core Curriculum certification', 'CPR/First Aid certification', 'All PPE, tools, and materials', 'LMS access', 'Career placement support'],
  paymentTerms: 'WIOA, Next Level Jobs, and WRG funding accepted. Payment plans available for self-pay students.',
  overview: 'This 10-week program covers residential and commercial plumbing systems. You will learn pipe fitting, soldering, PVC and copper installation, drain-waste-vent systems, fixture installation, and plumbing code. Graduates earn OSHA 10 and NCCER Core certifications and are prepared for plumber helper and apprentice positions.',
  highlights: ['Pipe fitting, cutting, and joining methods', 'Copper, PVC, PEX, and cast iron systems', 'Drain-waste-vent (DWV) system installation', 'Fixture installation and repair', 'Indiana Plumbing Code basics', 'OSHA 10-Hour Construction Safety'],
  overviewImage: '/images/programs-fresh/plumbing.jpg', overviewImageAlt: 'Plumbing student working on pipe installation',
  salaryNumber: 59880, salaryLabel: 'Average annual salary for plumbers in Indiana (BLS)', salaryPrefix: '$',
  curriculum: [
    { title: 'Pipe Systems', topics: ['Copper soldering and brazing', 'PVC cement joints', 'PEX crimping and expansion', 'Cast iron and no-hub', 'Pipe sizing and layout'] },
    { title: 'DWV Systems', topics: ['Drain-waste-vent principles', 'Trap installation', 'Vent sizing and routing', 'Cleanout placement', 'Grade and slope'] },
    { title: 'Water Supply', topics: ['Water distribution systems', 'Pressure regulation', 'Water heater installation', 'Backflow prevention', 'Cross-connection control'] },
    { title: 'Fixtures', topics: ['Toilet installation', 'Sink and faucet installation', 'Bathtub and shower', 'Dishwasher and disposal', 'Washing machine hookup'] },
    { title: 'Safety & Code', topics: ['OSHA 10-Hour certification', 'Indiana Plumbing Code', 'Permit and inspection process', 'Excavation safety', 'Tool safety'] },
  ],
  credentials: ['OSHA 10-Hour Construction Safety', 'NCCER Core Curriculum', 'CPR/First Aid'],
  careers: [
    { title: 'Plumber Helper', salary: '$32,000–$42,000' },
    { title: 'Plumbing Apprentice', salary: '$38,000–$50,000' },
    { title: 'Residential Plumber', salary: '$50,000–$70,000' },
    { title: 'Commercial Plumber', salary: '$55,000–$75,000' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Attend Orientation', desc: 'Tour the plumbing shop and meet your instructor.' },
    { title: 'Start Training', desc: 'Begin 10 weeks of hands-on plumbing training.' },
  ],
  faqs: [
    { question: 'Do I need plumbing experience?', answer: 'No. This program starts from the basics. You will learn pipe fitting, soldering, and system installation from scratch.' },
    { question: 'Will this make me a licensed plumber?', answer: 'This program prepares you for entry-level positions. Indiana requires supervised work experience to qualify for a journeyman plumber license. This gives you the foundation to start that path.' },
  ],
  applyHref: '/apply?program=plumbing',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Skilled Trades', href: '/programs/skilled-trades' }, { label: 'Plumbing Technician' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'plumbing', name: config.title, slug: 'plumbing', description: config.subtitle, duration_weeks: 10, price: 0, image_url: `${SITE_URL}/images/programs-fresh/plumbing.jpg`, category: 'Skilled Trades', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
