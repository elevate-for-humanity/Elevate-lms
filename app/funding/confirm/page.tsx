import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DollarSign, CheckCircle2, ArrowLeft, FileText, ExternalLink } from 'lucide-react';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Confirm Funding | Elevate for Humanity',
  robots: { index: false, follow: false },
};

async function confirmFunding(formData: FormData) {
  'use server';
  const { createClient: createServerClient } = await import('@/lib/supabase/server');
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const fundingSource = formData.get('funding_source') as string;

  const { error } = await supabase.from('profiles').update({
    funding_source: fundingSource || 'pending',
    funding_confirmed: true,
  }).eq('id', user.id);

  if (error) {
    logger.error('Funding confirm failed:', error.message);
    throw new Error('Failed to confirm funding');
  }

  redirect('/onboarding/learner');
}

export default async function ConfirmFundingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const fundingOptions = [
    { name: 'WIOA (Workforce Innovation and Opportunity Act)', desc: 'Covers tuition, materials, exam fees, and supportive services for eligible participants. Contact your local WorkOne office.', eligible: 'Adults, dislocated workers, youth 16-24' },
    { name: 'Next Level Jobs — Workforce Ready Grant', desc: 'Indiana state funding for high-demand certification programs. Covers full training costs.', eligible: 'Indiana residents in approved programs' },
    { name: 'Employer Sponsorship', desc: 'Your employer pays training costs, often with OJT wage reimbursement (50-75% of wages during training).', eligible: 'Employed individuals with employer agreement' },
    { name: 'Self-Pay', desc: 'Pay tuition directly. Payment plans available. $2,700 per program.', eligible: 'All applicants' },
  ];

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto">
        <Breadcrumbs items={[{ label: 'Onboarding', href: '/onboarding/learner' }, { label: 'Confirm Funding' }]} />
        <Link href="/onboarding/learner" className="text-sm text-brand-blue-600 flex items-center gap-1 mt-4 mb-4"><ArrowLeft className="w-4 h-4" /> Back to Onboarding</Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Confirm Your Funding</h1>
        <p className="text-sm text-black mb-6">Select your funding source. Most students qualify for $0 out-of-pocket through workforce funding.</p>

        <form action={confirmFunding} className="space-y-4">
          {fundingOptions.map((f, i) => (
            <label key={i} className="block bg-white rounded-xl border border-slate-200 p-5 cursor-pointer hover:border-brand-blue-300 transition-colors">
              <div className="flex items-start gap-3">
                <input type="radio" name="funding_source" value={f.name} required className="mt-1" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">{f.name}</div>
                  <div className="text-xs text-black mt-1">{f.desc}</div>
                  <div className="text-[10px] text-black mt-1">Eligible: {f.eligible}</div>
                </div>
              </div>
            </label>
          ))}

          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-brand-blue-800">Need help with funding?</div>
                <div className="text-xs text-brand-blue-700 mt-1">
                  Contact us at (317) 316-3077 or email info@elevateforhumanity.org. We will help you determine eligibility and connect you with the right funding source.
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">
              <CheckCircle2 className="w-4 h-4" /> Confirm Funding
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
