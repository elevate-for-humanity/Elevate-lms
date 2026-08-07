import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowRight, Award, BriefcaseBusiness, Clock, DollarSign, ShieldCheck, Star } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  buildProgramsListingMetadata,
  getPublicProgramsPageData,
  type ProgramsPageRow,
} from '@/lib/programs/public-programs-page';
import { getProgramCardImage } from '@/lib/images/programImages';
import { WORKONE_INDY_INTAKE_URL } from '@/lib/programs/funding-registry';

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
          <Image
            src={image}
            alt={`${program.title} training program`}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                <Star className="h-4 w-4 fill-amber-400 text-amber-500" /> {program.top_jobs_stars}★ Top Jobs
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="p-5 sm:p-6">
        <h3 className="text-xl font-extrabold leading-tight text-slate-950">
          <Link href={`/programs/${program.slug}`} className="hover:text-brand-red-700">{program.title}</Link>
        </h3>
        {program.description ? <p className="mt-3 line-clamp-3 text-base leading-relaxed text-slate-600">{program.description}</p> : null}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-slate-600">
          {program.duration ? <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{program.duration}</span> : null}
          {program.credential ? <span className="inline-flex items-center gap-1.5"><Award className="h-4 w-4" />{program.credential}</span> : null}
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link href={`/programs/${program.slug}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-base font-bold text-white hover:bg-slate-800">
            View Program <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href={`/apply?program=${program.slug}`} className={`inline-flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-base font-bold ${funded ? 'bg-brand-red-600 text-white hover:bg-brand-red-700' : 'border border-slate-300 text-slate-900 hover:bg-slate-50'}`}>
            {funded ? 'Start Funded Application' : 'Self-Pay Enrollment'}
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function ProgramsPage() {
  const { programs } = await getPublicProgramsPageData();
  const funded = programs.filter((p) => p.funding_tier === 'workforce-funded');
  const selfPay = programs.filter((p) => p.funding_tier === 'self-pay');

  return (
    <main className="min-h-screen bg-white">
      <section className="relative min-h-[360px] overflow-hidden bg-slate-950">
        <Image src="/images/programs-hero-vibrant.webp" alt="Elevate career training programs" fill priority className="object-cover opacity-55" sizes="100vw" />
        <div className="absolute inset-0 bg-slate-950/45" />
        <div className="relative mx-auto flex min-h-[360px] max-w-6xl items-center px-6 py-16">
          <div className="max-w-3xl text-white">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-orange-300">Career Training</p>
            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">Choose the right program — and the right funding path.</h1>
            <p className="mt-5 text-lg leading-relaxed text-white sm:text-xl">
              {PLATFORM_DEFAULTS.orgName} separates verified workforce-funded programs from regular self-pay courses so applicants know exactly which enrollment process applies.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-emerald-200 bg-emerald-50 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-widest text-emerald-800">Verified Workforce-Funded Programs</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">ETPL + 3★ Top Jobs pathway</h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-700">
                These programs meet Elevate&apos;s strict public funding rule: verified under 2Exclusive LLC-S on Indiana ETPL and a final Top Jobs rating of 3 stars or higher. WorkOne determines participant eligibility and must authorize WIOA or Workforce Ready Grant funding.
              </p>
            </div>
            <a href={WORKONE_INDY_INTAKE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 text-base font-extrabold text-white hover:bg-emerald-800">
              Schedule WorkOne Intake <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {funded.map((program) => <ProgramCard key={program.slug} program={program} />)}
          </div>
          {funded.length === 0 ? <p className="mt-8 rounded-xl bg-white p-6 text-slate-700">No programs are currently published in the verified funded registry.</p> : null}
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-widest text-brand-red-700">Regular Courses</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Self-pay & payment-plan programs</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-700">
              Programs that are not verified in the ETPL + 3-star Top Jobs funded registry appear here as regular programs. They do not advertise WIOA or Workforce Ready Grant funding.
            </p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {selfPay.map((program) => <ProgramCard key={program.slug} program={program} />)}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-14 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <BriefcaseBusiness className="mx-auto h-9 w-9 text-orange-300" />
          <h2 className="mt-4 text-3xl font-black">Need help choosing?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-300">Start the application and choose a program. The form will automatically show either the required WorkOne funded pathway or the regular self-pay pathway.</p>
          <Link href="/apply" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-7 py-3.5 text-lg font-extrabold text-white hover:bg-brand-red-700">Start Application <ArrowRight className="h-5 w-5" /></Link>
        </div>
      </section>
    </main>
  );
}
