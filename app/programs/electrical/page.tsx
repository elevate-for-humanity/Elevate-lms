export const dynamic = 'force-static';
export const revalidate = 86400;

import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Electrical Technician Training | OSHA Certified | Indianapolis',
  description: '12-week electrical training program. OSHA 30, NCCER Core, and residential wiring. Free for eligible participants through WIOA funding.',
  alternates: { canonical: `${SITE_URL}/programs/electrical` },
  openGraph: {
    title: 'Electrical Technician Training | OSHA Certified | Indianapolis',
    description: '12-week electrical training program. OSHA 30, NCCER Core, and residential wiring. Free for eligible participants through WIOA funding.',
    url: `${SITE_URL}/programs/electrical`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Electrical Technician Training | OSHA Certified | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/electrician-trades.mp4',
  voiceoverSrc: '/audio/heroes/electrical.mp3',

  title: 'Electrical Technician',
  subtitle: 'Learn residential and commercial wiring, electrical theory, and NEC code. Graduate with OSHA 30 and NCCER credentials.',
  badge: 'Funding Available',
  badgeColor: 'orange',

  duration: '12 weeks',
  cost: '$0 with WIOA funding',
  format: 'Hybrid — In-person + LMS',
  credential: 'OSHA 30 + NCCER Core',

  // Program details
  totalHours: 240,
  schedule: 'Mon–Fri, 8:00 AM–12:00 PM (20 hrs/week)',
  eveningSchedule: 'Evening/weekend cohorts available for working adults. Contact us for schedule options.',
  cohortSize: '10–15 participants per cohort',
  admissionRequirements: ['18 years or older', 'High school diploma or GED (or actively pursuing)', 'Able to lift 50 lbs', 'No prior electrical experience required'],
  modality: 'Hybrid — In-person hands-on labs, LMS-supported theory, live instructor sessions',
  facilityInfo: 'Elevate training center, Indianapolis',
  equipmentIncluded: 'All PPE, tools, training materials, and certification exam fees included',
  bilingualSupport: 'Bilingual (English/Spanish) instruction available. LMS supports Spanish language accessibility.',
  nextLevelJobsEligible: true,
  employerPartners: ['Jesse J. Wilkerson & Associates — Architecture & Construction'],
  selfPayCost: '$5,000',
  cohortPricing: 'Contact us for organizational/cohort pricing',
  pricingIncludes: ['240 instructional hours', 'OSHA 30-Hour certification', 'NCCER Core Curriculum certification', 'CPR/First Aid certification', 'All PPE, tools, and materials', 'LMS access', 'Career placement support'],
  paymentTerms: 'WIOA, Next Level Jobs, and WRG funding accepted. Payment plans available for self-pay students.',

  overview: 'This 12-week program covers electrical theory, residential wiring, commercial wiring, NEC code, and safety. You will work with real tools and materials in a hands-on shop environment. Graduates earn OSHA 30 and NCCER Core certifications and are prepared for entry-level electrician helper and apprentice positions.',
  highlights: [
    'Hands-on wiring in a fully equipped electrical shop',
    'National Electrical Code (NEC) interpretation',
    'Residential and commercial wiring methods',
    'OSHA 30-Hour Construction Safety certification',
    'NCCER Core Curriculum certification',
    'Apprenticeship readiness and employer connections',
  ],
  overviewImage: '/images/programs-fresh/electrical.jpg',
  overviewImageAlt: 'Electrical technician student wiring a panel',

  salaryNumber: 60240,
  salaryLabel: 'Average annual salary for electricians in Indiana (BLS)',
  salaryPrefix: '$',

  curriculum: [
    {
      title: 'Electrical Theory',
      topics: ['Ohm\'s Law and Kirchhoff\'s Laws', 'Series and parallel circuits', 'AC vs DC power', 'Voltage, current, resistance', 'Power calculations'],
    },
    {
      title: 'Residential Wiring',
      topics: ['Service entrance and panels', 'Branch circuit wiring', 'Switches, outlets, fixtures', 'GFCI and AFCI protection', 'Grounding and bonding'],
    },
    {
      title: 'Commercial Wiring',
      topics: ['Conduit bending and installation', 'Three-phase power systems', 'Motor controls', 'Lighting systems', 'Fire alarm basics'],
    },
    {
      title: 'NEC Code',
      topics: ['Code book navigation', 'Article 210 — Branch Circuits', 'Article 220 — Load Calculations', 'Article 250 — Grounding', 'Permit and inspection process'],
    },
    {
      title: 'Safety & OSHA 30',
      topics: ['Fall protection', 'Electrical safety and lockout/tagout', 'PPE requirements', 'Hazard communication', 'OSHA 30-Hour certification'],
    },
    {
      title: 'Career Readiness',
      topics: ['NCCER Core Curriculum', 'Tool identification and use', 'Blueprint reading basics', 'Resume and interview prep', 'Apprenticeship application support'],
    },
  ],

  credentials: [
    'OSHA 30-Hour Construction Safety',
    'NCCER Core Curriculum',
    'CPR/First Aid',
  ],

  careers: [
    { title: 'Electrician Helper', salary: '$35,000–$45,000' },
    { title: 'Electrical Apprentice', salary: '$40,000–$55,000' },
    { title: 'Residential Electrician', salary: '$50,000–$70,000' },
    { title: 'Commercial Electrician', salary: '$55,000–$75,000' },
    { title: 'Maintenance Electrician', salary: '$48,000–$65,000' },
  ],

  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Attend Orientation', desc: 'Tour the shop and meet your instructor.' },
    { title: 'Start Training', desc: 'Begin 12 weeks of hands-on electrical training.' },
  ],

  faqs: [
    { question: 'Do I need any electrical experience?', answer: 'No. This program starts from zero. You will learn electrical theory, safety, and hands-on wiring from the ground up. A high school diploma or GED is required.' },
    { question: 'Will this make me a licensed electrician?', answer: 'This program prepares you for entry-level positions as an electrician helper or apprentice. Indiana requires 8,000 hours of supervised work experience to qualify for a journeyman license. This program gives you the foundation and credentials to start that path.' },
    { question: 'What tools do I need?', answer: 'Basic hand tools are provided during training. A tool list for employment will be given during the program. WIOA funding may cover tool costs for eligible participants.' },
    { question: 'Is this program eligible for WIOA funding?', answer: 'Yes. Electrical is a high-demand occupation in Indiana. If you qualify for WIOA, your tuition, tools, and supplies are covered at no cost.' },
  ],

  applyHref: '/apply?program=electrical',

  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Skilled Trades', href: '/programs/skilled-trades' },
    { label: 'Electrical Technician' },
  ],
};

export default function Page() {
  return (
    <>
      <ProgramStructuredData program={{
        id: 'electrical',
        name: 'Electrical Technician Training',
        slug: 'electrical',
        description: config.subtitle,
        duration_weeks: 12,
        price: 0,
        image_url: `${SITE_URL}/images/programs-fresh/electrical.jpg`,
        category: 'Skilled Trades',
        outcomes: ['OSHA 30-Hour Construction Safety', 'NCCER Core Curriculum', 'CPR/First Aid'],
      }} />
      <ProgramPageLayout config={config} />
    </>
  );
}
