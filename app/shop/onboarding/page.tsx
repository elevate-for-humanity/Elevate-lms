
import { Metadata } from 'next';
import { generateInternalMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Shop Onboarding',
  description: 'Internal page for Shop Onboarding',
  path: '/shop/onboarding',
});

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Clock, Upload, FileText } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';


export default async function ShopOnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/shop/onboarding');
  }

  // Get shop for this user
  const { data: staff } = await supabase
    .from('shop_staff')
    .select('shop_id, shops(*)')
    .eq('user_id', user.id);

  const shop = staff?.[0]?.shops;

  if (!shop) {
    redirect('/shop/dashboard');
  }

  // Get onboarding status
  const { data: onboarding } = await supabase
    .from('shop_onboarding')
    .select('*')
    .eq('shop_id', shop.id)
    .single();

  // Get required documents status
  const { data: docsStatus } = await supabase
    .from('shop_required_docs_status')
    .select('*')
    .eq('shop_id', shop.id)
    .eq('required', true)
    .order('document_type');

  const requiredDocs = docsStatus || [];
  const approvedDocs = requiredDocs.filter((d) => d.approved);
  const pendingDocs = requiredDocs.filter((d) => !d.approved);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }, { label: 'Onboarding' }]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-3xl font-bold text-black">
            Shop Partner Onboarding
          </h1>
          <p className="mt-2 text-black">
            Complete all steps to begin hosting apprentices
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Progress Overview */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">
              Onboarding Progress
            </h2>
            <div className="text-right">
              <div className="text-3xl font-bold text-brand-blue-600">
                {approvedDocs.length}/{requiredDocs.length}
              </div>
              <div className="text-xs text-black">Documents Approved</div>
            </div>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-white h-3 rounded-full transition-all"
              style={{
                width: `${
                  requiredDocs.length > 0
                    ? (approvedDocs.length / requiredDocs.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Required Documents */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-brand-blue-600" />
            <h2 className="text-xl font-bold text-black">
              Required Documents
            </h2>
          </div>

          <div className="space-y-4">
            {requiredDocs.map((doc) => (
              <div
                key={doc.document_type}
                className="border border-slate-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {doc.approved ? (
                      <span className="text-slate-500 flex-shrink-0">•</span>
                    ) : (
                      <Clock className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div
                        className={`font-semibold ${
                          doc.approved ? 'text-black' : 'text-black'
                        }`}
                      >
                        {doc.display_name}
                      </div>
                      {doc.description && (
                        <div className="text-sm text-black mt-1">
                          {doc.description}
                        </div>
                      )}
                      {doc.approved && doc.approved_at && (
                        <div className="text-xs text-brand-green-600 mt-2">
                          • Approved on{' '}
                          {new Date(doc.approved_at).toLocaleDateString()}
                        </div>
                      )}
                      {!doc.approved && doc.uploaded_at && (
                        <div className="text-xs text-brand-orange-600 mt-2">
                          ⏳ Uploaded, pending sponsor approval
                        </div>
                      )}
                      {!doc.approved && !doc.uploaded_at && (
                        <div className="text-xs text-slate-500 mt-2">
                          Not yet uploaded
                        </div>
                      )}
                    </div>
                  </div>
                  {!doc.approved && (
                    <Link
                      href="/shop/onboarding/documents"
                      className="px-4 py-2 bg-brand-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-2 whitespace-nowrap"
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pendingDocs.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <Link
                href="/shop/onboarding/documents"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition"
              >
                <Upload className="w-5 h-5" />
                Upload Documents
              </Link>
            </div>
          )}
        </div>

        {/* Onboarding Checklist */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-black mb-4">
            Onboarding Checklist
          </h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {onboarding?.handbook_ack ? (
                <span className="text-slate-500 flex-shrink-0">•</span>
              ) : (
                <Clock className="w-5 h-5 text-slate-400" />
              )}
              <span
                className={
                  onboarding?.handbook_ack
                    ? 'text-black font-medium'
                    : 'text-black'
                }
              >
                Acknowledge sponsor handbook + expectations
              </span>
            </div>

            <div className="flex items-center gap-3">
              {onboarding?.reporting_trained ? (
                <span className="text-slate-500 flex-shrink-0">•</span>
              ) : (
                <Clock className="w-5 h-5 text-slate-400" />
              )}
              <span
                className={
                  onboarding?.reporting_trained
                    ? 'text-black font-medium'
                    : 'text-black'
                }
              >
                Complete reporting training
              </span>
            </div>

            <div className="flex items-center gap-3">
              {onboarding?.apprentice_supervisor_assigned ? (
                <span className="text-slate-500 flex-shrink-0">•</span>
              ) : (
                <Clock className="w-5 h-5 text-slate-400" />
              )}
              <span
                className={
                  onboarding?.apprentice_supervisor_assigned
                    ? 'text-black font-medium'
                    : 'text-black'
                }
              >
                Assign apprentice supervisor
              </span>
            </div>

            <div className="flex items-center gap-3">
              {onboarding?.rapids_reporting_ready ? (
                <span className="text-slate-500 flex-shrink-0">•</span>
              ) : (
                <Clock className="w-5 h-5 text-slate-400" />
              )}
              <span
                className={
                  onboarding?.rapids_reporting_ready
                    ? 'text-black font-medium'
                    : 'text-black'
                }
              >
                RAPIDS reporting readiness
              </span>
            </div>
          </div>
        </div>

        {/* Sponsor of Record */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-brand-blue-900 mb-3">
            Sponsor of Record
          </h3>
          <p className="text-sm text-brand-blue-900 mb-2">
            Elevate for Humanity Career &amp; Technical Institute is a DBA of 2Exclusive LLC-S, the USDOL Registered Apprenticeship Sponsor of Record.
          </p>
          <p className="text-sm text-brand-blue-800">
            Partner training sites provide supervised practical training and validate training hours. Partners do not set wages, provide payroll services, or guarantee employment.
          </p>
        </div>

        {/* Partner Training Responsibilities */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-black mb-3">
            Partner Training Responsibilities
          </h3>
          <ul className="space-y-2 text-sm text-black">
            <li className="flex items-start gap-2">
              <span className="text-brand-blue-600 mt-0.5">•</span>
              <span>Maintain active establishment license(s)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-blue-600 mt-0.5">•</span>
              <span>Provide supervised practical training</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-blue-600 mt-0.5">•</span>
              <span>Validate training hours and attendance</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-blue-600 mt-0.5">•</span>
              <span>Sign off on skill progression milestones</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-blue-600 mt-0.5">•</span>
              <span>Comply with program schedule and documentation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-blue-600 mt-0.5">•</span>
              <span>Maintain appropriate business insurance</span>
            </li>
          </ul>
        </div>

        {/* What Partners Do NOT Provide */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-amber-900 mb-3">
            What Partners Do NOT Provide
          </h3>
          <ul className="space-y-2 text-sm text-amber-900">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">•</span>
              <span>No wage guarantees or employment promises</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">•</span>
              <span>No payroll administration through Elevate</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">•</span>
              <span>No overtime calculation or pay advice</span>
            </li>
          </ul>
          <p className="text-xs text-amber-700 mt-3">
            Employment classification and compensation are external matters governed by employer policies and labor law, not Elevate.
          </p>
        </div>

        {/* Hour Tracking Clarification */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-black mb-3">
            Hour Tracking Clarification
          </h3>
          <p className="text-sm text-black">
            Elevate tracks <strong>training hours only</strong> for program completion and compliance reporting. 
            Any employment relationship, compensation, or overtime rules are governed by the employer and applicable labor law, not Elevate.
          </p>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center">
          <Link
            href="/shop/dashboard"
            className="text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
