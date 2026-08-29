import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { resolveSlug } from '@/lib/program-registry';
import StudentApplicationForm from '../StudentApplicationForm';
import PaymentPlanCalculator from '@/components/programs/PaymentPlanCalculator';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Standard Student Application,
  description: 'Complete the standard Elevate student application form.',
  robots: { index: false, follow: true },
};

export default async function StandardStudentApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; intent?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  const initialProgram = resolveSlug(params?.program || '') || '';
  const applicationIntent = params?.intent === 'enrollment' ? 'enrollment' : 'inquiry';
  const paymentSessionId = params?.session_id || '';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <Breadcrumbs
          items={[
            { label: 'Apply', href: '/apply' },
            { label: 'Student Application', href: '/apply/student' },
            { label: 'Standard Form' },
          ]}
        />
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-brand-red-700">
                Standard form
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">Student application</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                This is the conventional form version. It submits through the same canonical
                application service used by the PARIS-guided interview.
              </p>
            </div>
            <Link
              href={`/apply/student/interview?${new URLSearchParams({
                ...(initialProgram ? { program: initialProgram } : {}),
                intent: applicationIntent,
                ...(paymentSessionId ? { session_id: paymentSessionId } : {}),
              }).toString()}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-red-700"
            >
              Use PARIS instead
            </Link>
          </div>
          <StudentApplicationForm
            initialProgram={initialProgram}
            applicationIntent={applicationIntent}
            paymentSessionId={paymentSessionId}
          />
        </div>
        {applicationIntent === 'enrollment' && initialProgram ? (
          <section className="mt-8" aria-labelledby="standard-application-payment">
            <h2 id="standard-application-payment" className="mb-4 text-2xl font-black text-slate-950">
              Required payment verification
            </h2>
            <PaymentPlanCalculator
              programSlug={initialProgram}
              successUrl={`/apply/student/form?program=${encodeURIComponent(initialProgram)}&intent=enrollment`}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}
