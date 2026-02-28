export const dynamic = 'force-static';
export const revalidate = 86400;

import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Forklift Operator Certification | OSHA-Compliant | Indianapolis',
  description:
    '1-day forklift operator certification. OSHA-compliant training with written exam and practical evaluation. Bilingual instruction available.',
  alternates: { canonical: `${SITE_URL}/programs/forklift` },
  openGraph: {
    title: 'Forklift Operator Certification | OSHA-Compliant | Indianapolis',
    description: '1-day forklift operator certification. OSHA-compliant written exam and practical evaluation.',
    url: `${SITE_URL}/programs/forklift`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Forklift Operator Certification' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/electrician-trades.mp4',
  voiceoverSrc: '/audio/heroes/skilled-trades.mp3',

  title: 'Forklift Operator Certification',
  subtitle:
    'Earn your OSHA-compliant forklift operator certification in one day. Written exam and hands-on practical evaluation included.',
  badge: 'Same-Day Certification',
  badgeColor: 'green',

  duration: '1 day (8 hours)',
  cost: '$2,700',
  format: 'In-person — Classroom + Practical',
  credential: 'OSHA-Compliant Forklift Operator Certification',

  // Program details
  totalHours: 8,
  schedule: 'Saturday 8:00 AM–4:00 PM (single day)',
  eveningSchedule: 'Weekday evening sessions available for groups of 5+. Contact us to schedule.',
  cohortSize: '5–12 participants per session',
  admissionRequirements: [
    '18 years or older',
    'Able to operate equipment safely (vision, hearing, physical mobility)',
    'No prior forklift experience required',
  ],
  modality: 'In-person — Classroom instruction followed by hands-on practical evaluation',
  facilityInfo: 'Practical evaluation held at employer partner site with forklift equipment, Indianapolis',
  equipmentIncluded: 'Forklift equipment, training materials, PPE, and certification included',
  bilingualSupport: 'Bilingual (English/Spanish) instruction available.',
  nextLevelJobsEligible: true,
  employerPartners: [
    'Logistics and warehouse employers (Indianapolis metro)',
    'Jesse J. Wilkerson & Associates — Construction',
  ],
  selfPayCost: '$2,700',
  cohortPricing: 'Contact us for group rates (5+ participants)',
  pricingIncludes: [
    '8 hours of instruction and evaluation',
    'Written certification exam',
    'Hands-on practical evaluation',
    'OSHA-compliant certification card',
    'All training materials and PPE',
  ],
  paymentTerms: 'WIOA and Next Level Jobs funding accepted. Employer-sponsored enrollment available.',

  overview:
    'This one-day program provides OSHA-compliant forklift operator training and certification per 29 CFR 1910.178. Participants complete classroom instruction covering forklift safety, load handling, and OSHA regulations, followed by a hands-on practical evaluation on actual forklift equipment. Graduates receive their certification the same day and are immediately qualified for forklift operator positions in warehousing, logistics, construction, and manufacturing.',

  highlights: [
    'Same-day certification — arrive in the morning, leave certified',
    'OSHA-compliant per 29 CFR 1910.178',
    'Classroom instruction + hands-on practical evaluation',
    'Covers sit-down counterbalance, reach trucks, and pallet jacks',
    'Written exam and practical driving evaluation',
    'Immediately employable in warehousing, logistics, and construction',
  ],

  overviewImage: '/images/trades/program-construction-training.jpg',
  overviewImageAlt: 'Forklift operator training in warehouse environment',

  salaryNumber: 42000,
  salaryLabel: 'Average annual salary for forklift operators in Indiana (BLS)',
  salaryPrefix: '$',

  curriculum: [
    {
      title: 'Classroom Instruction (4 hours)',
      topics: [
        'OSHA forklift safety standards (29 CFR 1910.178)',
        'Types of powered industrial trucks',
        'Stability triangle and center of gravity',
        'Load capacity and load charts',
        'Pedestrian safety and right-of-way',
        'Refueling and recharging procedures',
        'Hazard recognition and avoidance',
      ],
    },
    {
      title: 'Hands-On Practical Evaluation (4 hours)',
      topics: [
        'Pre-operation inspection checklist',
        'Starting, stopping, and steering',
        'Load picking, carrying, and stacking',
        'Navigating aisles, ramps, and dock areas',
        'Parking and shutdown procedures',
        'Practical driving evaluation and skills check',
        'Written certification exam',
      ],
    },
  ],

  credentials: [
    'OSHA-Compliant Forklift Operator Certification (employer-verified)',
  ],

  careers: [
    { title: 'Forklift Operator', salary: '$36,000–$48,000' },
    { title: 'Warehouse Associate', salary: '$32,000–$42,000' },
    { title: 'Material Handler', salary: '$34,000–$44,000' },
    { title: 'Shipping & Receiving', salary: '$33,000–$43,000' },
    { title: 'Construction Laborer (with forklift)', salary: '$38,000–$50,000' },
  ],

  steps: [
    { title: 'Register', desc: 'Sign up online or contact us to join the next available session.' },
    { title: 'Attend Training', desc: 'Complete 4 hours of classroom instruction and 4 hours of practical evaluation.' },
    { title: 'Get Certified', desc: 'Pass the written exam and practical evaluation. Receive your certification the same day.' },
  ],

  faqs: [
    {
      question: 'Do I need forklift experience?',
      answer: 'No. Training starts from the basics. You will learn forklift operation, safety, and load handling during the program.',
    },
    {
      question: 'How long is the certification valid?',
      answer: 'OSHA requires forklift operator recertification every 3 years, or sooner if the operator is involved in an accident, observed operating unsafely, or assigned to a different type of truck.',
    },
    {
      question: 'What type of forklift will I train on?',
      answer: 'Training covers sit-down counterbalance forklifts, which are the most common type in warehousing and construction. Reach truck and pallet jack familiarization is also included.',
    },
    {
      question: 'Is bilingual instruction available?',
      answer: 'Yes. We offer bilingual (English/Spanish) instruction for forklift certification sessions.',
    },
    {
      question: 'Can my employer send a group?',
      answer: 'Yes. We offer group rates for 5 or more participants. We can also conduct on-site training at your facility. Contact us for scheduling and pricing.',
    },
  ],

  applyHref: '/apply?program=forklift',
  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Skilled Trades', href: '/programs/skilled-trades' },
    { label: 'Forklift Operator Certification' },
  ],
};

export default function Page() {
  return (
    <>
      <ProgramStructuredData
        program={{
          id: 'forklift',
          name: config.title,
          slug: 'forklift',
          description: config.subtitle,
          duration_weeks: 1,
          price: 2700,
          image_url: `${SITE_URL}/images/trades/program-construction-training.jpg`,
          category: 'Skilled Trades',
          outcomes: config.credentials || [],
        }}
      />
      <ProgramPageLayout config={config} />
    </>
  );
}
