import Link from 'next/link';
import Image from 'next/image';
import type { Program } from '@/lib/programs/programs.data';

/**
 * Standard program card — system-locked structure.
 * Top image (16:9, flush) → program name → short description → metadata chips → CTA.
 * Do not add icons, checkmarks, or colored badges here.
 */
export default function ProgramCard({ program }: { program: Program }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
      {/* Flush top image — 16:9 */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={program.cardImage || program.heroImage || '/images/pages/training-cohort.jpg'}
          alt={program.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover"
        />
      </div>

      {/* Card body */}
      <div className="p-4 sm:p-5">
        <h3 className="text-base font-bold text-slate-900 leading-snug mb-1">{program.title}</h3>
        {program.tagline && (
          <p className="text-slate-600 text-sm leading-relaxed mb-3">{program.tagline}</p>
        )}

        {/* Metadata chips */}
        {(program.duration || program.format || program.level) && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {program.duration && (
              <span className="inline-flex items-center bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                {program.duration}
              </span>
            )}
            {program.format && (
              <span className="inline-flex items-center bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                {program.format}
              </span>
            )}
            {program.level && (
              <span className="inline-flex items-center bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                {program.level}
              </span>
            )}
          </div>
        )}

        <Link
          href={`/programs/${program.slug}`}
          className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          View Program
        </Link>
      </div>
    </div>
  );
}
