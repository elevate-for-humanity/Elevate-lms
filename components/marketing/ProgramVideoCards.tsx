import Link from 'next/link';
import Image from 'next/image';
import { ALL_PROGRAMS } from '@/data/programs/catalog';
import type { ProgramSchema } from '@/lib/programs/program-schema';

const BADGE_COLORS: Record<string, string> = {
  red: 'bg-brand-red-600 text-white',
  green: 'bg-brand-green-600 text-white',
  blue: 'bg-blue-600 text-white',
  orange: 'bg-orange-500 text-white',
  purple: 'bg-purple-600 text-white',
};

function ProgramCard({ prog, priority }: { prog: ProgramSchema; priority?: boolean }) {
  const applyHref = prog.cta?.applyHref || `/apply?program=${prog.slug}`;
  const programHref = `/programs/${prog.slug}`;
  const badgeClass = BADGE_COLORS[prog.badgeColor ?? 'green'] ?? BADGE_COLORS.green;
  const salary = prog.laborMarket?.salaryRange ?? '';
  const duration = prog.durationWeeks
    ? prog.durationWeeks === 1 ? '1 week' : `${prog.durationWeeks} weeks`
    : '';

  return (
    <div className="group flex flex-col rounded-2xl overflow-hidden bg-slate-900 shadow-md hover:shadow-xl transition-shadow">
      {/* Image — aspect ratio keeps subjects visible at all viewport widths */}
      <div className="relative w-full aspect-[16/9] overflow-hidden flex-shrink-0">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image
          src={prog.heroImage}
          alt={prog.heroImageAlt || prog.title}
          fill
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          loading={priority ? undefined : 'lazy'} placeholder="empty"
        />
        {/* Category badge top-left */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm">
            {prog.category}
          </span>
        </div>
        {/* Credential badge top-right */}
        {prog.badge && (
          <div className="absolute top-3 right-3">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${badgeClass}`}>
              {prog.badge}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex-1">
          <h3 className="font-extrabold text-white text-sm leading-snug mb-1">{prog.title}</h3>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {duration && <p className="text-xs text-slate-400">{duration}</p>}
            {salary && <p className="text-xs font-bold text-brand-green-400">{salary}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={applyHref}
            className="flex-1 text-center py-2 rounded-xl bg-brand-red-600 hover:bg-brand-red-700 text-white text-xs font-bold transition-colors"
          >
            Apply Now
          </Link>
          <Link
            href={programHref}
            className="flex-1 text-center py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-900 text-xs font-semibold transition-colors"
          >
            Details →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ProgramVideoCards({ count = 8 }: { count?: number }) {
  const featuredPrograms = ALL_PROGRAMS.slice(0, count);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {featuredPrograms.map((prog, i) => (
        <ProgramCard key={prog.slug} prog={prog} priority={i < 4} />
      ))}
    </div>
  );
}
