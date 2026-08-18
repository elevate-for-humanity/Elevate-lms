import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Clock,
  DollarSign,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  buildProgramsListingMetadata,
  getPublicProgramsPageData,
  type ProgramsPageRow,
} from '@/lib/programs/public-programs-page';
import { getProgramCardImage } from '@/lib/images/programImages';
import { WORKONE_INDY_INTAKE_URL } from '@/lib/programs/funding-registry';
import ProgramCardImage from './ProgramCardImage';

export const revalidate = 0;
export async function generateMetadata(): Promise<Metadata> {
  return buildProgramsListingMetadata();
}

function ProgramCard({ program }: { program: ProgramsPageRow }) {
  const funded = program.funding_tier === 'workforce-funded';
  const image = getProgramCardImage(program.slug);

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/programs/${program.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <ProgramCardImage
            src={image}
            alt={`${program.title} training program`}
            category={program.category}
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {funded ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3 py-1.5 text-sm font-extrabold text-white shadow">
                <ShieldCheck className="h-4 w-4" /> Workforce Funded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-sm font-extrabold text-white shadow">
                <DollarSign className="h-4 w-4" /> Self-Pay
              </span>
            )}
            {funded && program.top_jobs_stars ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-900 shadow">
                <Star className="h-4 w-4 fill-amber-400 text-amber-500" /> {program.top_jobs_stars}★
                Top Jobs
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="p-5 sm:p-6">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
          {program.category}
        </p>
        <h3 className="text-xl font-extrabold leading-tight text-slate-950">
          <Link href={`/programs/${program.slug}`} className="hover:text-brand-red-700">
            {program.title}
          </Link>
        </h3>
        {program.description ? (
          <p className="mt-3 line-clamp-3 text-base leading-relaxed text-slate-600">
            {program.description}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-slate-600">
          {program.duration ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {program.duration}
            </span>
          ) : null}
          {program.credential ? (
            <span className="inline-flex items-center gap-1.5">
              <Award className="h-4 w-4" />
              {program.credential}
            </span>
          ) : null}
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/programs/${program.slug}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-base font-bold text-white hover:bg-slate-800"
          >
            View Program <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/apply?program=${program.slug}`}
            className={`inline-flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-base font-bold ${funded ? 'bg-brand-red-600 text-white hover:bg-brand-red-700' : 'border border-slate-300 text-slate-900 hover:bg-slate-50'}`}
          >
            {funded ? 'Start Funded Application' : 'Self-Pay Enrollment'}
          </Link>
        </div>
      </div>
    </article>
  );
}

function groupPrograms(programs: ProgramsPageRow[]) {
  const groups = new Map<string, ProgramsPageRow[]>();
  for (const program of programs) {
    const existing = groups.get(program.category) ?? [];
    existing.push(program);
    groups.set(program.category, existing);
  }
  return [...groups.entries()];
}

function ProgramGroups({ programs }: { programs: ProgramsPageRow[] }) {
  return (
    <div className="mt-10 space-y-12">
      {groupPrograms(programs).map(([category, categoryPrograms]) => (
        <section key={category} aria-labelledby={`category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <h3
                id={`category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                className="text-2xl font-black text-slate-950"
              >
                {category}
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {categoryPrograms.length} {categoryPrograms.length === 1 ? 'program' : 'programs'}
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {categoryPrograms.map((program) => (
              <ProgramCard key={program.slug} program={program} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default async function ProgramsPage() {
  const { programs } = await getPublicProgramsPageData();
  const funded = programs.filter((p) => p.funding_tier === 'workforce-funded');
  const selfPay = programs.filter((p) => p.funding_tier === 'self-pay');

  return (
    <main className="min-h-screen bg-white">
      <section className="overflow-hidden bg-white">
        <div className="relative min-h-[360px] bg-slate-100">
          <Image
            src="/images/programs-hero-vibrant.webp"
            alt="Elevate career training programs"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-brand-red-700">
              Career Training
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">
              Choose the right program — and the right funding path.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-700 sm:text-xl">
              {PLATFORM_DEFAULTS.orgName} groups related programs by career pathway and separates
              verified workforce-funded programs from regular self-pay courses.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-emerald-200 bg-emerald-50 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-widest text-emerald-800">
                Verified Workforce-Funded Programs
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
                Approved pathways, organized by career category
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-700">
                These are the programs confirmed for workforce-funding consideration. WorkOne or the
                responsible agency determines participant eligibility, covered costs, and written
                authorization. Funding is not guaranteed.
              </p>
            </div>
            <a
              href={WORKONE_INDY_INTAKE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 text-base font-extrabold text-white hover:bg-emerald-800"
            >
              Schedule WorkOne Intake <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {funded.length > 0 ? (
            <ProgramGroups programs={funded} />
          ) : (
            <p className="mt-8 rounded-xl bg-white p-6 text-slate-700">
              No programs are currently published in the verified funded registry.
            </p>
          )}
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-widest text-brand-red-700">
              Regular Courses
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
              Self-pay & payment-plan programs by career pathway
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-700">
              Related course names are consolidated into one public pathway wherever they represent
              the same training program. Distinct occupational or industry-certification pathways
              remain separate and are grouped under the same category.
            </p>
          </div>
          <ProgramGroups programs={selfPay} />
        </div>
      </section>

      <section className="bg-slate-950 py-14 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <BriefcaseBusiness className="mx-auto h-9 w-9 text-orange-300" />
          <h2 className="mt-4 text-3xl font-black">Need help choosing?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-300">
            Start the application and choose a program. The form will automatically show either the
            required WorkOne funded pathway or the regular self-pay pathway.
          </p>
          <Link
            href="/apply"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-7 py-3.5 text-lg font-extrabold text-white hover:bg-brand-red-700"
          >
            Start Application <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
