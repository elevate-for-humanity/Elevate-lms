'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, ArrowRight, CheckCircle, CreditCard, DollarSign, Building2, Users } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type FundingSource = 'wioa' | 'wrg' | 'employer' | 'self_pay';

interface FundingOption {
  id: FundingSource;
  title: string;
  description: string;
  details: string;
  icon: React.ElementType;
  badge?: string;
}

const FUNDING_OPTIONS: FundingOption[] = [
  {
    id: 'wioa',
    title: 'WIOA (Workforce Innovation and Opportunity Act)',
    description: 'Federal workforce funding for eligible job seekers.',
    details:
      'Covers full tuition for qualifying individuals. Eligibility is based on income, employment status, and other factors. You must be referred by WorkOne Indiana.',
    icon: Users,
    badge: 'Most Common',
  },
  {
    id: 'wrg',
    title: 'Workforce Ready Grant',
    description: 'Indiana state grant for high-demand career training.',
    details:
      'Covers tuition for Indiana residents pursuing credentials in high-demand fields. No repayment required. Apply through the Indiana Commission for Higher Education.',
    icon: Building2,
    badge: 'Indiana Residents',
  },
  {
    id: 'employer',
    title: 'Employer Sponsorship',
    description: 'Your employer is covering your training costs.',
    details:
      'If your employer has agreed to sponsor your training, select this option. You will need to provide your employer\'s name and contact information for verification.',
    icon: Building2,
  },
  {
    id: 'self_pay',
    title: 'Self-Pay',
    description: 'Paying out of pocket — payment plans available.',
    details:
      'Pay tuition directly. We offer flexible payment plans including weekly installments. BNPL options (Afterpay, Klarna) available at checkout.',
    icon: CreditCard,
  },
];

export default function FundingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<FundingSource | null>(null);
  const [employerName, setEmployerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login?redirect=/onboarding/learner/funding'); return; }
      supabase
        .from('profiles')
        .select('funding_confirmed, funding_source')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.funding_confirmed && data?.funding_source) {
            setSelected(data.funding_source as FundingSource);
            setAlreadyConfirmed(true);
          }
        });
    });
  }, [router]);

  const handleConfirm = async () => {
    if (!selected) { setError('Please select a funding source.'); return; }
    if (selected === 'employer' && !employerName.trim()) {
      setError('Please enter your employer name.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/onboarding/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'funding',
          data: {
            funding_source: selected,
            employer_name: selected === 'employer' ? employerName.trim() : undefined,
          },
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? 'Failed to save');
      }
      router.push('/onboarding/learner?step=funding');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Onboarding', href: '/onboarding/learner' },
          { label: 'Confirm Funding Source' },
        ]}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link
          href="/onboarding/learner"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Onboarding
        </Link>

        <div className="mb-8">
          <p className="text-brand-blue-600 text-sm font-semibold uppercase tracking-wider mb-1">
            Step 3 of 7
          </p>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Confirm Your Funding Source</h1>
          <p className="text-slate-500">
            Let us know how your training will be funded. This helps us prepare the right paperwork
            and connect you with available financial assistance.
          </p>
        </div>

        {alreadyConfirmed && (
          <div className="flex items-center gap-2 bg-brand-green-50 border border-brand-green-200 rounded-xl px-4 py-3 mb-6 text-brand-green-800 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Funding source already confirmed. You can update it below if needed.
          </div>
        )}

        <div className="space-y-3 mb-6">
          {FUNDING_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => { setSelected(opt.id); setError(''); }}
                className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                  isSelected
                    ? 'border-brand-blue-600 bg-brand-blue-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-lg ${isSelected ? 'bg-brand-blue-100' : 'bg-slate-100'}`}>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-blue-600' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-sm ${isSelected ? 'text-brand-blue-700' : 'text-slate-800'}`}>
                        {opt.title}
                      </span>
                      {opt.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-green-100 text-brand-green-700 uppercase tracking-wide">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                    {isSelected && (
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{opt.details}</p>
                    )}
                  </div>
                  <div className={`mt-1 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    isSelected ? 'border-brand-blue-600 bg-brand-blue-600' : 'border-slate-300'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selected === 'employer' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Employer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={employerName}
              onChange={(e) => setEmployerName(e.target.value)}
              placeholder="e.g. ABC Barbershop"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
            />
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleConfirm}
            disabled={saving || !selected}
            className="flex items-center gap-2 px-6 py-3 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition"
          >
            {saving ? 'Saving…' : 'Confirm Funding Source'}
            {!saving && <ArrowRight className="w-4 h-4" />}
          </button>
          <Link
            href="/onboarding/learner"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Skip for now
          </Link>
        </div>

        <p className="text-xs text-slate-400 mt-4">
          Not sure which applies to you?{' '}
          <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="underline">Call {PLATFORM_DEFAULTS.supportPhone}</a> and we&apos;ll help you figure it out.
        </p>
      </div>
    </div>
  );
}
