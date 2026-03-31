import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertCircle } from 'lucide-react';
import MOUSignClient from './MOUSignClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign Your MOU | Elevate For Humanity',
  description: 'Review and sign your Program Holder Memorandum of Understanding.',
};

export default async function ProgramHolderMOUPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/program-holder/mou');

  const db = createAdminClient();

  const { data: profile } = await db
    .from('profiles')
    .select('full_name, program_holder_id')
    .eq('id', user.id)
    .single();

  if (!profile?.program_holder_id) redirect('/program-holder/onboarding');

  const { data: holder } = await db
    .from('program_holders')
    .select('organization_name, contact_name, mou_signed, mou_signed_at, mou_status')
    .eq('id', profile.program_holder_id)
    .single();

  if (!holder) redirect('/program-holder/onboarding');

  const orgName = holder.organization_name || profile.full_name || 'Your Organization';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <nav className="text-sm mb-6">
          <ol className="flex items-center gap-2 text-slate-500">
            <li><Link href="/program-holder/onboarding" className="hover:text-slate-700">Onboarding</Link></li>
            <li>/</li>
            <li className="text-slate-900 font-medium">Memorandum of Understanding</li>
          </ol>
        </nav>

        {holder.mou_signed ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-green-800 mb-1">MOU Already Signed</h2>
            <p className="text-green-700 text-sm mb-2">
              Signed on {holder.mou_signed_at ? new Date(holder.mou_signed_at).toLocaleDateString() : 'file'}
            </p>
            <Link href="/program-holder/dashboard" className="inline-block mt-4 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-sm">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Signature required before accessing your dashboard</p>
                <p className="text-xs text-amber-700 mt-0.5">Review the agreement below and sign to activate your program holder account.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-8 mb-2 text-slate-700 text-sm leading-relaxed">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Memorandum of Understanding</h2>
              <p className="text-xs text-slate-400 mb-6">Elevate for Humanity Career & Technical Institute · 8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240</p>

              <p className="mb-4">This Memorandum of Understanding ("MOU") is entered into between <strong>Elevate for Humanity Career & Technical Institute</strong> ("Elevate") and <strong>{orgName}</strong> ("Program Holder").</p>

              <h3 className="font-semibold text-slate-800 mt-5 mb-2">1. Purpose</h3>
              <p className="mb-4">The purpose of this MOU is to establish a partnership for the delivery of workforce training programs through Elevate's learning management platform.</p>

              <h3 className="font-semibold text-slate-800 mt-5 mb-2">2. Program Holder Responsibilities</h3>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li>Recruit and enroll eligible participants into approved program tracks</li>
                <li>Provide participant support services including case management</li>
                <li>Ensure all training meets Elevate's quality and compliance standards</li>
                <li>Track and report outcomes: enrollment, completion, credentials, placement</li>
                <li>Maintain accurate records for grant compliance and audit purposes</li>
              </ul>

              <h3 className="font-semibold text-slate-800 mt-5 mb-2">3. Elevate Responsibilities</h3>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li>Provide LMS platform access for training delivery and progress tracking</li>
                <li>Issue industry-recognized credentials upon program completion</li>
                <li>Provide reporting tools for grant compliance and outcome tracking</li>
                <li>Offer technical support and onboarding assistance</li>
              </ul>

              <h3 className="font-semibold text-slate-800 mt-5 mb-2">4. Compliance</h3>
              <p className="mb-4">Program Holder agrees to comply with all applicable federal, state, and local laws including WIOA requirements where applicable, and will not discriminate against any participant.</p>

              <h3 className="font-semibold text-slate-800 mt-5 mb-2">5. Term & Termination</h3>
              <p>This MOU is effective upon signing and remains in effect for one (1) year, renewable annually. Either party may terminate with 30 days written notice.</p>
            </div>

            <MOUSignClient holderName={orgName} />
          </>
        )}
      </div>
    </div>
  );
}
