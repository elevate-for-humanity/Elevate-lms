export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Entrepreneurship & Small Business | Indianapolis',
  description: 'Learn to start and run a small business. 5-week program covering business planning, marketing, finance, and legal structure.',
  alternates: { canonical: `${SITE_URL}/programs/entrepreneurship` },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/it-technology.mp4',
  voiceoverSrc: '/audio/heroes/business.mp3',
  title: 'Entrepreneurship & Small Business', subtitle: 'Turn your business idea into reality. Learn planning, marketing, finance, and operations in 5 weeks.',
  badge: 'Self-Pay', badgeColor: 'orange',
  duration: '5 weeks', cost: '$1,500', format: 'In-person, Indianapolis', credential: 'Certificate of Completion',
  overview: 'This 5-week program teaches you how to start and run a small business. You will write a business plan, learn marketing fundamentals, understand basic accounting, and navigate legal requirements. The program is designed for aspiring entrepreneurs and existing small business owners who want to formalize their operations.',
  highlights: ['Business plan development from scratch', 'Marketing strategy and social media', 'Basic accounting and QuickBooks', 'Legal structure (LLC, S-Corp, sole proprietor)', 'Funding sources and loan readiness', 'Pitch presentation to local business leaders'],
  overviewImage: '/images/programs-fresh/entrepreneurship.jpg', overviewImageAlt: 'Entrepreneur working on a business plan',
  salaryNumber: 0, salaryLabel: 'Build your own income as a business owner', salaryPrefix: '',
  curriculum: [
    { title: 'Business Planning', topics: ['Market research', 'Business model canvas', 'Revenue projections', 'Competitive analysis', 'Written business plan'] },
    { title: 'Marketing', topics: ['Brand identity basics', 'Social media marketing', 'Google Business Profile', 'Customer acquisition', 'Content marketing'] },
    { title: 'Finance', topics: ['Startup costs and budgeting', 'QuickBooks setup', 'Pricing strategies', 'Cash flow management', 'Tax obligations'] },
    { title: 'Legal & Operations', topics: ['Business entity selection', 'EIN and state registration', 'Licenses and permits', 'Insurance basics', 'Contracts and agreements'] },
    { title: 'Pitch & Launch', topics: ['Elevator pitch development', 'Presentation to business panel', 'Funding sources (SBA, grants)', 'Networking strategies', 'Post-program mentorship'] },
  ],
  credentials: ['Certificate of Completion', 'Completed Business Plan'],
  careers: [
    { title: 'Small Business Owner', salary: 'Variable' },
    { title: 'Freelance Consultant', salary: '$40,000–$100,000+' },
    { title: 'E-Commerce Entrepreneur', salary: 'Variable' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Enroll', desc: 'Payment plans available — 6 weekly payments of $250.' },
    { title: 'Attend Orientation', desc: 'Meet your instructor and fellow entrepreneurs.' },
    { title: 'Start Building', desc: 'Begin your 5-week entrepreneurship program.' },
  ],
  faqs: [
    { question: 'Do I need a business idea to enroll?', answer: 'Having an idea helps, but it is not required. The first week focuses on identifying opportunities and validating ideas. Many students refine or change their idea during the program.' },
    { question: 'Will I have a business plan when I finish?', answer: 'Yes. You will complete a full written business plan that you can use to apply for loans, grants, or pitch to investors.' },
    { question: 'Is this program eligible for WIOA funding?', answer: 'This is a self-pay program at $1,500. Payment plans are available. Some participants may qualify for microenterprise grants through local workforce programs.' },
  ],
  applyHref: '/apply?program=entrepreneurship',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Business', href: '/programs/business' }, { label: 'Entrepreneurship' }],
};

export default function Page() {
  return (<><ProgramStructuredData program={{ id: 'entrepreneurship', name: config.title, slug: 'entrepreneurship', description: config.subtitle, duration_weeks: 5, price: 1500, image_url: `${SITE_URL}/images/programs-fresh/entrepreneurship.jpg`, category: 'Business', outcomes: config.credentials || [] }} /><ProgramPageLayout config={config} /></>);
}
