export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Diesel Mechanic Training | ASE Prep | Indianapolis',
  description: 'Diesel engine repair and maintenance training. 12-week program. OSHA 10 certified. Funding available for eligible participants.',
  alternates: { canonical: `${SITE_URL}/programs/diesel-mechanic` },
  openGraph: {
    title: 'Diesel Mechanic Training | ASE Prep | Indianapolis',
    description: 'Diesel engine repair and maintenance training. 12-week program. OSHA 10 certified. Funding available for eligible participants.',
    url: `${SITE_URL}/programs/diesel-mechanic`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Diesel Mechanic Training | ASE Prep | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/electrician-trades.mp4',
  title: 'Diesel Mechanic', subtitle: 'Diagnose and repair diesel engines, transmissions, and hydraulic systems. OSHA 10 and ASE prep in 12 weeks.',
  badge: 'Accepting Interest', badgeColor: 'orange',
  statusNotice: 'This program requires employer shop partners for hands-on training. We are actively recruiting diesel shops. Submit an interest form to be notified when enrollment opens.',
  duration: '12 weeks', cost: '$0 with WIOA funding', format: 'In-person, Indianapolis', credential: 'OSHA 10 + ASE Prep',
  overview: 'This 12-week program covers diesel engine theory, fuel systems, electrical systems, brakes, transmissions, and hydraulics. You will work on real diesel engines and heavy equipment in a hands-on shop. Graduates earn OSHA 10 certification and are prepared for ASE Medium/Heavy Truck certification exams.',
  highlights: ['Diesel engine theory and operation', 'Fuel system diagnosis and repair', 'Electrical and electronic systems', 'Brake and transmission service', 'Hydraulic system fundamentals', 'OSHA 10-Hour Construction Safety'],
  overviewImage: '/images/programs-fresh/diesel-mechanic.jpg', overviewImageAlt: 'Diesel mechanic student working on an engine',
  salaryNumber: 55000, salaryLabel: 'Average annual salary for diesel mechanics in Indiana (BLS)', salaryPrefix: '$',
  curriculum: [
    { title: 'Diesel Engines', topics: ['Engine theory and operation', 'Cylinder head and valve train', 'Piston and crankshaft assembly', 'Cooling and lubrication systems', 'Engine performance testing'] },
    { title: 'Fuel Systems', topics: ['Diesel fuel properties', 'Injection systems', 'Common rail systems', 'Fuel filters and water separators', 'Emissions controls'] },
    { title: 'Electrical Systems', topics: ['Starting and charging systems', 'Wiring diagrams', 'Sensor and actuator testing', 'Diagnostic scan tools', 'Multiplexing basics'] },
    { title: 'Drivetrain & Brakes', topics: ['Manual transmissions', 'Automatic transmissions', 'Drive axles and differentials', 'Air brake systems', 'ABS diagnostics'] },
    { title: 'Safety & Certification', topics: ['OSHA 10-Hour certification', 'Shop safety procedures', 'Hazardous materials handling', 'ASE exam preparation', 'Career placement support'] },
  ],
  credentials: ['OSHA 10-Hour Construction Safety (DOL card)', 'ASE Medium/Heavy Truck exam preparation', 'CPR/First Aid (AHA/HSI issued)', 'Elevate Certificate of Completion'],
  careers: [
    { title: 'Diesel Mechanic', salary: '$45,000–$65,000' },
    { title: 'Heavy Equipment Mechanic', salary: '$48,000–$68,000' },
    { title: 'Fleet Maintenance Technician', salary: '$42,000–$60,000' },
    { title: 'Mobile Diesel Technician', salary: '$50,000–$70,000' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Attend Orientation', desc: 'Tour the diesel shop and meet your instructor.' },
    { title: 'Start Training', desc: 'Begin 12 weeks of hands-on diesel training.' },
  ],
  faqs: [
    { question: 'Do I need prior mechanic experience?', answer: 'No. This program starts with engine theory fundamentals and builds to advanced diagnostics. Basic mechanical aptitude is helpful but not required.' },
    { question: 'What tools do I need?', answer: 'A basic hand tool set is recommended. Specialty tools and diagnostic equipment are provided in the shop. WIOA funding may cover tool costs for eligible participants.' },
    { question: 'Is this program WIOA-funded?', answer: 'Yes. Eligible participants can receive full funding through WIOA, covering tuition, materials, OSHA certification, and supportive services. Register at Indiana Career Connect to check eligibility.' },
    { question: 'What is ASE certification?', answer: 'ASE (Automotive Service Excellence) is the industry-standard certification for mechanics. This program prepares you for the ASE Medium/Heavy Truck exams. You can sit for the exams after gaining qualifying work experience.' },
    { question: 'Where do graduates work?', answer: 'Graduates work at trucking companies, fleet maintenance shops, heavy equipment dealers, construction companies, and independent diesel repair shops. Some start mobile diesel repair businesses.' },
  ],
  applyHref: '/inquiry?program=diesel-mechanic',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Skilled Trades', href: '/programs/skilled-trades' }, { label: 'Diesel Mechanic' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'diesel-mechanic', name: config.title, slug: 'diesel-mechanic', description: config.subtitle, duration_weeks: 12, price: 0, image_url: `${SITE_URL}/images/programs-fresh/diesel-mechanic.jpg`, category: 'Skilled Trades', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
