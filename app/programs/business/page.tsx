import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
import { InView } from '@/components/ui/InView';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { PUBLIC_PROGRAM_DURATION_RANGE } from '@/lib/programs/marketing-duration';

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Business & Finance Training Programs | Indianapolis',
  description:
    'Bookkeeping, business administration, office administration, entrepreneurship, and project management. WIOA and Workforce Ready Grant funding available.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/business' },
  openGraph: {
    title: 'Business & Finance Training Programs | Indianapolis',
    description:
      'Bookkeeping, business administration, office administration, entrepreneurship, and project management.',
    url: 'https://www.elevateforhumanity.org/programs/business',
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Business & Finance Training Programs | Indianapolis',
      },
    ],
    type: 'website',
  },
};

const programs = [
  {
    title: 'Business Administration',
    duration: '8 weeks',
    salary: '$42,000',
    href: '/programs/business-administration',
    image: '/images/business/office-admin.webp',
  },
  {
    title: 'Bookkeeping & QuickBooks',
    duration: '8 weeks',
    salary: '$45,000',
    href: '/programs/bookkeeping',
    image: '/images/business/professional-2.jpg',
  },
  {
    title: 'Office Administration',
    duration: '6 weeks',
    salary: '$40,000',
    href: '/programs/office-administration',
    image: '/images/business/office-admin.webp',
  },
  {
    title: 'Entrepreneurship',
    duration: '8 weeks',
    salary: 'Varies',
    href: '/programs/entrepreneurship',
    image: '/images/business/professional-2.jpg',
  },
  {
    title: 'Project Management',
    duration: '8 weeks',
    salary: '$75,000',
    href: '/programs/project-management',
    image: '/images/pages/admin-automation-hero.webp',
  },
  {
    title: 'Finance & Accounting Pathway',
    duration: '6–16 weeks',
    salary: '$48,000',
    href: '/programs/finance-bookkeeping-accounting',
    image: '/images/pages/finance-accounting.webp',
  },
];

const config: ProgramPageConfig = {
  pageKey: 'business',
  title: 'Business & Finance Programs',
  subtitle:
    'Administrative, bookkeeping, entrepreneurship, and project management pathways with industry-recognized credentials.',
  badge: 'Funding Available',
  badgeColor: 'green',
  duration: PUBLIC_PROGRAM_DURATION_RANGE,
  cost: 'WorkOne funding available',
  format: 'In-person and hybrid, Indianapolis',
  credential: 'QuickBooks · MOS · Certiport',
  overview:
    'Business programs prepare you for office administration, bookkeeping, small business ownership, and project coordination roles. Training combines applied software skills, workplace readiness, and credential exam preparation.',
  highlights: [
    'QuickBooks and office productivity certification prep',
    'WIOA and Workforce Ready Grant eligibility on eligible programs',
    'Career placement support through employer partners',
    'Flexible cohort and self-paced options by program',
    'Stackable credentials from bookkeeping through administration',
  ],
  overviewImage: '/images/business/office-admin.webp',
  overviewImageAlt: 'Business students in office training',
  salaryNumber: 45000,
  salaryLabel: 'Average starting salary across business programs',
  salaryPrefix: '$',
  credentials: ['QuickBooks Certified User', 'Microsoft Office Specialist', 'ACT WorkKeys NCRC'],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Funding Review', desc: 'Work with an advisor on WIOA or self-pay options.' },
    { title: 'Start Training', desc: 'Begin coursework and hands-on labs.' },
    { title: 'Earn Credential', desc: 'Complete certification exams and career placement steps.' },
  ],
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Business Programs' }],
  faqs: [
    {
      question: 'Which business program should I start with?',
      answer:
        'Office Administration and Bookkeeping are common entry points. Business Administration is ideal if you want a broader management pathway.',
    },
    {
      question: 'Is funding available?',
      answer:
        'Many business programs are WIOA-eligible for qualified Indiana residents. Funding approval is not guaranteed.',
    },
  ],
};

export default function BusinessProgramsPage() {
  return (
    <ProgramPageLayout config={config}>
      <InView>
        <section className="py-16 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Programs in this sector</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((p) => (
                <ScrollReveal key={p.href}>
                  <Link
                    href={p.href}
                    className="group block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="relative h-40">
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-slate-900 group-hover:text-brand-red-600 transition-colors">
                        {p.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                        <span>{p.duration}</span>
                        <span className="text-brand-green-600 font-semibold">
                          {p.salary}
                          {/^\$/.test(p.salary) ? '/yr avg' : ''}
                        </span>
                      </div>
                      <div className="mt-3 text-brand-red-600 font-semibold text-sm group-hover:underline">
                        Learn More →
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </InView>
    </ProgramPageLayout>
  );
}
