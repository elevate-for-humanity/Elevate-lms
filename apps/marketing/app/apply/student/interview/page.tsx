import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { resolveSlug } from '@/lib/program-registry';
import { ALL_PROGRAMS } from '@/lib/programs/static-registry';
import ParisApplicationWorkspace from './ParisApplicationWorkspace';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'PARIS Guided Application | Elevate for Humanity',
  description:
    'Complete your Elevate career-training application with PARIS by text or voice, in English or Spanish, while your progress is saved.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/student',
  },
};

export default async function ParisStudentApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const params = await searchParams;
  const initialProgram = resolveSlug(params?.program || '') || '';
  const programs = ALL_PROGRAMS.map((program) => ({
    slug: program.slug,
    title: program.title,
  }));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Apply', href: '/apply' },
              { label: 'Student Application', href: '/apply/student' },
              { label: 'PARIS Interview' },
            ]}
          />
        </div>
      </div>

      <section className="px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700">
                Guided admissions workspace
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Talk with PARIS while your application builds beside you.
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-700 sm:text-base">
                Answer one relevant question at a time by typing or speaking. Switch between English
                and Spanish without losing your place. Important identity, program, funding, and
                transfer-hour answers require confirmation before they are treated as complete.
              </p>
            </div>
            <Link
              href={`/apply/student/form${initialProgram ? `?program=${encodeURIComponent(initialProgram)}` : ''}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:border-slate-400 hover:bg-slate-50"
            >
              Use standard form instead
            </Link>
          </div>

          <ParisApplicationWorkspace programs={programs} initialProgram={initialProgram} />

          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600">
            PARIS assists with intake and completeness. Workforce agencies determine workforce-funding
            eligibility, authorized staff review admissions decisions and documents, and claimed
            apprenticeship transfer hours require supporting evidence and sponsor verification before
            credit is granted.
          </div>
        </div>
      </section>
    </main>
  );
}
