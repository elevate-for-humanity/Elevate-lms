export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'HVAC Technician Training | EPA 608 Certified | Indianapolis',
  description: '15-week HVAC program. EPA 608, OSHA 30, and 6 industry credentials. Free for eligible participants through WIOA.',
  alternates: { canonical: `${SITE_URL}/programs/hvac-technician` },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/electrician-trades.mp4', voiceoverSrc: '/audio/heroes/skilled-trades.mp3',
  title: 'HVAC Technician', subtitle: 'Install, maintain, and repair heating and cooling systems. Earn EPA 608 and OSHA 30 in 15 weeks.',
  badge: 'Funding Available', badgeColor: 'orange',
  duration: '15 weeks', cost: '$0 with WIOA funding', format: 'In-person, Indianapolis', credential: 'EPA 608 Universal + OSHA 30',
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
  credentials: ['EPA 608 Universal Certification', 'OSHA 30-Hour Construction Safety', 'Residential HVAC Certification 1 & 2', 'CPR/First Aid', 'Rise Up'],
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
    { question: 'What is EPA 608?', answer: 'EPA 608 is a federal certification required for anyone who handles refrigerants. The Universal level covers all equipment types. It is required by law for HVAC technicians.' },
  ],
  applyHref: '/apply?program=hvac-technician',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Skilled Trades', href: '/programs/skilled-trades' }, { label: 'HVAC Technician' }],
};

import SponsorDisclosure from '@/components/compliance/SponsorDisclosure';

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'hvac-technician', name: config.title, slug: 'hvac-technician', description: config.subtitle, duration_weeks: 15, price: 0, image_url: `${SITE_URL}/images/programs-fresh/hvac.jpg`, category: 'Skilled Trades', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config}><SponsorDisclosure /></ProgramPageLayout></>);
}
