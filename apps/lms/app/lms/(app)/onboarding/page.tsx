import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { generateInternalMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Learner Onboarding',
  description: 'Complete required learner onboarding steps.',
  path: '/lms/onboarding',
});
export const dynamic = 'force-dynamic';

export default async function LearnerOnboardingPage() {
  const { user } = await requireRole(['student', 'learner', 'admin']);
  const supabase = await createClient();
  const [onboardingRes, partnerRes] = await Promise.all([
    supabase.from('student_onboarding')
      .select('handbook_reviewed, milady_orientation_completed, ai_instructor_met, shop_placed')
      .eq('student_id', user.id).maybeSingle(),
    supabase.from('partner_lms_enrollments')
      .select('id, status, progress_percentage, external_account_id, external_enrollment_id, metadata')
      .eq('student_id', user.id).eq('status', 'active').order('created_at', { ascending: false }),
  ]);
  const row = onboardingRes.data;
  const steps = [
    { label: 'Review and acknowledge the Student Handbook', done: Boolean(row?.handbook_reviewed), href: 'https://www.elevateforhumanity.org/onboarding/learner/handbook' },
    { label: 'Complete learner orientation', done: Boolean(row?.milady_orientation_completed), href: 'https://www.elevateforhumanity.org/onboarding/learner/orientation' },
    { label: 'Meet your learner support assistant', done: Boolean(row?.ai_instructor_met), href: '/lms/support' },
    { label: 'Confirm training placement or provider access', done: Boolean(row?.shop_placed), href: '/lms/support' },
  ];
  const partners = partnerRes.data ?? [];

  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
    <div className="mx-auto max-w-4xl">
      <Link href="/lms/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue-800 hover:underline"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
      <h1 className="mt-5 text-3xl font-black text-slate-950">Learner Onboarding</h1>
      <p className="mt-2 font-medium text-slate-700">Complete each required step. Items remain incomplete until the corresponding record is verified.</p>
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="divide-y divide-slate-100">
          {steps.map((step) => <div key={step.label} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {step.done ? <CheckCircle className="h-6 w-6 text-green-700" /> : <Clock className="h-6 w-6 text-amber-700" />}
              <div><p className="font-black text-slate-950">{step.label}</p><p className="text-sm font-medium text-slate-600">{step.done ? 'Verified complete' : 'Required'}</p></div>
            </div>
            {!step.done && <Link href={step.href} className="inline-flex items-center gap-2 rounded-lg bg-brand-blue-700 px-4 py-2 text-sm font-black text-white hover:bg-brand-blue-800">Continue <ExternalLink className="h-4 w-4" /></Link>}
          </div>)}
        </div>
      </section>
      {partners.length > 0 && <section className="mt-6 rounded-2xl border border-blue-300 bg-blue-50 p-5">
        <h2 className="text-xl font-black text-blue-950">Linked external training</h2>
        {partners.map((item: any) => <div key={item.id} className="mt-3 rounded-xl bg-white p-4">
          <p className="font-black text-slate-950">{item.metadata?.credential ?? 'Approved partner training'}</p>
          <p className="mt-1 text-sm font-medium text-slate-700">Status: {item.status} · Progress: {Number(item.progress_percentage ?? 0)}%</p>
          <p className="mt-1 text-sm font-medium text-slate-700">Provider account: {item.external_account_id ?? 'Linked'}</p>
        </div>)}
      </section>}
      <Link href="/lms/documents" className="mt-6 inline-flex rounded-xl border border-slate-400 bg-white px-5 py-3 font-black text-slate-950 hover:bg-slate-100">Open required documents</Link>
    </div>
  </main>;
}
