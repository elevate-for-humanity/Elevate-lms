export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'HVAC Technician Training | EPA 608 Certified | Indianapolis',
  description: '12-week HVAC program. EPA 608 Universal, OSHA 30, and 6 industry credentials. Funding available for eligible participants through WIOA and Next Level Jobs.',
  alternates: { canonical: `${SITE_URL}/programs/hvac-technician` },
  openGraph: {
    title: 'HVAC Technician Training | EPA 608 Certified | Indianapolis',
    description: '12-week HVAC program. EPA 608 Universal, OSHA 30, and 6 industry credentials. Funding available for eligible participants through WIOA and Next Level Jobs.',
    url: `${SITE_URL}/programs/hvac-technician`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'HVAC Technician Training | EPA 608 Certified | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/hvac-technician.mp4',
  voiceoverSrc: '/audio/heroes/skilled-trades.mp3',
  title: 'HVAC Technician',
  subtitle: 'Install, maintain, and repair heating and cooling systems. Earn EPA 608 Universal, OSHA 30, and CPR/AED certifications in 12 weeks.',
  badge: 'Funding Available',
  badgeColor: 'orange',
  duration: '12 weeks',
  cost: '$0 with WIOA funding',
  format: 'Hybrid — Online RTI + Employer OJT',
  credential: 'EPA 608 Universal + OSHA 30 + CPR/AED',

  totalHours: 240,
  schedule: 'Mon–Fri, 15–20 hours per week (flexible scheduling)',
  eveningSchedule: 'Evening/weekend cohorts available for working adults. Contact us for schedule options.',
  cohortSize: '10–15 participants per cohort',
  admissionRequirements: [
    '18 years or older',
    'High school diploma or GED (or actively pursuing)',
    'Able to lift 50 lbs',
    'No prior HVAC experience required',
  ],
  modality: 'Hybrid — Online Related Technical Instruction via LMS, hands-on labs at training facility, On-the-Job Training at employer sites',
  facilityInfo: 'Elevate training center, Indianapolis',
  equipmentIncluded: 'All PPE, tools, training materials, and certification exam fees included',
  bilingualSupport: 'Bilingual (English/Spanish) instruction available. LMS supports Spanish language accessibility.',
  nextLevelJobsEligible: true,
  employerPartners: [
    '2 HVAC employer partners (onboarding)',
    'Jesse J. Wilkerson & Associates — Construction',
  ],
  selfPayCost: '$5,000',
  cohortPricing: 'Contact us for organizational/cohort pricing',
  pricingIncludes: [
    '240 instructional hours (12 weeks)',
    'EPA 608 Universal exam fee (ESCO or Mainstream Engineering)',
    'OSHA 30-Hour Construction Safety certification',
    'CPR/First Aid/AED certification',
    'All PPE, tools, and materials',
    'LMS access for full program duration',
    'Career placement support and resume assistance',
  ],
  paymentTerms: 'WIOA, Next Level Jobs, and Workforce Ready Grant funding accepted. Payment plans available for self-pay students.',

  overview: 'This 12-week program covers residential and light commercial HVAC systems through a structured workforce pathway. Weeks 1–5 build foundational knowledge: HVAC fundamentals, electrical basics, heating systems, and cooling/refrigeration. Weeks 6–8 focus on EPA 608 certification prep across all four sections (Core, Type I, Type II, Type III) with timed practice exams. Weeks 9–11 cover advanced diagnostics, installation, troubleshooting, and OSHA 30. Week 12 includes the proctored EPA 608 Universal exam, CPR/AED certification, and career placement. Every module has measurable competency standards — superheat within ±2°F, evacuation to 500 microns, fault diagnosis within 30 minutes.',
  highlights: [
    'Week 1–2: HVAC fundamentals, tools, safety, and the refrigeration cycle',
    'Week 3–4: Electrical basics, heating systems, and heat pump operation',
    'Week 5: Cooling systems — superheat, subcooling, and PT chart mastery',
    'Week 6: EPA 608 Core — ozone, Clean Air Act, recovery/recycling/reclamation',
    'Week 7: EPA 608 Type I (small appliances) + Type II (high-pressure systems)',
    'Week 8: EPA 608 Type III (low-pressure) + Universal exam prep (100 questions)',
    'Week 9–10: Refrigerant charging, diagnostics, ductwork, and installation',
    'Week 11: Systematic troubleshooting + OSHA 30-Hour Construction Safety',
    'Week 12: Proctored EPA 608 exam, CPR/AED, resume, and mock interviews',
  ],
  overviewImage: '/images/programs-fresh/hvac.jpg',
  overviewImageAlt: 'HVAC technician servicing an air conditioning unit',
  salaryNumber: 52000,
  salaryLabel: 'Average annual salary for HVAC technicians in Indiana (BLS)',
  salaryPrefix: '$',

  curriculum: [
    {
      title: 'Week 1–2: Foundations',
      topics: [
        'Program orientation and workforce readiness',
        'How HVAC systems work — heating, cooling, ventilation',
        'HVAC tools and equipment identification (10/10 practical)',
        'PPE and shop safety — LOTO per OSHA 1910.147',
        'System components identification lab',
      ],
    },
    {
      title: 'Week 3: Electrical Basics',
      topics: [
        'Voltage, current, resistance, and Ohm\'s Law',
        'Reading wiring diagrams and schematics',
        'Multimeter operation and electrical testing (±5% accuracy)',
        'Capacitors, contactors, and relays',
      ],
    },
    {
      title: 'Week 4: Heating Systems',
      topics: [
        'Gas furnace operation and ignition systems',
        'Electric heat and heat strips',
        'Heat pump heating mode and reversing valve',
        'Combustion analysis — CO below 100 ppm',
        'Temperature rise measurement (±5°F of nameplate)',
      ],
    },
    {
      title: 'Week 5: Cooling & Refrigeration',
      topics: [
        'The refrigeration cycle — 4 stages',
        'Pressure-temperature relationship and PT charts (5-second lookup)',
        'Superheat and subcooling measurement (±2°F)',
        'Compressor types and metering devices',
      ],
    },
    {
      title: 'Week 6: EPA 608 Core',
      topics: [
        'Ozone layer and environmental impact',
        'Clean Air Act Section 608 regulations and fines',
        'Refrigerant safety and cylinder handling',
        'Refrigerant types: CFC, HCFC, HFC, HFO — classify 10 by ODP',
        'Recovery, recycling, and reclamation definitions',
        '25-question Core practice exam (85% to pass)',
      ],
    },
    {
      title: 'Week 7: EPA 608 Type I & II',
      topics: [
        'Small appliance systems (Type I) — <5 lbs refrigerant',
        'Recovery requirements: 90%/80%/0% by date and type',
        'High-pressure systems (Type II) — R-410A, R-22, R-134a',
        'Evacuation to 500 microns',
        'Leak detection methods — electronic, UV dye, soap bubbles',
        'Leak repair timelines (10%/20% triggers)',
      ],
    },
    {
      title: 'Week 8: EPA 608 Type III & Universal Prep',
      topics: [
        'Low-pressure systems and centrifugal chillers',
        'Purge units and vacuum operation',
        'Type III recovery: 0 psig <200 lbs, 25 mm Hg absolute ≥200 lbs',
        '100-question Universal practice exam (70% per section)',
        'Section comparison charts and weak-area review',
      ],
    },
    {
      title: 'Week 9–10: Advanced Skills',
      topics: [
        'Refrigerant charging: subcooling and superheat methods (±2°F)',
        'System diagnostics with manifold gauges — 4/4 fault diagnoses',
        'Ductwork design and static pressure (±0.02 in. w.c.)',
        'Equipment sizing (Manual J basics)',
        'Brazing and line set installation — passes 150 psi nitrogen test',
      ],
    },
    {
      title: 'Week 11: Troubleshooting & OSHA',
      topics: [
        'Systematic troubleshooting method (6 steps)',
        'Common AC failures: bad capacitor, frozen coil, low charge',
        'Common heating failures: ignition, heat exchanger, gas valve',
        '3 faults diagnosed in 30 minutes each',
        'OSHA 30-Hour Construction Safety certification',
        'Fall protection, electrical safety, HazCom, confined spaces',
      ],
    },
    {
      title: 'Week 12: Certification & Placement',
      topics: [
        'Proctored EPA 608 Universal exam (ESCO/Mainstream Engineering)',
        'CPR/First Aid/AED certification',
        'Resume building and portfolio preparation',
        'Mock interviews for HVAC positions',
        'Employer introductions and placement support',
      ],
    },
  ],

  instructionalDelivery: {
    description: 'Online Related Technical Instruction (RTI) delivered through the Elevate LMS with video lessons, reading materials, interactive quizzes, and EPA 608 practice exams. Hands-on lab training conducted at approved training facilities under direct instructor supervision. On-the-Job Training (OJT) completed at employer partner sites.',
    qualifications: 'Instruction overseen by EPA 608 Universal-certified HVAC technicians with a minimum of 5 years of field experience in residential and light commercial systems. Instructors hold current OSHA 30 certification and maintain active industry credentials.',
    labProvider: 'Hands-on labs conducted at the Elevate training center in Indianapolis. Students work on live HVAC equipment including split systems, package units, furnaces, and refrigeration trainers. All tools, PPE, and materials provided.',
    ojtProvider: 'On-the-Job Training arranged through employer partners including residential HVAC contractors, commercial service providers, and facilities maintenance departments. OJT hours count toward DOL Registered Apprenticeship requirements where applicable.',
  },

  hoursBreakdown: [
    { label: 'Online Coursework (LMS)', hours: 130 },
    { label: 'Lab Demonstrations / Guided Practice', hours: 70 },
    { label: 'Employer Exposure / Field Observation', hours: 40 },
  ],

  assessmentStructure: {
    requirements: [
      'Weekly competency quizzes with minimum 70% passing score',
      'Hands-on lab demonstrations evaluated by instructor against competency standards',
      'EPA 608 Universal proctored exam (80 questions, 70% per section required)',
      'OSHA 30-Hour Construction Safety course completion',
      'CPR/First Aid/AED practical skills assessment',
      'Final troubleshooting assessment: diagnose 3 system faults within 30 minutes each',
      'Resume and mock interview completion for career placement',
    ],
    passingScore: 80,
    retakePolicy: 'Students may retake quizzes up to 3 times. EPA 608 exam retakes available through the certifying organization (additional fee may apply if not covered by funding).',
  },

  employerPathway: {
    description: 'Elevate career services works directly with employer partners to place graduates into HVAC positions. Students receive resume assistance, mock interviews, and direct introductions to hiring managers during Week 12.',
    sectors: [
      'Residential HVAC contractors',
      'Commercial HVAC service providers',
      'Property management companies',
      'Facilities maintenance departments',
      'Refrigeration and cold storage',
      'New construction mechanical contractors',
    ],
    placementRate: '90%',
    placementWindow: '90 days of program completion',
  },

  credentials: [
    'EPA 608 Universal — proctored on-site via ESCO Institute or Mainstream Engineering',
    'OSHA 30-Hour Construction Safety (DOL card)',
    'CPR/First Aid/AED (nationally accredited provider)',
    'Residential HVAC Certification 1 & 2',
    'Rise Up Retail Industry Fundamentals (NRF Foundation)',
  ],

  careers: [
    { title: 'HVAC Technician', salary: '$42,000–$62,000' },
    { title: 'HVAC Installer', salary: '$38,000–$55,000' },
    { title: 'Maintenance Technician', salary: '$40,000–$58,000' },
    { title: 'Refrigeration Technician', salary: '$45,000–$65,000' },
    { title: 'HVAC Service Manager', salary: '$55,000–$80,000' },
  ],

  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA/Next Level Jobs eligibility.' },
    { title: 'Attend Orientation', desc: 'Tour the training facility and meet your instructor.' },
    { title: 'Start Training', desc: 'Begin 12 weeks of structured HVAC training with certification exams included.' },
  ],

  faqs: [
    {
      question: 'Do I need HVAC experience?',
      answer: 'No. This program starts from the basics. Week 1 covers orientation, tools, and safety. You will learn refrigeration theory, electrical fundamentals, and hands-on skills from scratch.',
    },
    {
      question: 'Is this program free?',
      answer: 'Yes, for eligible participants. WIOA, Next Level Jobs, and Workforce Ready Grant funding covers tuition, tools, certification exam fees, and materials. If you do not qualify for funding, self-pay is $5,000 with payment plans available.',
    },
    {
      question: 'What is EPA 608?',
      answer: 'EPA Section 608 is a federal certification required by law for anyone who purchases or handles refrigerants. The Universal level covers all equipment types (small appliances, high-pressure, and low-pressure). Elevate administers the proctored exam on-site through EPA-approved certifying organizations (ESCO Institute and Mainstream Engineering). The exam has 80 questions across 4 sections — you need 70% on each section to pass.',
    },
    {
      question: 'What certifications will I earn?',
      answer: 'EPA 608 Universal, OSHA 30-Hour Construction Safety, CPR/First Aid/AED, Residential HVAC Certification 1 & 2, and Rise Up (NRF Foundation). All exam fees are included in the program.',
    },
    {
      question: 'How is the program structured?',
      answer: 'The 12-week program uses a hybrid model: Related Technical Instruction is delivered online through our LMS with video lessons, reading materials, and practice quizzes. Hands-on labs are completed at the training facility with instructor supervision. On-the-Job Training occurs at employer partner sites.',
    },
    {
      question: 'What happens after I graduate?',
      answer: 'Our career services team helps with resume building, mock interviews, and direct introductions to HVAC employer partners. The median salary for HVAC technicians in Indiana is $52,000/year, with experienced technicians earning $65,000+.',
    },
  ],

  applyHref: '/apply?program=hvac-technician',
  courseHref: '/programs/hvac-technician/course',
  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Skilled Trades', href: '/programs/skilled-trades' },
    { label: 'HVAC Technician' },
  ],
};

import SponsorDisclosure from '@/components/compliance/SponsorDisclosure';

export default function Page() {
  return (
    <>
      <ProgramStructuredData
        program={{
          id: 'hvac-technician',
          name: config.title,
          slug: 'hvac-technician',
          description: config.subtitle,
          duration_weeks: 12,
          price: 0,
          image_url: `${SITE_URL}/images/programs-fresh/hvac.jpg`,
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
