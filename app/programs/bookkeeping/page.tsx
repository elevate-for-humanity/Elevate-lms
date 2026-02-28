export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Bookkeeping & QuickBooks | Certified User | Indianapolis',
  description: 'Earn QuickBooks Certified User credential. 5-week program. Bookkeepers earn $45,860/year in Indiana.',
  alternates: { canonical: `${SITE_URL}/programs/bookkeeping` },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/it-technology.mp4',
  voiceoverSrc: '/audio/heroes/business.mp3',
  title: 'Bookkeeping & QuickBooks', subtitle: 'Master small business accounting and earn the QuickBooks Certified User credential in 5 weeks.',
  badge: 'Self-Pay', badgeColor: 'orange',
  duration: '5 weeks', cost: '$1,500', format: 'In-person, Indianapolis', credential: 'QuickBooks Certified User',
  overview: 'This 5-week program teaches double-entry bookkeeping, financial statements, payroll basics, and QuickBooks Online. You will set up company files, record transactions, reconcile bank accounts, run reports, and prepare for the QuickBooks Certified User exam. No prior accounting experience required.',
  highlights: ['Double-entry bookkeeping fundamentals', 'QuickBooks Online — setup to reporting', 'Bank reconciliation and payroll basics', 'Financial statement preparation', 'QuickBooks Certified User exam included', 'Real-world business scenarios'],
  overviewImage: '/images/programs-fresh/bookkeeping.jpg', overviewImageAlt: 'Bookkeeper working with financial documents',
  salaryNumber: 45860, salaryLabel: 'Average annual salary for bookkeepers in Indiana (BLS)', salaryPrefix: '$',
  curriculum: [
    { title: 'Accounting Fundamentals', topics: ['Debits and credits', 'Chart of accounts', 'Journal entries', 'General ledger', 'Trial balance'] },
    { title: 'QuickBooks Online', topics: ['Company setup and preferences', 'Invoicing and payments', 'Bill pay and expenses', 'Bank feeds and reconciliation', 'Financial reports'] },
    { title: 'Payroll & Tax', topics: ['Payroll setup and processing', 'Payroll tax calculations', 'W-2 and 1099 preparation', 'Sales tax tracking', 'Year-end procedures'] },
    { title: 'Financial Statements', topics: ['Income statement (P&L)', 'Balance sheet', 'Cash flow statement', 'Budget vs actual reports', 'Financial analysis basics'] },
    { title: 'Certification Prep', topics: ['QuickBooks Certified User objectives', 'Practice exams', 'On-site Certiport testing', 'Resume and interview prep', 'Career placement support'] },
  ],
  credentials: ['QuickBooks Certified User', 'Certificate of Completion'],
  careers: [
    { title: 'Bookkeeper', salary: '$38,000–$52,000' },
    { title: 'Accounts Payable Clerk', salary: '$36,000–$46,000' },
    { title: 'Accounts Receivable Clerk', salary: '$35,000–$45,000' },
    { title: 'Payroll Specialist', salary: '$40,000–$55,000' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Enroll', desc: 'Payment plans available — 6 weekly payments of $250.' },
    { title: 'Attend Orientation', desc: 'Meet your instructor and review the program.' },
    { title: 'Start Training', desc: 'Begin your 5-week bookkeeping program.' },
  ],
  faqs: [
    { question: 'Do I need accounting experience?', answer: 'No. This program starts from the basics — what debits and credits are, how a chart of accounts works. No math beyond basic arithmetic is required.' },
    { question: 'Is this program eligible for WIOA funding?', answer: 'Yes. This program is ETPL approved. WIOA and Workforce Ready Grant funding available for eligible participants. Self-pay is $2,800 with payment plans available.' },
    { question: 'What software will I learn?', answer: 'QuickBooks Online — the most widely used small business accounting software. You will also be prepared for the QuickBooks Certified User exam.' },
  ],
  applyHref: '/apply?program=bookkeeping',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Business', href: '/programs/business' }, { label: 'Bookkeeping & QuickBooks' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'bookkeeping', name: config.title, slug: 'bookkeeping', description: config.subtitle, duration_weeks: 5, price: 1500, image_url: `${SITE_URL}/images/programs-fresh/bookkeeping.jpg`, category: 'Business', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
