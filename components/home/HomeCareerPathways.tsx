/**
 * HomeCareerPathways
 *
 * Featured program cards - server-rendered from static catalog with
 * live data overlay (funding availability, apprenticeship flag).
 * Falls back gracefully if DB is unavailable.
 */

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { ALL_PROGRAMS } from '@/data/programs/catalog';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { loadVerifiedPublicStats } from '@/lib/site-stats-server';
import { IMAGE_SIZES } from '@/lib/images/media-dimensions';
import { card, grid, layout } from '@/lib/page-design-tokens';

// Featured programs shown on homepage - ordered by demand/visibility
const FEATURED_SLUGS = [
  'cdl-training',
  'hvac-technician',
  'cna',
  'barber-apprenticeship',
  'medical-assistant',
  'it-help-desk',
  'electrical',
  'welding',
];

const SECTOR_COLORS: Record<string, string> = {
  healthcare: 'bg-blue-600',
  'skilled-trades': 'bg-amber-700',
  transportation: 'bg-emerald-700',
  technology: 'bg-purple-600',
  'personal-services': 'bg-pink-600',
  business: 'bg-slate-600',
};

function PathwayCard({ prog, priority }: { prog: ProgramSchema; priority?: boolean }) {
  const sectorColor = SECTOR_COLORS[prog.sector] ?? 'bg-slate-600';
  const duration = prog.durationWeeks
    ? prog.durationWeeks === 1
      ? '1 week'
      : `${prog.durationWeeks} weeks`
    : null;
  const salary = prog.laborMarket?.salaryRange ?? null;
  const hasApprenticeship =
    prog.slug === 'barber-apprenticeship' ||
    prog.slug === 'cdl-training' ||
    prog.slug === 'hvac-technician' ||
    prog.slug === 'electrical' ||
    prog.slug === 'welding' ||
    prog.slug === 'culinary-apprenticeship';

  return (
    <article className="group flex flex-col rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-brand-red-300 hover:shadow-lg transition-all hover:-translate-y-0.5">
      {/* Image */}
      <div className={card.programImage}>
        <Image
          src={prog.heroImage}
          alt={prog.heroImageAlt || prog.title}
          fill
          className={card.programImageFill}
          sizes={IMAGE_SIZES.programCard}
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
          placeholder="empty"
        />
        {/* Sector badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white ${sectorColor}`}
          >
            {prog.category}
          </span>
        </div>
        {/* Funding badge */}
        {prog.badge && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-green-700 text-white">
              {prog.badge}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">{prog.title}</h3>

        {/* Meta row - text only, no icons */}
        <div className="flex flex-col gap-0.5">
          {duration && (
            <span className="text-[11px] text-slate-500">{duration}</span>
          )}
          {salary && (
            <span className="text-[11px] font-semibold text-brand-green-700">{salary}</span>
          )}
        </div>

        {/* Credential + apprenticeship flags - text only */}
        <div className="flex flex-wrap gap-1.5">
          {prog.credentials?.slice(0, 1).map((c) => (
            <span
              key={c.name}
              className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full truncate max-w-full"
            >
              {c.name}
            </span>
          ))}
          {hasApprenticeship && (
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Apprenticeship
            </span>
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2 mt-auto pt-2">
          {prog.paymentPlan && (
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter flex justify-between items-center px-1">
              <span>Payment Plan</span>
              <span className="text-brand-red-600">Starting at ${prog.paymentPlan.weeklyPayment}/week</span>
            </div>
          )}
          <div className="flex gap-2">
            <Link
              href={prog.cta?.applyHref || `/apply?program=${prog.slug}`}
              className="flex-1 text-center py-2.5 rounded-xl bg-brand-red-600 hover:bg-brand-red-700 text-white text-sm font-bold transition-colors"
            >
              Apply Free
            </Link>
            <Link
              href={`/programs/${prog.slug}`}
              className="flex-1 text-center py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export async function HomeCareerPathways() {
  const verified = await loadVerifiedPublicStats();
  const featured = FEATURED_SLUGS.map((slug) =>
    ALL_PROGRAMS.find((p) => p.slug === slug),
  ).filter((p): p is ProgramSchema => Boolean(p));

  return (
    <section
      className={`bg-white ${layout.sectionTight} px-4`}
      aria-labelledby="career-pathways-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">
            Career Pathways
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h2
                id="career-pathways-heading"
                className="text-2xl sm:text-3xl font-extrabold text-slate-900"
              >
                Pick a career. Start in weeks.
              </h2>
              <p className="text-slate-500 text-sm mt-2 max-w-lg">
                Healthcare, skilled trades, CDL, technology, and more - each with a real
                credential, funding options, and job placement support.
              </p>
            </div>
            <Link
              href="/programs"
              className="inline-flex items-center gap-1.5 text-brand-red-600 hover:text-brand-red-700 text-sm font-bold transition-colors shrink-0"
            >
              View all {verified.programsDisplay} programs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className={grid.homePrograms}>
          {featured.map((prog, index) => (
            <PathwayCard key={prog.slug} prog={prog} priority={index === 0} />
          ))}
        </div>

        {/* Sector quick-links */}
        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {[
            { label: 'Healthcare', href: '/programs?category=healthcare' },
            { label: 'Skilled Trades', href: '/programs?category=skilled-trades' },
            { label: 'Transportation', href: '/programs?category=transportation' },
            { label: 'Technology', href: '/programs?category=technology' },
            { label: 'Personal Services', href: '/programs?category=personal-services' },
            { label: 'Business', href: '/programs?category=business' },
          ].map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="text-xs font-semibold text-slate-600 hover:text-brand-red-600 bg-slate-100 hover:bg-brand-red-50 px-3 py-1.5 rounded-full transition-colors"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
