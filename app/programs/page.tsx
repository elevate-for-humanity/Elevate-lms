export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Award, BookOpen, Clock, MapPin, ChevronRight } from 'lucide-react';
import { ALL_PROGRAMS, SECTORS } from '@/data/programs/catalog';
import type { ProgramSchema } from '@/lib/programs/program-schema';

export const metadata: Metadata = {
  title: 'Training Programs | Elevate for Humanity — Indianapolis',
  description: 'Healthcare, skilled trades, technology, CDL, barbering, and business programs. Nationally recognized credentials. Indianapolis, Indiana.',
  alternates: { canonical: '/programs' },
};

const SECTOR_IMAGES: Record<string, { img: string; video?: string }> = {
  'skilled-trades':    { img: '/images/pages/skilled-trades-sector.jpg',  video: '/videos/electrician-trades.mp4' },
  'healthcare':        { img: '/images/pages/healthcare-sector.jpg' },
  'personal-services': { img: '/images/pages/barber-hero-main.jpg',        video: '/videos/barber-training.mp4' },
  'technology':        { img: '/images/pages/technology-sector.jpg' },
  'business':          { img: '/images/pages/business-sector.jpg' },
};

export default function ProgramCatalogPage() {
  const totalCredentials = ALL_PROGRAMS.reduce((s, p) => s + p.credentials.length, 0);
  const totalSectors = new Set(ALL_PROGRAMS.map((p) => p.sector)).size;

  return (
    <div className="min-h-screen bg-white">

      {/* Video hero */}
      <section className="relative h-[320px] sm:h-[460px] overflow-hidden bg-slate-900">
        <video autoPlay muted loop playsInline poster="/images/pages/programs-hero-vibrant.jpg"
          className="absolute inset-0 w-full h-full object-cover opacity-70">
          <source src="/videos/programs-overview-video-with-narration.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
      </section>

      {/* Header */}
      <div className="bg-white border-b border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Indianapolis, Indiana</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-3">Find Your Program</h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-2xl leading-relaxed mb-6">
            {ALL_PROGRAMS.length} programs across {totalSectors} sectors. Every program ends with an industry-recognized credential — not just a certificate of attendance.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/apply/student" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors">
              Apply Now <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/funding" className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-5 py-3 rounded-lg transition-colors text-sm">
              Check Funding Eligibility
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-5 py-3 rounded-lg transition-colors text-sm">
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap gap-x-10 gap-y-2">
          {[
            { val: ALL_PROGRAMS.length, label: 'Programs' },
            { val: totalCredentials, label: 'Industry Credentials' },
            { val: totalSectors, label: 'Employment Sectors' },
            { val: 'ETPL', label: 'Indiana DWD Listed' },
            { val: 'WIOA', label: 'Funding Available' },
          ].map(({ val, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-brand-red-400 font-extrabold text-lg">{val}</span>
              <span className="text-slate-400 text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Programs by sector */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-14">
        {SECTORS.map((sector) => {
          const programs = ALL_PROGRAMS.filter((p) => p.sector === sector.key);
          const { img } = SECTOR_IMAGES[sector.key] ?? { img: '/images/pages/programs-page-hero.jpg' };
          return (
            <div key={sector.key}>
              {/* Sector banner */}
              <div className="relative h-32 rounded-2xl overflow-hidden mb-6">
                <Image src={img} alt={sector.label} fill sizes="100vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 to-slate-900/20" />
                <div className="absolute inset-0 flex items-center px-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-white">{sector.label}</h2>
                    <p className="text-white/70 text-sm mt-0.5">{sector.description}</p>
                  </div>
                  <span className="ml-auto text-white/50 text-sm font-medium flex-shrink-0">
                    {programs.length} {programs.length === 1 ? 'program' : 'programs'}
                  </span>
                </div>
              </div>

              {programs.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500 text-sm">
                  Programs in development. <Link href="/contact" className="text-brand-red-600 underline">Contact us</Link> to express interest.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {programs.map((p) => <ProgramCard key={p.slug} program={p} />)}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Not sure CTA — photo split */}
      <section className="bg-slate-50 border-t border-slate-100 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <Image src="/images/pages/career-counseling-page-1.jpg" alt="Career advisor meeting" fill sizes="600px" className="object-cover" />
            </div>
            <div>
              <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Not Sure Where to Start?</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Talk to an Advisor</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                We match your goals, schedule, and funding eligibility to the right program. No pressure — just a conversation about where you want to go.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/apply/student" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm">
                  Apply Now <ChevronRight className="w-4 h-4" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-5 py-3 rounded-lg transition-colors text-sm">
                  Talk to an Advisor
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclosure */}
      <section className="bg-white border-t py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400 leading-relaxed">
            Workforce funding through WIOA, Next Level Jobs, and Workforce Ready Grant is available for eligible Indiana residents. Eligibility is not guaranteed — you must qualify through WorkOne. Salary data sourced from BLS Occupational Outlook Handbook (2024).
          </p>
        </div>
      </section>
    </div>
  );
}

function ProgramCard({ program: p }: { program: ProgramSchema }) {
  return (
    <Link href={`/programs/${p.slug}`}
      className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-brand-red-300 transition-all">
      <div className="relative h-48 flex-shrink-0 overflow-hidden">
        <Image src={p.heroImage} alt={p.heroImageAlt} fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          {p.badge && (
            <span className={`inline-block text-[10px] font-bold text-white px-2 py-0.5 rounded-full mb-1 ${
              p.badgeColor === 'orange' ? 'bg-brand-orange-500' :
              p.badgeColor === 'green'  ? 'bg-brand-green-600' : 'bg-brand-blue-600'
            }`}>{p.badge}</span>
          )}
          <h3 className="font-extrabold text-white text-base leading-tight">{p.title}</h3>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-sm text-slate-500 line-clamp-2 flex-1">{p.subtitle}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-slate-100">
          <Fact icon={Clock}    label={`${p.durationWeeks} weeks`} />
          <Fact icon={BookOpen} label={`${p.hoursPerWeekMin}–${p.hoursPerWeekMax} hrs/wk`} />
          <Fact icon={MapPin}   label={p.deliveryMode === 'hybrid' ? 'Hybrid' : p.deliveryMode === 'online' ? 'Online' : 'In-Person'} />
          <Fact icon={Award}    label={`${p.credentials.length} credential${p.credentials.length !== 1 ? 's' : ''}`} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.credentials.slice(0, 2).map((c, i) => (
            <span key={i} className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{c.name}</span>
          ))}
          {p.credentials.length > 2 && <span className="text-[10px] text-slate-400">+{p.credentials.length - 2} more</span>}
        </div>
        <span className="mt-3 text-xs font-bold text-brand-red-600 group-hover:underline flex items-center gap-1">
          View Program <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}

function Fact({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-600">
      <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />{label}
    </div>
  );
}
