export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Office Administration | Microsoft Office Specialist | Indianapolis',
  description: 'Earn Microsoft Office Specialist certifications. 6-week program. Office administrators earn $42,000/year in Indiana.',
  alternates: { canonical: `${SITE_URL}/programs/office-administration` },
  openGraph: {
    title: 'Office Administration | Microsoft Office Specialist | Indianapolis',
    description: 'Earn Microsoft Office Specialist certifications. 6-week program. Office administrators earn $42,000/year in Indiana.',
    url: `${SITE_URL}/programs/office-administration`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Office Administration | Microsoft Office Specialist | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/it-technology.mp4',
  voiceoverSrc: '/audio/heroes/business.mp3',
  title: 'Office Administration',
  subtitle: 'Master Microsoft Office and business communication. Earn Microsoft Office Specialist certifications in 6 weeks.',
  badge: 'Funding Available',
  badgeColor: 'green',
  duration: '6 weeks',
  cost: '$3,200 (WorkOne funding available)',
  format: 'In-person, Indianapolis',
  credential: 'Microsoft Office Specialist',
  overview: 'This 6-week program teaches Microsoft Word, Excel, PowerPoint, and Outlook at a professional level. You will also learn business writing, office procedures, and customer service skills. Graduates earn Microsoft Office Specialist certifications and are prepared for administrative assistant, receptionist, and office coordinator positions.',
  highlights: ['Microsoft Word — documents, mail merge, formatting', 'Microsoft Excel — formulas, pivot tables, charts', 'Microsoft PowerPoint — presentations and design', 'Business writing and professional communication', 'Microsoft Office Specialist certification exams included', 'Customer service and office procedures'],
  overviewImage: '/images/programs-fresh/office-admin.jpg',
  overviewImageAlt: 'Office professional working at a computer',
  salaryNumber: 42000,
  salaryLabel: 'Average annual salary for office administrators in Indiana (BLS)',
  salaryPrefix: '$',
  curriculum: [
    { title: 'Microsoft Word', topics: ['Document formatting and styles', 'Tables and graphics', 'Mail merge', 'Headers, footers, page layout', 'Track changes and collaboration'] },
    { title: 'Microsoft Excel', topics: ['Formulas and functions', 'Data sorting and filtering', 'Pivot tables and charts', 'Conditional formatting', 'VLOOKUP and IF statements'] },
    { title: 'PowerPoint & Outlook', topics: ['Slide design and templates', 'Animations and transitions', 'Email management', 'Calendar and scheduling', 'Contact management'] },
    { title: 'Business Skills', topics: ['Professional writing', 'Phone and email etiquette', 'Filing and records management', 'Meeting coordination', 'Customer service fundamentals'] },
    { title: 'Certification Prep', topics: ['MOS Word exam objectives', 'MOS Excel exam objectives', 'Practice exams', 'On-site Certiport testing', 'Career placement support'] },
  ],
  credentials: ['Microsoft Office Specialist — Word', 'Microsoft Office Specialist — Excel', 'Certificate of Completion'],
  careers: [
    { title: 'Administrative Assistant', salary: '$35,000–$48,000' },
    { title: 'Receptionist', salary: '$30,000–$38,000' },
    { title: 'Office Coordinator', salary: '$38,000–$50,000' },
    { title: 'Executive Assistant', salary: '$45,000–$60,000' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Attend Orientation', desc: 'Meet your instructor and review the program.' },
    { title: 'Start Training', desc: 'Begin your 6-week office administration program.' },
  ],
  faqs: [
    { question: 'Do I need computer experience?', answer: 'Basic computer skills are helpful but not required. If you can turn on a computer and use a mouse, you have enough to start. We teach everything from the basics.' },
    { question: 'What is Microsoft Office Specialist?', answer: 'MOS is the official Microsoft certification for Office applications. It is recognized by employers worldwide and validates your proficiency in Word, Excel, and other Office tools.' },
  ],
  applyHref: '/apply?program=office-administration',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Technology', href: '/programs/technology' }, { label: 'Office Administration' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'office-administration', name: config.title, slug: 'office-administration', description: config.subtitle, duration_weeks: 6, price: 3200, image_url: `${SITE_URL}/images/programs-fresh/office-admin.jpg`, category: 'Technology', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
