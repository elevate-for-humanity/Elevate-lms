export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ALL_PROGRAMS, SECTORS } from '@/data/programs/catalog';
import PageVideoHero from '@/components/ui/PageVideoHero';
import CatalogFilters from './CatalogFilters';

export const metadata: Metadata = {
  title: 'Credential Pathways | Funded Career Training Programs',
  description:
    'Credential pathway programs in healthcare, skilled trades, technology, CDL, barbering, and business. Each pathway includes nationally recognized certifications. Training may be fully funded through WIOA and state workforce programs.',
  alternates: { canonical: '/programs' },
};

export default function ProgramCatalogPage() {
  const catalogData = ALL_PROGRAMS.map((p) => ({
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle,
    sector: p.sector,
    heroImage: p.heroImage,
    heroImageAlt: p.heroImageAlt,
    deliveryMode: p.deliveryMode,
    durationWeeks: p.durationWeeks,
    badge: p.badge ?? null,
    badgeColor: (p.badgeColor ?? null) as string | null,
    isSelfPay: p.isSelfPay ?? false,
    credentials: p.credentials.map((c) => c.name),
    entryJob: p.careerPathway?.[0]?.title ?? null,
    entrySalary: p.careerPathway?.[0]?.salaryRange ?? null,
  }));

  const totalCredentials = ALL_PROGRAMS.reduce((s, p) => s + p.credentials.length, 0);
  const totalSectors = new Set(ALL_PROGRAMS.map((p) => p.sector)).size;
  const totalPartners = new Set(ALL_PROGRAMS.flatMap((p) => p.employerPartners)).size;

  return (
    <div className="min-h-screen bg-white">
      <PageVideoHero
        videoSrc="/videos/program-hero.mp4"
        posterSrc="/images/pages/programs-hero.jpg"
        posterAlt="Workforce training programs — trades, healthcare, technology"
        size="primary"
      />

      {/* Page header */}
      <div className="bg-white border-b border-slate-200 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900 font-medium">Programs</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Credential Pathways</h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            Industry-recognized credentials. Competency-based training. Workforce-funded pathways to employment.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <section className="bg-slate-900 py-5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm text-white">
            <span><strong className="text-brand-blue-400">{ALL_PROGRAMS.length}</strong> Programs</span>
            <span><strong className="text-brand-blue-400">{totalCredentials}</strong> Industry Credentials</span>
            <span><strong className="text-brand-blue-400">{totalSectors}</strong> Sectors</span>
            <span><strong className="text-brand-blue-400">{totalPartners}</strong> Employer Partners</span>
            <span><strong className="text-brand-green-400">$0</strong> with WIOA Funding</span>
          </div>
        </div>
      </section>

      {/* Client-side filter + card grid */}
      <CatalogFilters
        programs={catalogData}
        sectors={SECTORS as unknown as { key: string; label: string; description: string }[]}
      />

      {/* CTA */}
      <section className="bg-slate-900 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white">Not Sure Which Program Is Right for You?</h2>
          <p className="text-slate-400 mt-2 max-w-xl mx-auto">
            Talk to an advisor. We help you match your goals, schedule, and funding eligibility to the right training pathway.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
            <Link href="/start" className="bg-white text-slate-900 px-8 py-3 rounded-lg font-semibold text-sm hover:bg-slate-100 transition-colors">
              Apply Now
            </Link>
            <Link href="/for/students" className="bg-slate-700 text-white px-8 py-3 rounded-lg font-semibold text-sm hover:bg-slate-600 transition-colors">
              Student Overview
            </Link>
            <Link href="/contact" className="border border-slate-500 text-white px-8 py-3 rounded-lg font-semibold text-sm hover:border-white transition-colors">
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>

      {/* Also available */}
      <section className="bg-white border-t py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Also Available</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/programs/micro-programs" className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-blue-300 hover:text-brand-blue-700 transition-colors">
              Micro Programs &amp; Short Certifications
            </Link>
            <Link href="/programs/federal-funded" className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-blue-300 hover:text-brand-blue-700 transition-colors">
              Federally Funded Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Institutional footer */}
      <section className="bg-slate-50 border-t py-8">
        <div className="max-w-6xl mx-auto px-4 text-xs text-slate-500 space-y-2">
          <p>Elevate for Humanity is an ETPL-listed training provider. Programs are eligible for WIOA, Next Level Jobs, and Workforce Ready Grant funding through Indiana DWD and local workforce boards.</p>
          <p>Salary data sourced from the U.S. Bureau of Labor Statistics, Occupational Outlook Handbook (2024). Actual earnings vary by employer, location, experience, and market conditions.</p>
          <p>Credential requirements and exam formats are set by the issuing organizations and may change. Verify current requirements with the issuing body before enrollment.</p>
        </div>
      </section>
    </div>
  );
}
