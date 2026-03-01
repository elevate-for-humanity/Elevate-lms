export const dynamic = 'force-static';
export const revalidate = 86400;

import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
import SponsorDisclosure from '@/components/compliance/SponsorDisclosure';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Construction Trades Certification Pathway | OSHA 30, EPA 608, Forklift | Indianapolis',
  description:
    '11-week multi-trade certification program. OSHA 30, EPA 608 Universal, Forklift, CPR/First Aid. Evening and weekend schedule for working adults. Bilingual support available.',
  alternates: { canonical: `${SITE_URL}/programs/construction-trades-certification` },
  openGraph: {
    title: 'Construction Trades Certification Pathway | Indianapolis',
    description:
      '11-week multi-trade certification program. OSHA 30, EPA 608, Forklift, CPR/First Aid. $2,700 per participant. Bilingual support available.',
    url: `${SITE_URL}/programs/construction-trades-certification`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Construction Trades Certification Pathway' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/electrician-trades.mp4',
  voiceoverSrc: '/audio/heroes/skilled-trades.mp3',

  title: 'Construction Trades Certification Pathway',
  subtitle:
    'Earn OSHA 30, EPA 608, Forklift, and CPR/First Aid in 11 weeks. Evening and weekend classes designed for working adults. Bilingual instruction available.',
  badge: 'Custom Cohort Available',
  badgeColor: 'orange',

  duration: '11 weeks',
  cost: '$2,700 per participant',
  format: 'Hybrid — Classroom instruction + LMS coursework + certification practicals',
  credential: 'OSHA 30 + EPA 608 + Forklift + CPR',

  // Program details for workforce partners
  totalHours: 130,
  schedule: 'Mon/Wed 5:30–8:30 PM + Sat 8:00 AM–2:00 PM',
  eveningSchedule: 'Designed for working adults. All sessions are evenings and weekends. Schedule can be adjusted for cohort needs.',
  cohortSize: '10–15 participants per cohort',
  admissionRequirements: [
    '18 years or older',
    'High school diploma or GED (or actively pursuing)',
    'Able to lift 50 lbs and work on feet for extended periods',
    'No prior trade experience required',
    'Background check may be required by employer partners',
  ],
  modality: 'Hybrid — Classroom instruction, LMS-supported theory, live instructor sessions, on-site certification practicals',
  facilityInfo: 'Elevate central office + co-working training space, Indianapolis. Forklift practical held at employer partner site.',
  equipmentIncluded: 'All training materials, certification exam fees, CPR manikins/AED trainers, and PPE included in tuition',
  bilingualSupport: 'Bilingual (English/Spanish) instruction available. Course materials and LMS interface support Spanish language accessibility.',
  nextLevelJobsEligible: true,
  employerPartners: [
    'Jesse J. Wilkerson & Associates — Architecture & Construction',
    'Carl Brown — Building Technology & Maintenance',
    '2 HVAC employer partners (onboarding)',
    'Logistics and warehouse employers (Indianapolis metro)',
  ],
  selfPayCost: '$2,700',
  cohortPricing: '$2,700/participant (10+ cohort). Volume discounts available for 15+.',
  pricingIncludes: [
    'All instructional hours (130 hours)',
    'OSHA 30-Hour certification exam + DOL card',
    'EPA 608 Universal exam fee (Mainstream Engineering)',
    'Forklift operator certification',
    'CPR/First Aid certification (AHA/HSI)',
    'PPE, tools, and training materials',
    'LMS access and digital coursework',
    'Career readiness and job placement support',
  ],
  paymentTerms: 'Invoiced per cohort. Net 30 terms available for organizational partners. Payment plans available for individual participants. WIOA, Next Level Jobs, and other workforce funding accepted.',

  overview:
    'This 11-week certification pathway prepares participants for careers across construction trades, HVAC, building maintenance, and logistics. The program stacks multiple industry-recognized credentials — OSHA 30, EPA 608 Universal, Forklift Operator, and CPR/First Aid — giving graduates a credential portfolio that qualifies them for entry-level positions across multiple sectors. Training is delivered through classroom instruction and LMS-supported coursework with on-site certification exams and practicals. Evening and weekend sessions are designed for working adults, with bilingual instruction available for Spanish-speaking participants.',

  highlights: [
    'OSHA 30-Hour Construction Safety — the industry standard, not just OSHA 10',
    'EPA 608 Universal — federal certification for refrigerant handling, proctored on-site',
    'Forklift Operator Certification — practical evaluation at employer partner site',
    'HVAC fundamentals — refrigeration theory, system components, electrical basics',
    'Building systems — electrical, plumbing, and maintenance theory with blueprint reading',
    'Career readiness — resume building, interview prep, employer introductions',
  ],

  overviewImage: '/images/trades/program-construction-training.jpg',
  overviewImageAlt: 'Construction trades students in hands-on training',

  salaryNumber: 48000,
  salaryLabel: 'Average entry-level salary for construction trades in Indiana (BLS)',
  salaryPrefix: '$',

  curriculum: [
    {
      title: 'OSHA 30-Hour Construction Safety (Weeks 1–3)',
      topics: [
        'OSHA standards and regulations',
        'Fall protection and scaffolding safety',
        'Electrical safety and lockout/tagout',
        'Hazard communication (HazCom)',
        'Personal protective equipment (PPE)',
        'Excavation and trenching safety',
        'Fire protection and prevention',
        'Materials handling and storage',
        'Hand and power tool safety',
        'Health hazards in construction',
      ],
    },
    {
      title: 'HVAC Fundamentals & EPA 608 (Weeks 3–5)',
      topics: [
        'Refrigeration cycle and pressure-temperature relationships',
        'Refrigerant types, handling, and recovery',
        'HVAC system components — compressors, condensers, evaporators',
        'Electrical fundamentals for HVAC systems',
        'EPA Section 608 regulations and compliance',
        'EPA 608 Universal exam preparation',
        'On-site proctored EPA 608 exam (Mainstream Engineering QwikTest)',
      ],
    },
    {
      title: 'Building Systems & Maintenance (Weeks 5–8)',
      topics: [
        'Electrical theory — circuits, wiring methods, outlets, switches, panels',
        'Plumbing theory — pipe systems, fixtures, drain-waste-vent, water supply',
        'Building envelope — insulation, weatherization, energy efficiency',
        'Preventive maintenance scheduling and documentation',
        'Blueprint and schematic reading',
        'Building code awareness and permit processes',
        'System identification and troubleshooting methodology',
      ],
    },
    {
      title: 'Logistics & Forklift Certification (Week 9)',
      topics: [
        'OSHA forklift safety standards (29 CFR 1910.178)',
        'Pre-operation inspection procedures',
        'Load handling and stability',
        'Warehouse navigation and pedestrian safety',
        'Hands-on forklift operation and evaluation',
        'Written and practical certification exam',
      ],
    },
    {
      title: 'Career Readiness & CPR/First Aid (Weeks 10–11)',
      topics: [
        'CPR/First Aid certification (AHA/HSI)',
        'Resume building for trades careers',
        'Interview preparation and mock interviews',
        'Employer introductions and hiring events',
        'Workplace professionalism (NRF Rise Up aligned)',
        'Job search strategies for construction and trades',
        'Apprenticeship and advancement pathways',
      ],
    },
  ],

  credentials: [
    'OSHA 30-Hour Construction Safety (DOL card)',
    'EPA 608 Universal Certification (Mainstream Engineering, proctored on-site)',
    'Forklift Operator Certification (OSHA-compliant)',
    'CPR/First Aid (AHA/HSI issued)',
    'Elevate Certificate of Completion — Construction Trades & Building Technology',
  ],

  careers: [
    { title: 'Construction Laborer', salary: '$35,000–$48,000' },
    { title: 'HVAC Technician Helper', salary: '$32,000–$42,000' },
    { title: 'Building Maintenance Technician', salary: '$38,000–$52,000' },
    { title: 'Forklift Operator', salary: '$36,000–$48,000' },
    { title: 'Electrician Helper', salary: '$34,000–$44,000' },
    { title: 'Warehouse Operations', salary: '$35,000–$46,000' },
  ],

  steps: [
    { title: 'Partner Intake', desc: 'Your organization contacts us to define cohort size, start date, and schedule preferences.' },
    { title: 'Participant Enrollment', desc: 'Participants complete a brief application. No prior trade experience required.' },
    { title: 'Orientation', desc: 'Tour the training facility, meet instructors, receive PPE and materials.' },
    { title: 'Begin Training', desc: '11 weeks of evening/weekend instruction. Progress reports sent to your team weekly.' },
  ],

  faqs: [
    {
      question: 'Is this program available for organizational cohorts?',
      answer:
        'Yes. This program was designed for workforce partners who need a structured certification pathway for their participants. We work directly with your team on scheduling, enrollment, progress reporting, and job placement coordination.',
    },
    {
      question: 'What credentials will participants earn?',
      answer:
        'Participants earn 5 credentials: OSHA 30-Hour Construction Safety (DOL card), EPA 608 Universal (federal certification), Forklift Operator Certification, CPR/First Aid, and an Elevate Certificate of Completion in Construction Trades & Building Technology.',
    },
    {
      question: 'Is bilingual instruction available?',
      answer:
        'Yes. We offer bilingual (English/Spanish) instruction. Course materials and our LMS platform support Spanish language accessibility. Bilingual instructors are available for cohorts that need it.',
    },
    {
      question: 'What is the schedule?',
      answer:
        'Standard schedule is Monday/Wednesday 5:30–8:30 PM and Saturday 8:00 AM–2:00 PM. This is designed for working adults. We can adjust the schedule based on cohort needs.',
    },
    {
      question: 'Are certification exam fees included?',
      answer:
        'Yes. All certification exam fees, PPE, tools, training materials, and LMS access are included in the $2,700 per-participant tuition. There are no additional costs.',
    },
    {
      question: 'How do you report progress to our team?',
      answer:
        'We provide weekly progress reports including attendance, assessment scores, and completion status. We flag participants who are falling behind or facing barriers. Our team coordinates directly with your case managers and coaching staff.',
    },
    {
      question: 'Is this program eligible for Next Level Jobs or WIOA funding?',
      answer:
        'Yes. This program is Next Level Jobs eligible and WIOA-approved. If participants qualify for workforce funding, it can supplement or fully cover tuition costs.',
    },
    {
      question: 'What happens after graduation?',
      answer:
        'Graduates receive job placement support including employer introductions, resume assistance, and interview preparation. Our employer partners in construction, HVAC, building maintenance, and logistics hire directly from our programs. Graduates can also continue into our full-length HVAC, Electrical, or Plumbing certification programs with WIOA funding.',
    },
  ],

  applyHref: '/apply?program=construction-trades-certification',
  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Skilled Trades', href: '/programs/skilled-trades' },
    { label: 'Construction Trades Certification' },
  ],
};

export default function Page() {
  return (
    <>
      <ProgramStructuredData
        program={{
          id: 'construction-trades-certification',
          name: config.title,
          slug: 'construction-trades-certification',
          description: config.subtitle,
          duration_weeks: 11,
          price: 2700,
          image_url: `${SITE_URL}/images/trades/program-construction-training.jpg`,
          category: 'Skilled Trades',
          outcomes: config.credentials || [],
        }}
      />
      <ProgramPageLayout config={config}>
        <SponsorDisclosure />
      </ProgramPageLayout>
    </>
  );
}
