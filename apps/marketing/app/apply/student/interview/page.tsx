import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { resolveSlug } from '@/lib/program-registry';
import { ALL_PROGRAMS } from '@/lib/programs/static-registry';
import { getAdminClient } from '@/lib/supabase/admin';
import ParisApplicationWorkspace from './ParisApplicationWorkspace';
import ApplicationDocumentsPanel from './ApplicationDocumentsPanel';
import PaymentPlanCalculator from '@/components/programs/PaymentPlanCalculator';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'PARIS Guided Application,
  description:
    'Complete your Elevate career-training application with PARIS by text or voice, in English or Spanish, while your progress is saved.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/student',
  },
};

async function loadApplicationPrograms() {
  try {
    const db = await getAdminClient();
    if (!db) throw new Error('Supabase admin client unavailable');
    const { data, error } = await db
      .from('programs')
      .select('slug,title')
      .eq('is_active', true)
      .eq('published', true)
      .in('enrollment_state', ['open', 'waitlist'])
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('title', { ascending: true });
    if (error) throw error;
    if (data?.length) {
      return data
        .filter((program) => Boolean(program.slug && program.title))
        .map((program) => ({ slug: program.slug as string, title: program.title as string }));
    }
  } catch (error) {
    console.error(
      'paris.application.programs.load.failed',
      error instanceof Error ? error.message : String(error),
    );
  }

  // Recovery fallback only. Canonical application submission still resolves the
  // selected slug against public.programs before accepting the application.
  return ALL_PROGRAMS.map((program) => ({ slug: program.slug, title: program.title }));
}

export default async function ParisStudentApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; intent?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  const initialProgram = resolveSlug(params?.program || '') || '';
  const applicationIntent = params?.intent === 'enrollment' ? 'enrollment' : 'inquiry';
  const paymentSessionId = params?.session_id || '';
  const programs = await loadApplicationPrograms();

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
                Choose PARIS for a guided conversation or use the standard application form. With
                PARIS, turn on “Hear PARIS” to hear each question, answer through the microphone, or
                type directly into the message box. Switch between English and Spanish without losing
                your place.
              </p>
            </div>
            <Link
              href={`/apply/student/form?${new URLSearchParams({
                ...(initialProgram ? { program: initialProgram } : {}),
                intent: applicationIntent,
                ...(paymentSessionId ? { session_id: paymentSessionId } : {}),
              }).toString()}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:border-slate-400 hover:bg-slate-50"
            >
              Use standard form instead
            </Link>
          </div>

          <ParisApplicationWorkspace
            programs={programs}
            initialProgram={initialProgram}
            applicationIntent={applicationIntent}
            paymentSessionId={paymentSessionId}
          />

          {initialProgram && (
            <section className="mt-8" aria-labelledby="application-payment-options">
              <div className="mb-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-blue-700">
                  Self-pay options
                </p>
                <h2 id="application-payment-options" className="mt-2 text-2xl font-black text-slate-950">
                  Payment calculator, BNPL, and coupon code
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Applying is free. Use this calculator only if you plan to self-pay; workforce-funding eligibility is reviewed separately.
                </p>
              </div>
              <PaymentPlanCalculator
                programSlug={initialProgram}
                successUrl={`/apply/student/interview?program=${encodeURIComponent(initialProgram)}&intent=enrollment`}
              />
            </section>
          )}

          <ApplicationDocumentsPanel />

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
