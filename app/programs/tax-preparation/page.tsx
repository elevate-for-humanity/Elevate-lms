export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Tax Preparation | IRS PTIN Certified | Indianapolis',
  description: 'Become a certified tax preparer. 6-week program covering individual and small business tax returns. Earn your IRS PTIN.',
  alternates: { canonical: `${SITE_URL}/programs/tax-preparation` },
  openGraph: {
    title: 'Tax Preparation | IRS PTIN Certified | Indianapolis',
    description: 'Become a certified tax preparer. 6-week program covering individual and small business tax returns. Earn your IRS PTIN.',
    url: `${SITE_URL}/programs/tax-preparation`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Tax Preparation | IRS PTIN Certified | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/tax-career-paths.mp4',
  title: 'Tax Preparation', subtitle: 'Prepare individual and small business tax returns. Earn your IRS PTIN and start earning during tax season.',
  badge: 'Self-Pay', badgeColor: 'orange',
  duration: '6 weeks', cost: '$1,800', format: 'In-person, Indianapolis', credential: 'IRS PTIN + AFSP',
  overview: 'This 6-week program teaches federal and state income tax preparation for individuals and small businesses. You will learn to use professional tax software, understand tax law, and prepare common return types (1040, Schedule C, 1099). Graduates earn their IRS Preparer Tax Identification Number (PTIN) and are eligible for the Annual Filing Season Program (AFSP).',
  highlights: ['Individual tax return preparation (Form 1040)', 'Small business returns (Schedule C, 1099)', 'Professional tax software training', 'IRS PTIN registration and compliance', 'Annual Filing Season Program (AFSP) eligibility', 'Earn income during tax season immediately'],
  overviewImage: '/images/programs-fresh/tax-preparation.jpg', overviewImageAlt: 'Tax preparer reviewing documents with client',
  salaryNumber: 46000, salaryLabel: 'Average annual salary for tax preparers (BLS)', salaryPrefix: '$',
  curriculum: [
    { title: 'Tax Law Fundamentals', topics: ['Filing status and dependents', 'Income types (W-2, 1099, self-employment)', 'Standard vs itemized deductions', 'Tax credits (EITC, CTC, education)', 'Indiana state tax'] },
    { title: 'Form 1040 Preparation', topics: ['Wages and salary income', 'Interest and dividend income', 'Retirement income', 'Capital gains basics', 'Health insurance reporting'] },
    { title: 'Small Business Tax', topics: ['Schedule C preparation', 'Business expenses and deductions', 'Self-employment tax', 'Quarterly estimated payments', 'Home office deduction'] },
    { title: 'Tax Software', topics: ['Professional software navigation', 'E-filing procedures', 'Quality review process', 'Client intake workflow', 'Data security and compliance'] },
    { title: 'Practice & Certification', topics: ['Practice returns with real scenarios', 'IRS PTIN registration', 'AFSP requirements', 'Ethics and due diligence', 'Career placement and tax season hiring'] },
  ],
  credentials: ['IRS PTIN (self-registered with IRS)', 'AFSP Eligibility (IRS Annual Filing Season Program)', 'Elevate Certificate of Completion'],
  careers: [
    { title: 'Tax Preparer', salary: '$35,000–$55,000' },
    { title: 'Tax Associate (seasonal)', salary: '$15–$25/hr' },
    { title: 'Enrolled Agent (with additional study)', salary: '$50,000–$80,000' },
    { title: 'Independent Tax Preparer', salary: '$40,000–$100,000+' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Enroll', desc: 'Payment plans available. Classes start before tax season.' },
    { title: 'Attend Orientation', desc: 'Meet your instructor and review the program.' },
    { title: 'Start Training', desc: 'Begin your 6-week tax preparation program.' },
  ],
  faqs: [
    { question: 'Do I need accounting experience?', answer: 'No. This program teaches tax preparation from the basics. If you can do basic math and follow instructions, you can learn to prepare tax returns.' },
    { question: 'When should I take this program?', answer: 'Ideally before tax season (January–April). Classes typically start in October or November so you are ready to work by January.' },
    { question: 'Can I start my own tax business?', answer: 'Yes. With your PTIN, you can legally prepare tax returns for compensation. Many graduates start their own seasonal tax preparation business.' },
  ],
  applyHref: '/apply?program=tax-preparation',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Business', href: '/programs/business' }, { label: 'Tax Preparation' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'tax-preparation', name: config.title, slug: 'tax-preparation', description: config.subtitle, duration_weeks: 6, price: 1800, image_url: `${SITE_URL}/images/programs-fresh/tax-preparation.jpg`, category: 'Business', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
