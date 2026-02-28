export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'HVAC Technician Training | EPA 608 Certified | Indianapolis',
  description: '15-week HVAC program. EPA 608, OSHA 30, and 6 industry credentials. Funding available for eligible participants through WIOA.',
  alternates: { canonical: `${SITE_URL}/programs/hvac-technician` },
  openGraph: {
    title: 'HVAC Technician Training | EPA 608 Certified | Indianapolis',
    description: '15-week HVAC program. EPA 608, OSHA 30, and 6 industry credentials. Funding available for eligible participants through WIOA.',
    url: `${SITE_URL}/programs/hvac-technician`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'HVAC Technician Training | EPA 608 Certified | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/hvac-technician.mp4', voiceoverSrc: '/audio/heroes/skilled-trades.mp3',
  title: 'HVAC Technician', subtitle: 'Install, maintain, and repair heating and cooling systems. Earn EPA 608 and OSHA 30 in 15 weeks.',
  badge: 'Funding Available', badgeColor: 'orange',
  duration: '15 weeks', cost: '$0 with WIOA funding', format: 'Hybrid — In-person + LMS', credential: 'EPA 608 Universal + OSHA 30',

  // Program details
  totalHours: 300,
  schedule: 'Mon–Fri, 8:00 AM–12:00 PM (20 hrs/week)',
  eveningSchedule: 'Evening/weekend cohorts available for working adults. Contact us for schedule options.',
  cohortSize: '10–15 participants per cohort',
  admissionRequirements: ['18 years or older', 'High school diploma or GED (or actively pursuing)', 'Able to lift 50 lbs', 'No prior HVAC experience required'],
  modality: 'Hybrid — In-person hands-on labs, LMS-supported theory, live instructor sessions',
  facilityInfo: 'Elevate training center, Indianapolis',
  equipmentIncluded: 'All PPE, tools, training materials, and certification exam fees included',
  bilingualSupport: 'Bilingual (English/Spanish) instruction available. LMS supports Spanish language accessibility.',
  nextLevelJobsEligible: true,
  employerPartners: ['2 HVAC employer partners (onboarding)', 'Jesse J. Wilkerson & Associates — Construction'],
  selfPayCost: '$5,000',
  cohortPricing: 'Contact us for organizational/cohort pricing',
  pricingIncludes: ['300 instructional hours', 'EPA 608 Universal exam fee', 'OSHA 30-Hour certification', 'CPR/First Aid certification', 'All PPE, tools, and materials', 'LMS access', 'Career placement support'],
  paymentTerms: 'WIOA, Next Level Jobs, and WRG funding accepted. Payment plans available for self-pay students.',
  overview: 'This 15-week program covers residential and light commercial HVAC systems. You will learn refrigeration theory, electrical fundamentals, system installation, troubleshooting, and preventive maintenance. Training includes hands-on work with real HVAC equipment. Graduates earn EPA 608 Universal, OSHA 30, and additional industry credentials.',
  highlights: ['Refrigeration theory and the refrigeration cycle', 'Electrical fundamentals for HVAC', 'System installation and startup', 'Troubleshooting and diagnostics', 'EPA 608 Universal certification', 'OSHA 30-Hour Construction Safety'],
  overviewImage: '/images/programs-fresh/hvac.jpg', overviewImageAlt: 'HVAC technician servicing an air conditioning unit',
  salaryNumber: 52000, salaryLabel: 'Average annual salary for HVAC technicians in Indiana (BLS)', salaryPrefix: '$',
  curriculum: [
    { title: 'Refrigeration Theory', topics: ['Refrigeration cycle', 'Pressure-temperature relationships', 'Refrigerant types and handling', 'Superheat and subcooling', 'System charging'] },
    { title: 'Electrical Fundamentals', topics: ['Ohm\'s Law for HVAC', 'Wiring diagrams', 'Contactors and relays', 'Capacitors and motors', 'Thermostat wiring'] },
    { title: 'Heating Systems', topics: ['Gas furnace operation', 'Ignition systems', 'Heat exchangers', 'Combustion analysis', 'Heat pump operation'] },
    { title: 'Cooling Systems', topics: ['Split system components', 'Compressor types', 'Evaporator and condenser coils', 'Metering devices', 'Ductwork basics'] },
    { title: 'Troubleshooting', topics: ['Systematic diagnosis', 'Electrical testing', 'Refrigerant leak detection', 'Airflow measurement', 'Customer communication'] },
    { title: 'Certifications', topics: ['EPA 608 Universal exam', 'OSHA 30-Hour certification', 'CPR/First Aid', 'Rise Up certification', 'Career placement support'] },
  ],
  credentials: ['EPA 608 Universal (Mainstream Engineering, proctored on-site)', 'OSHA 30-Hour Construction Safety (DOL card)', 'Residential HVAC Certification 1 & 2', 'CPR/First Aid (AHA/HSI issued)', 'Rise Up (NRF Foundation)'],
  careers: [
    { title: 'HVAC Technician', salary: '$42,000–$62,000' },
    { title: 'HVAC Installer', salary: '$38,000–$55,000' },
    { title: 'Maintenance Technician', salary: '$40,000–$58,000' },
    { title: 'HVAC Service Manager', salary: '$55,000–$80,000' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Attend Orientation', desc: 'Tour the HVAC shop and meet your instructor.' },
    { title: 'Start Training', desc: 'Begin 15 weeks of hands-on HVAC training.' },
  ],
  faqs: [
    { question: 'Do I need HVAC experience?', answer: 'No. This program starts from the basics. You will learn refrigeration theory, electrical fundamentals, and hands-on skills from scratch.' },
    { question: 'Is this program free?', answer: 'Yes, for eligible participants. WIOA funding covers tuition, tools, and certification fees. If you do not qualify, payment plans are available.' },
    { question: 'What is EPA 608?', answer: 'EPA 608 is a federal certification required for anyone who handles refrigerants. The Universal level covers all equipment types. It is required by law for HVAC technicians. We proctor the exam on-site using the Mainstream Engineering QwikTest system.' },
  ],
  applyHref: '/apply?program=hvac-technician',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Skilled Trades', href: '/programs/skilled-trades' }, { label: 'HVAC Technician' }],
};

import SponsorDisclosure from '@/components/compliance/SponsorDisclosure';

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'hvac-technician', name: config.title, slug: 'hvac-technician', description: config.subtitle, duration_weeks: 15, price: 0, image_url: `${SITE_URL}/images/programs-fresh/hvac.jpg`, category: 'Skilled Trades', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config}><SponsorDisclosure /></ProgramPageLayout></>);
}
