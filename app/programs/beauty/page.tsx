import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProgramPageLayout, { type ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
import { InView } from '@/components/ui/InView';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Beauty & Cosmetology Programs | Elevate for Humanity',
  description:
    'Barber, cosmetology, esthetician, and nail technician apprenticeship pathways with hands-on training, program holder partnerships, and career support.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/beauty' },
  openGraph: {
    title: 'Beauty & Cosmetology Programs | Elevate for Humanity',
    description:
      'Hands-on beauty and personal services training pathways with apprenticeship and program holder support.',
    url: 'https://www.elevateforhumanity.org/programs/beauty',
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [
      {
        url: '/images/beauty/program-beauty-training.webp',
        width: 1200,
        height: 630,
        alt: 'Beauty and cosmetology training programs',
      },
    ],
    type: 'website',
  },
};

const programs = [
  {
    title: 'Barber Apprenticeship',
    duration: '12–18 months',
    credential: 'Indiana barber license pathway',
    href: '/programs/barber-apprenticeship',
    image: '/images/beauty/hero-program-barber.webp',
  },
  {
    title: 'Cosmetology Apprenticeship',
    duration: '12–18 months',
    credential: 'Indiana cosmetology license pathway',
    href: '/programs/cosmetology-apprenticeship',
    image: '/images/pages/cosmetology-apprenticeship-hero.webp',
  },
  {
    title: 'Esthetician Apprenticeship',
    duration: '6–12 months',
    credential: 'Indiana esthetician license pathway',
    href: '/programs/esthetician-apprenticeship',
    image: '/images/beauty/esthetician.webp',
  },
  {
    title: 'Nail Technician Apprenticeship',
    duration: '6–12 months',
    credential: 'Indiana nail technician license pathway',
    href: '/programs/nail-technician-apprenticeship',
    image: '/images/pages/nail-tech-hero.webp',
  },
];

const config: ProgramPageConfig = {
  pageKey: 'beauty',
  title: 'Beauty & Cosmetology Programs',
  subtitle:
    'Hands-on personal services pathways for barbering, cosmetology, esthetics, and nail technology through approved program holder and apprenticeship partners.',
  badge: 'Apprenticeship Pathways',
  badgeColor: 'purple',
  duration: '6–18 months',
  cost: 'Funding and partner options vary',
  format: 'In-person + supervised practice',
  credential: 'Indiana licensing pathways',
  heroImage: '/images/beauty/program-beauty-training.webp',
  heroImageAlt: 'Beauty and cosmetology students practicing hands-on services',
  overview:
    'Elevate connects learners with beauty and personal services pathways that combine classroom preparation, hands-on practice, and supervised workplace learning. Each pathway is aligned to licensing expectations and documented through program holder agreements.',
  highlights: [
    'Program holder and apprenticeship partner model',
    'Hands-on supervised practice in approved training environments',
    'Documentation of attendance, skills progress, and completion outcomes',
    'Career support for salon, barbershop, spa, and independent contractor pathways',
  ],
  overviewImage: '/images/beauty/program-beauty-training.webp',
  overviewImageAlt: 'Beauty program hands-on training environment',
  salaryNumber: 42000,
  salaryLabel: 'Typical entry-level earning potential varies by license and placement',
  salaryPrefix: '$',
  credentials: [
    'Barber license pathway',
    'Cosmetology license pathway',
    'Esthetician license pathway',
    'Nail technician license pathway',
  ],
  careers: [
    { title: 'Barber', salary: '$35,000–$65,000+' },
    { title: 'Cosmetologist', salary: '$34,000–$60,000+' },
    { title: 'Esthetician', salary: '$34,000–$58,000+' },
    { title: 'Nail Technician', salary: '$30,000–$55,000+' },
  ],
  steps: [
    { title: 'Apply Online', desc: 'Submit the program interest form and choose a pathway.' },
    {
      title: 'Confirm Fit and Funding',
      desc: 'Review eligibility, schedule, and partner site options.',
    },
    {
      title: 'Start Supervised Training',
      desc: 'Begin instruction, hands-on practice, and attendance tracking.',
    },
    {
      title: 'Complete Licensing Pathway',
      desc: 'Document hours, skills, completion, and next career steps.',
    },
  ],
  applyHref: '/apply?program=beauty',
  inquiryHref: '/inquiry?program=beauty',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Beauty & Cosmetology' }],
};

export default function BeautyProgramsPage() {
  return (
    <ProgramPageLayout config={config}>
      <InView animation="fade-up">
        <section className="py-14 lg:py-20 border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10">
              <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">
                Choose Your Path
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Beauty & Personal Services Pathways
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {programs.map((program, index) => (
                <ScrollReveal key={program.title} delay={index * 60} direction="up">
                  <Link
                    href={program.href}
                    className="group block overflow-hidden rounded-xl border-2 border-slate-200 bg-white transition-all hover:border-brand-red-400 hover:shadow-md"
                  >
                    <div className="relative aspect-[3/2] w-full overflow-hidden bg-slate-100">
                      <Image
                        fill
                        src={program.image}
                        alt={program.title}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,25vw"
                        placeholder="empty"
                      />
                    </div>
                    <div className="p-5">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 leading-snug">
                          {program.title}
                        </span>
                        <span className="rounded-full bg-brand-blue-50 px-2 py-1 text-xs font-semibold text-brand-blue-600">
                          {program.duration}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{program.credential}</p>
                      <div className="mt-3 text-sm font-semibold text-brand-red-600 group-hover:underline">
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
