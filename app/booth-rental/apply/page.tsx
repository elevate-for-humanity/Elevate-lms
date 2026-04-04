'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CreditCard, Scissors, Sparkles, Flower2, Hand } from 'lucide-react';
import { BOOTH_RENTAL_TIERS, type BoothRentalDiscipline } from '@/lib/programs/pricing';

const DISCIPLINE_ICONS: Record<BoothRentalDiscipline, React.ReactNode> = {
  barber:        <Scissors className="w-5 h-5" />,
  cosmetologist: <Sparkles className="w-5 h-5" />,
  esthetician:   <Flower2 className="w-5 h-5" />,
  nail_tech:     <Hand className="w-5 h-5" />,
};

const DISCIPLINES = Object.values(BOOTH_RENTAL_TIERS);

function BoothRentalApplyInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [discipline, setDiscipline] = useState<BoothRentalDiscipline | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseState: 'IN',
    boothPreference: '',
    smsConsent: false,
  });

  // Pre-select discipline from ?discipline= param
  useEffect(() => {
    const param = searchParams.get('discipline') as BoothRentalDiscipline | null;
    if (param && BOOTH_RENTAL_TIERS[param]) setDiscipline(param);
  }, [searchParams]);

  const tier = discipline ? BOOTH_RENTAL_TIERS[discipline] : null;

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!discipline) { setError('Please select your discipline.'); return; }
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!formData.licenseNumber) {
      setError('A valid state license number is required to rent a booth.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/booth-rental/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discipline, ...formData }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setLoading(false); return; }
      if (data.url) window.location.href = data.url;
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/booth-rental" className="text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Booth &amp; Suite Rental Application</h1>
            <p className="text-sm text-slate-500">Elevate for Humanity — Indianapolis, IN</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Discipline selector */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-4">Select Your Discipline</h2>
          <div className="grid grid-cols-2 gap-3">
            {DISCIPLINES.map((t) => (
              <button
                key={t.discipline}
                onClick={() => setDiscipline(t.discipline)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  discipline === t.discipline
                    ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-900'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span className={discipline === t.discipline ? 'text-brand-blue-600' : 'text-slate-400'}>
                  {DISCIPLINE_ICONS[t.discipline]}
                </span>
                <div>
                  <div className="font-semibold text-sm">{t.label}</div>
                  <div className="text-xs text-slate-500">{t.spaceType}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Pricing summary — shown once discipline selected */}
        {tier && (
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-5">
            <h3 className="font-bold text-brand-blue-900 mb-3">{tier.label} {tier.spaceType} — Rate Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-blue-700">Weekly rent</span>
                <span className="font-bold text-brand-blue-900">${tier.weeklyRateDollars}/week</span>
              </div>
              {tier.depositDollars > 0 && (
                <div className="flex justify-between">
                  <span className="text-brand-blue-700">Security deposit (1 week, due today)</span>
                  <span className="font-bold text-brand-blue-900">${tier.depositDollars}</span>
                </div>
              )}
              {tier.depositDollars === 0 && (
                <div className="flex justify-between">
                  <span className="text-brand-blue-700">Security deposit</span>
                  <span className="font-bold text-emerald-700">None</span>
                </div>
              )}
              <div className="flex justify-between border-t border-brand-blue-200 pt-2 mt-2">
                <span className="text-brand-blue-700">Due today</span>
                <span className="font-black text-brand-blue-900 text-base">
                  ${tier.depositDollars > 0 ? tier.depositDollars : tier.weeklyRateDollars}
                  {tier.depositDollars > 0 ? ' deposit' : ' (first week)'}
                </span>
              </div>
              <p className="text-xs text-brand-blue-600 mt-2">
                Weekly rent of ${tier.weeklyRateDollars} charged automatically every Friday.
                Card on file required. $25 late fee + $10/day after 5 days past due.
              </p>
            </div>
          </div>
        )}

        {/* Personal info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Your Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={e => updateField('firstName', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                placeholder="First"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={e => updateField('lastName', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                placeholder="Last"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => updateField('email', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => updateField('phone', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              placeholder="(317) 000-0000"
            />
          </div>
        </div>

        {/* License info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-900">State License</h2>
          <p className="text-sm text-slate-500">A valid, active state license is required to rent a booth or suite.</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">License Number *</label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={e => updateField('licenseNumber', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                placeholder="IN-XXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
              <select
                value={formData.licenseState}
                onChange={e => updateField('licenseState', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              >
                <option value="IN">Indiana</option>
                <option value="IL">Illinois</option>
                <option value="OH">Ohio</option>
                <option value="KY">Kentucky</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Booth / Station Preference (optional)</label>
            <input
              type="text"
              value={formData.boothPreference}
              onChange={e => updateField('boothPreference', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              placeholder="e.g. near window, station 3, no preference"
            />
          </div>
        </div>

        {/* SMS consent */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.smsConsent}
              onChange={e => updateField('smsConsent', e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
            />
            <span className="text-sm text-slate-600">
              I agree to receive SMS notifications about my rental account, payment reminders, and important notices from Elevate for Humanity. Message and data rates may apply. Reply STOP to opt out.
            </span>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !discipline}
          className="w-full bg-brand-blue-700 hover:bg-brand-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
          ) : (
            <><CreditCard className="w-5 h-5" /> Continue to Payment</>
          )}
        </button>

        <p className="text-xs text-center text-slate-400">
          By continuing you agree to the Booth Rental Agreement. Your card will be saved for automatic weekly billing.
          You will review and sign the rental agreement before your first charge.
        </p>
      </div>
    </div>
  );
}

export default function BoothRentalApplyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>}>
      <BoothRentalApplyInner />
    </Suspense>
  );
}
