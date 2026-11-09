import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { verifyPaidApplication } from '@/lib/enrollment/paid-application';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { resolveSlug } from '@/lib/program-registry';
import StudentApplicationForm from '../StudentApplicationForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Standard Student Application | Elevate for Humanity',
  description: 'Complete the standard Elevate student application form.',
  robots: { index: false, follow: true },
};

export default async function StandardStudentApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; intent?: string; payment?: string; billing_invoice_id?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  const initialProgram = resolveSlug(params?.program || '') || '';
  const applicationIntent = params?.intent === 'enrollment' ? 'enrollment' : 'inquiry';
  const paymentSessionId = params?.billing_invoice_id || '';
  if (applicationIntent === 'enrollment' &&
      (!initialProgram || !await verifyPaidApplication(initialProgram, paymentSessionId))) {
    const checkoutQuery = new URLSearchParams({ payment_plan: params?.payment === 'full' ? 'full' : 'installments' });
    redirect(initialProgram ? `/enroll/${encodeURIComponent(initialProgram)}?${checkoutQuery}` : '/apply');
  }
  const isHvacApplication = initialProgram === 'hvac-technician';

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
              <h1 className="mt-2 text-3xl font-black text-slate-950">{applicationIntent === 'enrollment' ? 'Full Enrollment Application' : 'Intake Application'}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                {isHvacApplication
                  ? 'Apply for HVAC training here. Complete your information and submit directly to our admissions team.'
                  : 'This is the conventional form version. It submits through the same canonical application service used by the PARIS-guided interview.'}
              </p>
            </div>
            {!isHvacApplication && <Link
              href={`/apply/student/interview?${new URLSearchParams({
                ...(initialProgram ? { program: initialProgram } : {}),
                intent: applicationIntent,
                ...(paymentSessionId ? { billing_invoice_id: paymentSessionId } : {}),
              }).toString()}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-red-700"
            >
              Use PARIS instead
            </Link>}
          </div>
          {applicationIntent === 'inquiry' && <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
            <h2 className="text-xl font-bold">Two application stages</h2>
            <p className="mt-2"><strong>1. Intake Application:</strong> request information and discuss program options. No payment, enrollment, dashboard activation, or Host Shop placement is completed by intake.</p>
            <p className="mt-2"><strong>2. Full Enrollment Application:</strong> pay the required deposit or tuition, complete the full application, and submit to activate your enrollment and dashboard. Required onboarding and placement still apply before training starts.</p>
            {initialProgram && <Link href={`/enroll/${encodeURIComponent(initialProgram)}`} className="mt-4 inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Start Full Enrollment Application</Link>}
          </div>}
          <StudentApplicationForm
            initialProgram={initialProgram}
            applicationIntent={applicationIntent}
            paymentSessionId={paymentSessionId}
          />
        </div>
      </div>
    </main>
  );
}
