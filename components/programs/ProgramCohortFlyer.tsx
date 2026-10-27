import Image from 'next/image';
import Link from 'next/link';

const FLYERS: Record<string, string> = {
  'hvac-technician': '/images/cohorts/hvac-october-15-cohort-flyer.jpg',
  'cdl-training': '/images/cohorts/cdl-october-15-cohort-flyer.jpg',
  technology: '/images/cohorts/it-october-15-cohort-flyer.jpg',
  'it-help-desk': '/images/cohorts/it-october-15-cohort-flyer.jpg',
  'business-administration': '/images/cohorts/business-october-15-cohort-flyer.jpg',
  bookkeeping: '/images/cohorts/bookkeeping-october-15-cohort-flyer.jpg',
};

interface ProgramCohortFlyerProps {
  programSlug: string;
  programTitle: string;
}

export default function ProgramCohortFlyer({
  programSlug,
  programTitle,
}: ProgramCohortFlyerProps) {
  const flyerSrc = FLYERS[programSlug];

  if (!flyerSrc) return null;

  return (
    <section
      aria-label={`${programTitle} enrollment announcement`}
      className="border-y border-slate-200 bg-slate-50"
    >
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href="/apply"
          aria-label={`Apply for the ${programTitle} October 15, 2026 cohort`}
          className="block overflow-hidden rounded-2xl bg-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue-600"
        >
          <Image
            src={flyerSrc}
            alt={`${programTitle} applications open. Next cohort starts October 15, 2026. New cohorts start the 15th of every month.`}
            width={1600}
            height={900}
            sizes="(max-width: 768px) 100vw, 1152px"
            className="h-auto w-full object-contain"
          />
        </Link>
      </div>
    </section>
  );
}
