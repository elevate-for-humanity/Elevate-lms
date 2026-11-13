import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { INDIANAPOLIS_PROGRAM_HUBS } from '@/data/seo/indianapolis-program-hubs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Workforce Training Indianapolis | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Compare Indianapolis career training pathways, program requirements, costs, and verified funding options.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/workforce-training-indianapolis' },
};

export default function WorkforceTrainingIndianapolisPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative isolate overflow-hidden bg-slate-950 px-6 py-20 text-white">
        <Image src="/images/pages/workforce-training.webp" alt="Career training at Elevate for Humanity" fill priority sizes="100vw" className="-z-20 object-cover" />
        <div className="absolute inset-0 -z-10 bg-slate-950/80" />
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest">Indianapolis · Indiana</p>
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">Workforce Training in Indianapolis</h1>
          <p className="max-w-2xl text-lg text-slate-200">Compare career pathways and review the exact program requirements, tuition, delivery format, and enrollment steps before choosing your training.</p>
          <Link href="/programs" className="mt-8 inline-block rounded-lg bg-brand-red-600 px-6 py-3 font-bold">Browse All Programs</Link>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="mb-6 text-2xl font-bold">Explore training pathways</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {INDIANAPOLIS_PROGRAM_HUBS.map((hub) => (
            <Link key={hub.slug} href={`/${hub.slug}`} className="rounded-xl border border-slate-200 bg-white p-6 hover:border-brand-red-400">
              <h3 className="text-xl font-bold">{hub.breadcrumbLabel}</h3>
              <p className="mt-3 text-slate-600">Review program details and discuss current availability with admissions.</p>
              <span className="mt-4 inline-block font-semibold text-brand-red-700">View pathway →</span>
            </Link>
          ))}
        </div>
        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Confirm costs and eligibility</h2>
          <p className="mt-3 text-slate-600">Funding applies only to programs with verified program-level approval. Participant eligibility, available funds, and written authorization remain agency decisions. Apprenticeships are self-pay unless the exact program page documents another approved payment source. Training locations and start dates must be confirmed before enrollment.</p>
          <div className="mt-5 flex flex-wrap gap-6 font-semibold text-brand-red-700">
            <Link href="/funding">Review Funding Options</Link>
            <Link href="/contact">Contact Admissions</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
