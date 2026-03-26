import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { IDVerificationForm } from '@/components/verification/IDVerificationForm';
import { Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Verify Your Identity | Elevate for Humanity',
  description: 'Complete identity verification to access platform features',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/verify-identity',
  },
};

export default async function VerifyIdentityPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Check if user has uploaded ID documents (id_verifications has no user_id column)
  const { data: verification } = await supabase
    .from('documents')
    .select('id, status, created_at')
    .eq('user_id', user.id)
    .eq('document_type', 'photo_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (verification && (verification.status === 'approved' || verification.status === 'verified')) {
    return (
      <div className="min-h-screen bg-white">
        <section className="border-b py-8">
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl font-bold text-black mb-2">
              Identity Verification
            </h1>
            <p className="text-lg text-black">
              Your identity has been verified
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-brand-green-50 border-2 border-brand-green-600 rounded-lg p-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <h2 className="text-3xl font-bold text-brand-green-900">
                  Verification Complete!
                </h2>
                <p className="text-lg text-brand-green-700">
                  Your identity has been successfully verified.
                </p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white rounded-lg border border-brand-green-200">
              <p className="text-sm text-black">
                <strong>Verified on:</strong>{' '}
                {new Date(verification.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verification && (verification.status === 'pending' || verification.status === 'pending_review')) {
    return (
      <div className="min-h-screen bg-white">
        <section className="border-b py-8">
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl font-bold text-black mb-2">
              Identity Verification
            </h1>
            <p className="text-lg text-black">
              Your verification is being reviewed
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-yellow-50 border-2 border-yellow-600 rounded-lg p-8">
            <div className="flex items-center gap-4 mb-4">
              <Shield className="w-16 h-16 text-yellow-600" />
              <div>
                <h2 className="text-3xl font-bold text-yellow-900">
                  Verification Pending
                </h2>
                <p className="text-lg text-yellow-700">
                  We're reviewing your identity verification.
                </p>
              </div>
            </div>
            <p className="text-yellow-800 mb-4">
              Your verification is currently being reviewed by our team. This
              typically takes 1-2 business days. You'll receive an email
              notification once your verification is approved.
            </p>
            <div className="mt-6 p-4 bg-white rounded-lg border border-yellow-200">
              <p className="text-sm text-black">
                <strong>Submitted on:</strong>{' '}
                {new Date(verification.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verification && verification.status === 'rejected') {
    return (
      <div className="min-h-screen bg-white">
        <section className="border-b py-8">
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl font-bold text-black mb-2">
              Identity Verification
            </h1>
            <p className="text-lg text-black">
              Your verification was not approved
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-brand-red-50 border-2 border-brand-red-600 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-brand-red-900 mb-4">
              Verification Rejected
            </h2>
            <p className="text-brand-red-800 mb-4">
              Unfortunately, we were unable to verify your identity with the
              information provided.
            </p>
            <div className="p-4 bg-white rounded-lg border border-brand-red-200 mb-4">
              <p className="text-sm text-black">
                Please contact support at (317) 314-3757 for details on why your verification was not approved.
              </p>
            </div>
            <p className="text-brand-red-800">
              Please submit a new verification with updated information below.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-bold mb-4">Submit New Verification</h3>
            <IDVerificationForm />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <Shield className="w-16 h-16" />
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                Verify Your Identity
              </h1>
              <p className="text-xl text-brand-blue-100">
                Complete this one-time verification to access all platform
                features
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Why Verification */}
        <div className="bg-brand-blue-50 border-2 border-brand-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-brand-blue-900 mb-3">
            Why do we need this?
          </h2>
          <ul className="space-y-2 text-brand-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Comply with federal workforce development regulations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Protect your account and personal information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Enable access to training programs and certifications</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Verify eligibility for funded programs</span>
            </li>
          </ul>
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold mb-6">Complete Verification</h2>
          <IDVerificationForm />
        </div>
      </div>
    </div>
  );
}
