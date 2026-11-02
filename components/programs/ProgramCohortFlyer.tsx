import Image from 'next/image';
import Link from 'next/link';
import { getProgramHeroImage, getProgramImageAlt } from '@/lib/images/programImages';

const FEATURED_PROGRAMS = new Set([
  'hvac-technician', 'cdl-training', 'technology', 'it-help-desk',
  'business-administration', 'bookkeeping',
]);

interface ProgramCohortFlyerProps {
  programSlug: string;
  programTitle: string;
}

/** Readable page copy replaces dated promotional text embedded in tiny flyers. */
export default function ProgramCohortFlyer({ programSlug, programTitle }: ProgramCohortFlyerProps) {
  if (!FEATURED_PROGRAMS.has(programSlug)) return null;
  return (
    <section aria-label={`${programTitle} enrollment information`} className="bg-white px-4 py-6">
      <div className="mx-auto grid max-w-6xl items-center gap-4 sm:grid-cols-[160px_1fr]">
        <Image
          src={getProgramHeroImage(programSlug)}
          alt={getProgramImageAlt(programSlug, programTitle)}
          width={320}
          height={200}
          sizes="(max-width: 639px) 100vw, 160px"
          className="h-36 w-full rounded-xl object-cover sm:h-28 sm:w-40"
        />
        <div>
          <h2 className="text-lg font-bold text-slate-950">Explore {programTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Admissions will confirm the current start date, training schedule, and enrollment requirements.
          </p>
          <Link href={`/apply/student?program=${encodeURIComponent(programSlug)}`} className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-slate-950 underline">
            Start your application
          </Link>
        </div>
      </div>
    </section>
  );
}
