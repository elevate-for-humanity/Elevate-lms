export const dynamic = 'force-static';
export const revalidate = 86400;

import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Welding Technician Training | AWS Certified | Indianapolis',
  description: '10-week welding program. MIG, TIG, Stick, and Flux-Core. OSHA 10, AWS certifications. Free for eligible participants through WIOA.',
  alternates: { canonical: `${SITE_URL}/programs/welding` },
  openGraph: {
    title: 'Welding Technician Training | AWS Certified | Indianapolis',
    description: '10-week welding program. MIG, TIG, Stick, and Flux-Core. OSHA 10, AWS certifications. Free for eligible participants through WIOA.',
    url: `${SITE_URL}/programs/welding`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Welding Technician Training | AWS Certified | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/welding-trades.mp4',
  voiceoverSrc: '/audio/heroes/welding.mp3',

  title: 'Welding Technician',
  subtitle: 'Master MIG, TIG, Stick, and Flux-Core welding. Graduate with OSHA 10 and AWS certifications in 10 weeks.',
  badge: 'Funding Available',
  badgeColor: 'orange',

  duration: '10 weeks',
  cost: '$0 with WIOA funding',
  format: 'In-person, Indianapolis',
  credential: 'AWS D1.1 + OSHA 10',

  overview: 'This 10-week hands-on program teaches four welding processes: MIG (GMAW), TIG (GTAW), Stick (SMAW), and Flux-Core (FCAW). You will weld on carbon steel in all positions — flat, horizontal, vertical, and overhead. Training includes blueprint reading, weld symbols, and metallurgy basics. Graduates are prepared for the AWS D1.1 Structural Welding certification test.',
  highlights: [
    'Four welding processes: MIG, TIG, Stick, Flux-Core',
    'All-position welding on carbon steel',
    'Blueprint reading and weld symbol interpretation',
    'AWS D1.1 Structural Welding certification prep',
    'OSHA 10-Hour Construction Safety certification',
    '80%+ shop time — hands-on from day one',
  ],
  overviewImage: '/images/programs-fresh/welding.jpg',
  overviewImageAlt: 'Welding student working with MIG welder in shop',

  salaryNumber: 47540,
  salaryLabel: 'Average annual salary for welders in Indiana (BLS)',
  salaryPrefix: '$',

  curriculum: [
    {
      title: 'MIG Welding (GMAW)',
      topics: ['Machine setup and wire feed', 'Flat and horizontal positions', 'Vertical and overhead positions', 'Short-circuit and spray transfer', 'Multi-pass welds'],
    },
    {
      title: 'TIG Welding (GTAW)',
      topics: ['Tungsten selection and sharpening', 'Gas flow and cup size', 'Filler rod techniques', 'Carbon steel TIG', 'Thin gauge welding'],
    },
    {
      title: 'Stick Welding (SMAW)',
      topics: ['Electrode selection (6010, 6013, 7018)', 'Arc striking and control', 'All-position stick welding', 'Open root joints', 'Pipe welding basics'],
    },
    {
      title: 'Flux-Core (FCAW)',
      topics: ['Self-shielded vs gas-shielded', 'Machine setup', 'Flat and horizontal', 'Vertical up technique', 'Multi-pass structural welds'],
    },
    {
      title: 'Blueprint & Theory',
      topics: ['Weld symbols (AWS A2.4)', 'Joint types and preparation', 'Metallurgy basics', 'Weld defects and inspection', 'Destructive and visual testing'],
    },
    {
      title: 'Safety & Certification',
      topics: ['OSHA 10-Hour certification', 'Fire prevention and ventilation', 'PPE for welding', 'AWS D1.1 test prep', 'Career placement support'],
    },
  ],

  credentials: [
    'AWS D1.1 Structural Welding (test prep)',
    'OSHA 10-Hour Construction Safety',
    'CPR/First Aid',
  ],

  careers: [
    { title: 'Structural Welder', salary: '$42,000–$60,000' },
    { title: 'MIG Welder', salary: '$38,000–$52,000' },
    { title: 'TIG Welder', salary: '$45,000–$65,000' },
    { title: 'Pipe Welder', salary: '$55,000–$80,000' },
    { title: 'Welding Inspector (with experience)', salary: '$60,000–$85,000' },
  ],

  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Attend Orientation', desc: 'Tour the welding shop and meet your instructor.' },
    { title: 'Start Welding', desc: 'Begin 10 weeks of hands-on welding training.' },
  ],

  faqs: [
    { question: 'Do I need welding experience?', answer: 'No. This program is designed for beginners. You will start with basic safety and machine setup, then progress through all four welding processes. By week 10, you will be welding in all positions.' },
    { question: 'What gear do I need?', answer: 'Welding helmets, gloves, and safety glasses are provided during training. You will need steel-toe boots and long pants. WIOA funding may cover additional gear for eligible participants.' },
    { question: 'Is this program free?', answer: 'Yes, for eligible participants. WIOA funding covers tuition, materials, and certification fees. If you do not qualify for WIOA, payment plans are available.' },
    { question: 'What is the AWS D1.1 certification?', answer: 'AWS D1.1 is the American Welding Society standard for structural steel welding. It is the most widely recognized welding certification in construction and manufacturing. This program prepares you for the test — the actual certification test is administered separately.' },
  ],

  applyHref: '/apply?program=welding',

  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Skilled Trades', href: '/programs/skilled-trades' },
    { label: 'Welding Technician' },
  ],
};

export default function Page() {
  return (
    <>
      <ProgramStructuredData program={{
        id: 'welding',
        name: 'Welding Technician Training',
        slug: 'welding',
        description: config.subtitle,
        duration_weeks: 10,
        price: 0,
        image_url: `${SITE_URL}/images/programs-fresh/welding.jpg`,
        category: 'Skilled Trades',
        outcomes: ['AWS D1.1 Structural Welding (test prep)', 'OSHA 10-Hour Construction Safety', 'CPR/First Aid'],
      }} />
      <ProgramPageLayout config={config} />
    </>
  );
}
