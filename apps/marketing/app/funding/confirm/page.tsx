import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, FileCheck2, ShieldCheck } from 'lucide-react';
import { logger } from '@/lib/logger';
import { normalizeError } from '@/lib/errors/normalize-error';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Request Funding Review',
  robots: { index: false, follow: false },
};

const ALLOWED_SOURCES = [
  'WIOA / WorkOne',
  'Workforce Ready Grant',
  'Employer / Host-Site Payment',
  'Other Third-Party Funding',
  'Self-Pay',
] as const;

async function requestFundingReview(formData: FormData) {
  'use server';
  const { createClient: createServerClient } = await import('@/lib/supabase/server');
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const requestedSource = String(formData.get('funding_source') || '');
  if (!ALLOWED_SOURCES.includes(requestedSource as (typeof ALLOWED_SOURCES)[number])) {
    redirect('/funding/confirm?error=invalid-source');
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      funding_source: requestedSource,
      funding_confirmed: false,
    })
    .eq('id', user.id);

  if (profileError) {
    logger.error('Funding request profile update failed', normalizeError(profileError, 'Funding request profile update failed'));
    redirect('/funding/confirm?error=save-failed');
  }

  if (requestedSource !== 'Self-Pay') {
    const { error: requestError } = await supabase.from('participant_funding_authorizations').insert({
      participant_id: user.id,
      funding_source: requestedSource,
      status: 'pending',
    });

    if (requestError) {
      logger.error('Funding authorization request failed', normalizeError(requestError, 'Funding authorization request failed'));
      redirect('/funding/confirm?error=request-failed');
    }
  }

  redirect('/onboarding/learner?funding=pending-review');
}

export default async function ConfirmFundingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto">
        <Breadcrumbs items={[{ label: 'Onboarding', href: '/onboarding/learner' }, { label: 'Funding Review' }]} />
        <Link href="/onboarding/learner" className="text-sm text-brand-blue-600 flex items-center gap-1 mt-4 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Onboarding
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Request Funding Review</h1>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Select the source you want reviewed. Your selection does not confirm eligibility, coverage,
          or an award. Third-party funding remains pending until authorized evidence is verified.
        </p>

        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-800 flex-none mt-0.5" />
          <p className="text-sm text-amber-950 leading-relaxed">
            Elevate will not mark your profile as funding-confirmed from this form. A current verified
            authorization record is required before the database permits that status.
          </p>
        </div>

        {errorParam && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            The funding review request could not be saved. Please try again or contact {PLATFORM_DEFAULTS.supportPhone}.
          </div>
        )}

        <form action={requestFundingReview} className="space-y-4">
          {ALLOWED_SOURCES.map((source) => (
            <label key={source} className="block bg-white rounded-xl border border-slate-200 p-5 cursor-pointer hover:border-brand-blue-300 transition-colors">
              <div className="flex items-start gap-3">
                <input type="radio" name="funding_source" value={source} required className="mt-1" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">{source}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    {source === 'Self-Pay'
                      ? 'Choose this when you intend to use the published self-pay pathway and enrollment agreement.'
                      : 'Request review only. The responsible source must verify participant and program eligibility and provide the applicable authorization.'}
                  </div>
                </div>
              </div>
            </label>
          ))}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-2">
            <FileCheck2 className="w-4 h-4 text-slate-700 flex-none mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              If a third party is expected to pay, keep the authorization letter, voucher, award,
              contract, or equivalent evidence that identifies the participant, program, approved
              amount, and terms. The authorization record must be verified by an authorized workflow.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="px-5 py-2.5 bg-brand-blue-600 text-white rounded-lg text-sm font-bold hover:bg-brand-blue-700">
              Save Funding Review Request
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
