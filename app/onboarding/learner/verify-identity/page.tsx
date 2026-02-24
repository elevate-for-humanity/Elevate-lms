import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { IDVerificationForm } from '@/components/verification/IDVerificationForm';

export const metadata: Metadata = {
  title: 'Verify Your Identity | Student Onboarding',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function VerifyIdentityPage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/onboarding/learner/verify-identity');

  // Check identity via documents table (id_verifications has no user_id column)
  const { data: idDoc } = await db
    .from('documents')
    .select('id, status, created_at')
    .eq('user_id', user.id)
    .eq('document_type', 'photo_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const isVerified = idDoc?.status === 'approved' || idDoc?.status === 'verified';
  const isPending = !!idDoc && !isVerified;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Onboarding', href: '/onboarding/learner' },
            { label: 'Verify Identity' },
          ]} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/onboarding/learner" className="text-sm text-brand-blue-600 flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Onboarding
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Identity</h1>
        <p className="text-gray-600 mb-6">
          Federal and state workforce regulations require identity verification for all enrolled students.
          Upload a clear photo of your government-issued ID (front and back) and a selfie.
        </p>

        {isVerified ? (
          <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-brand-green-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-brand-green-900 mb-2">Identity Verified</h2>
            <p className="text-brand-green-700 mb-4">Your identity has been verified. You can proceed to the next onboarding step.</p>
            <Link href="/onboarding/learner" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-green-600 text-white rounded-lg font-medium hover:bg-brand-green-700">
              Continue Onboarding <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        ) : isPending ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-amber-600 text-xl font-bold">!</span>
            </div>
            <h2 className="text-xl font-bold text-amber-900 mb-2">Verification Pending</h2>
            <p className="text-amber-700 mb-4">
              Your identity documents have been submitted and are under review. This typically takes 1–2 business days.
              You can continue with other onboarding steps while you wait.
            </p>
            <Link href="/onboarding/learner" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700">
              Continue Onboarding <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-brand-blue-900 mb-2">What you need:</h3>
              <ul className="text-sm text-brand-blue-800 space-y-1">
                <li>• Government-issued photo ID (driver&apos;s license, state ID, or passport)</li>
                <li>• Clear photo of the front of your ID</li>
                <li>• Clear photo of the back of your ID</li>
                <li>• A selfie (face clearly visible, matching your ID photo)</li>
              </ul>
            </div>
            <IDVerificationForm />
          </>
        )}
      </div>
    </div>
  );
}
