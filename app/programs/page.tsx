export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Award, BookOpen, Clock, MapPin, ChevronRight, GraduationCap } from 'lucide-react';
import { ALL_PROGRAMS, SECTORS } from '@/data/programs/catalog';
import { getTotalHoursRange } from '@/lib/programs/program-schema';
import type { ProgramSchema } from '@/lib/programs/program-schema';

export const metadata: Metadata = {
  title: 'Training Programs | Elevate for Humanity',
  description: 'Workforce training programs in skilled trades, healthcare, and personal services. WIOA and Next Level Jobs funding available. Indianapolis, Indiana.',
};

export default function ProgramCatalogPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative h-[240px] sm:h-[300px]">
        <Image
          src="/images/heroes-hq/programs-hero.jpg"
          alt="Students in a workforce training classroom"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-6xl mx-auto px-4 pb-8 w-full">
            <nav className="flex items-center gap-1.5 text-xs text-white/70 mb-3">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white font-medium">Programs</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Training Programs</h1>
            <p className="text-white/80 mt-2 max-w-2xl">
              Industry-recognized credentials. Competency-based training. Workforce-funded pathways to employment.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-slate-900 py-4">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm text-white">
          <span><strong className="text-brand-blue-400">{ALL_PROGRAMS.length}</strong> Programs</span>
          <span><strong className="text-brand-blue-400">{ALL_PROGRAMS.reduce((sum, p) => sum + p.credentials.length, 0)}</strong> Credentials</span>
          <span><strong className="text-brand-blue-400">{new Set(ALL_PROGRAMS.map((p) => p.sector)).size}</strong> Industry Sectors</span>
          <span><strong className="text-brand-green-400">$0</strong> with WIOA Funding</span>
        </div>
      </section>

      {/* Programs by Sector */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        {SECTORS.map((sector) => {
          const programs = ALL_PROGRAMS.filter((p) => p.sector === sector.key);
          if (programs.length === 0) return (
            <div key={sector.key} className="mb-12">
              <SectorHeader label={sector.label} description={sector.description} count={0} />
              <div className="mt-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg p-8 text-center text-slate-500">
                New programs in this sector are in development. <a href="/contact" className="text-brand-blue-600 underline">Contact us</a> to express interest.
              </div>
            </div>
          );

          return (
            <div key={sector.key} className="mb-12">
              <SectorHeader label={sector.label} description={sector.description} count={programs.length} />
              <div className="mt-6 grid sm:grid-cols-2 gap-6">
                {programs.map((p) => (
                  <ProgramCard key={p.slug} program={p} />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Institutional CTA */}
      <section className="bg-slate-900 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white">Not Sure Which Program Is Right for You?</h2>
          <p className="text-slate-400 mt-2 max-w-xl mx-auto">
            Talk to an advisor. We help you match your goals, schedule, and funding eligibility to the right training pathway.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
            <Link
              href="/apply"
              className="bg-white text-slate-900 px-8 py-3 rounded-lg font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              Apply Now
            </Link>
            <Link
              href="/contact"
              className="border border-slate-500 text-white px-8 py-3 rounded-lg font-semibold text-sm hover:border-white transition-colors"
            >
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>

      {/* Institutional Footer */}
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

function SectorHeader({ label, description, count }: { label: string; description: string; count: number }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-brand-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
        <GraduationCap className="w-6 h-6 text-brand-blue-600" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          {label}
          <span className="text-sm font-normal text-slate-500 ml-2">({count} {count === 1 ? 'program' : 'programs'})</span>
        </h2>
        <p className="text-sm text-slate-600 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function ProgramCard({ program: p }: { program: ProgramSchema }) {
  return (
    <Link
      href={`/programs/${p.slug}`}
      className="group block bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-brand-blue-300 hover:shadow-md transition-all"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <Image
          src={p.heroImage}
          alt={p.heroImageAlt}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
        {p.badge && (
          <span className={`absolute top-3 right-3 text-xs font-bold text-white px-2.5 py-1 rounded-full ${
            p.badgeColor === 'orange' ? 'bg-brand-orange-500' :
            p.badgeColor === 'green' ? 'bg-brand-green-600' :
            p.badgeColor === 'blue' ? 'bg-brand-blue-600' :
            'bg-brand-blue-600'
          }`}>
            {p.badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-lg text-slate-900 group-hover:text-brand-blue-600 transition-colors">{p.title}</h3>
        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{p.subtitle}</p>

        {/* 4 Facts */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Fact icon={Clock} label={`${p.durationWeeks} weeks`} />
          <Fact icon={BookOpen} label={`${p.hoursPerWeekMin}–${p.hoursPerWeekMax} hrs/wk`} />
          <Fact icon={MapPin} label={p.deliveryMode === 'hybrid' ? 'Hybrid' : p.deliveryMode === 'online' ? 'Online' : 'In-Person'} />
          <Fact icon={Award} label={`${p.credentials.length} credentials`} />
        </div>

        {/* Credentials Preview */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.credentials.slice(0, 3).map((c, i) => (
            <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{c.name}</span>
          ))}
          {p.credentials.length > 3 && (
            <span className="text-xs text-slate-500">+{p.credentials.length - 3} more</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function Fact({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-600">
      <Icon className="w-3.5 h-3.5 text-slate-400" />
      {label}
    </div>
  );
}
