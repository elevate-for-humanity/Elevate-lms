import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SecureIdentityVerificationForm } from '@/components/verification/SecureIdentityVerificationForm';
import { hasSSNOnFile } from '@/lib/security/secure-identity';

export const metadata: Metadata = {
  robots: { index: false },
  title: 'Verify Your Identity | Student Onboarding',
};

export const dynamic = 'force-dynamic';

export default async function VerifyIdentityPage() {
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) redirect('/login?redirect=/onboarding/learner/verify-identity');

  const supabase = await requireAdminClient();
  const [{ data: idDocs }, ssnOnFile] = await Promise.all([
    supabase
      .from('documents')
      .select('id, status, verification_status, created_at, metadata')
      .eq('user_id', user.id)
      .eq('document_type', 'photo_id')
      .order('created_at', { ascending: false }),
    hasSSNOnFile(user.id),
  ]);

  const documents = idDocs ?? [];
  const isVerified =
    ssnOnFile &&
    documents.some((doc) =>
      ['approved', 'verified'].includes(
        String(doc.verification_status || doc.status || '').toLowerCase(),
      ),
    );
  const isPending =
    ssnOnFile &&
    documents.some((doc) =>
      ['pending', 'pending_review', 'submitted', 'under_review'].includes(
        String(doc.verification_status || doc.status || '').toLowerCase(),
      ),
    );

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Onboarding', href: '/onboarding/learner' },
              { label: 'Verify Identity' },
            ]}
          />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/onboarding/learner"
          className="mb-6 inline-flex items-center gap-1 text-sm font-bold text-brand-blue-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Onboarding
        </Link>

        <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">
          Secure enrollment step
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Verify your identity</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
          Enrollment and workforce-funded training require identity verification. Complete your
          Social Security number verification and upload a clear government-issued photo ID plus a
          current selfie. These records are handled separately from the general application.
        </p>

        {isVerified ? (
          <div className="mt-8 rounded-xl border border-emerald-300 bg-emerald-50 p-6">
            <h2 className="text-xl font-black text-emerald-950">Identity verification complete</h2>
            <p className="mt-2 text-sm leading-6 text-emerald-900">
              Your secure SSN record and government ID verification are on file.
            </p>
            <Link
              href="/onboarding/learner"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-700 px-5 py-2.5 font-bold text-white hover:bg-emerald-800"
            >
              Continue onboarding
            </Link>
          </div>
        ) : isPending ? (
          <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-6">
            <h2 className="text-xl font-black text-amber-950">Identity review pending</h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Your SSN verification is on file and your government ID documents are waiting for
              authorized staff review. You can continue other onboarding steps while the review is
              pending.
            </p>
            <Link
              href="/onboarding/learner"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 py-2.5 font-bold text-white hover:bg-slate-800"
            >
              Continue onboarding
            </Link>
          </div>
        ) : (
          <div className="mt-8">
            <SecureIdentityVerificationForm />
          </div>
        )}
      </div>
    </div>
  );
}
