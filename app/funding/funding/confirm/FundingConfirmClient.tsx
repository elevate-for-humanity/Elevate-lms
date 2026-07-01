'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const FUNDING_OPTIONS = [
  {
    id: 'self_pay',
    label: 'Self-Pay',
    description: 'I am paying tuition out of pocket or through a payment plan.',
  },
  {
    id: 'wioa',
    label: 'WIOA / WorkOne',
    description: 'I have been approved for Workforce Innovation and Opportunity Act funding through WorkOne.',
  },
  {
    id: 'wrg',
    label: 'Workforce Ready Grant',
    description: 'I am applying for the Indiana Workforce Ready Grant (free tuition for eligible residents).',
  },
  {
    id: 'employer',
    label: 'Employer Sponsored',
    description: 'My employer is covering tuition costs.',
  },
  {
    id: 'scholarship',
    label: 'Scholarship / Grant',
    description: 'I have been awarded a scholarship or grant to cover tuition.',
  },
  {
    id: 'unsure',
    label: 'Not Sure Yet',
    description: 'I need help figuring out my funding options.',
  },
];

interface Props {
  currentFundingSource: string | null;
  alreadyConfirmed: boolean;
}

export default function FundingConfirmClient({ currentFundingSource, alreadyConfirmed }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentFundingSource ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    if (!selected) {
      setError('Please select a funding source.');
      return;
    }
    setSaving(true);
    setError('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login?redirect=/funding/confirm'); return; }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        funding_source: selected,
        funding_confirmed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      setError('Failed to save. Please try again.');
      setSaving(false);
      return;
    }

    router.push('/onboarding/learner');
  }

  if (alreadyConfirmed && currentFundingSource) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Funding Confirmed</h1>
          <p className="text-slate-600 mb-6">
            Your funding source is set to <strong>{FUNDING_OPTIONS.find(o => o.id === currentFundingSource)?.label ?? currentFundingSource}</strong>.
          </p>
          <Link
            href="/onboarding/learner"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition"
          >
            Back to Onboarding <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link
          href="/onboarding/learner"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Onboarding
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Confirm Your Funding Source</h1>
        <p className="text-slate-600 mb-8">
          Select how your training will be funded. This helps us connect you with the right support services.
        </p>

        <div className="space-y-3 mb-8">
          {FUNDING_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(opt.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition ${
                selected === opt.id
                  ? 'border-brand-blue-600 bg-brand-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                  selected === opt.id ? 'border-brand-blue-600 bg-brand-blue-600' : 'border-slate-300'
                }`}>
                  {selected === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{opt.label}</p>
                  <p className="text-sm text-slate-600 mt-0.5">{opt.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleConfirm}
          disabled={saving || !selected}
          className="w-full py-4 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
        >
          {saving ? 'Saving…' : 'Confirm Funding Source'}
          {!saving && <ArrowRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
