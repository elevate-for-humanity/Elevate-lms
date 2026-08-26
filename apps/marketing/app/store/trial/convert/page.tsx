'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Loader2, Shield, Users, Zap, BookOpen } from 'lucide-react';

interface TrialInfo {
  id: string;
  email: string;
  organization_name: string;
  organization_type: string;
  plan_id: string;
  status: 'pending' | 'converted' | 'expired';
  expires_at: string;
  converted_at?: string;
}

const PLANS = [
  {
    id: 'solo',
    name: 'Solo Practitioner',
    priceMonthly: 29,
    priceAnnual: 290,
    features: [
      { icon: Users, text: '1 admin user' },
      { icon: BookOpen, text: 'Up to 10 students' },
      { icon: Zap, text: 'Basic AI Assistant' },
      { icon: Shield, text: 'Basic compliance tracking' },
    ],
    recommended: false,
  },
  {
    id: 'business',
    name: 'Business Platform',
    priceMonthly: 99,
    priceAnnual: 990,
    features: [
      { icon: Users, text: '5 admin users' },
      { icon: BookOpen, text: 'Up to 100 students' },
      { icon: Zap, text: 'AI Tutor & Assistant' },
      { icon: Shield, text: 'WIOA compliance tracking' },
    ],
    recommended: true,
  },
  {
    id: 'professional',
    name: 'Professional License',
    priceMonthly: 299,
    priceAnnual: 2990,
    features: [
      { icon: Users, text: 'Unlimited admin users' },
      { icon: BookOpen, text: 'Unlimited students' },
      { icon: Zap, text: 'Full AI Suite' },
      { icon: Shield, text: 'Enterprise compliance' },
    ],
    recommended: false,
  },
];

export default function TrialConvertPage() {
  const [trial, setTrial] = useState<TrialInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('business');
  const [interval, setInterval] = useState<'month' | 'year'>('year');
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get trial ID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const trialId = urlParams.get('trial_id');

    if (trialId) {
      fetch(`/api/trials/convert?trialId=${trialId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.trials?.length > 0) {
            setTrial(data.trials[0]);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleConvert = async () => {
    if (!trial) return;
    
    setConverting(true);
    setError(null);

    try {
      const res = await fetch('/api/stripe/trial-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trialId: trial.id,
          plan: selectedPlan,
          interval,
          email: trial.email,
          organizationName: trial.organization_name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start conversion');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      setError(err.message);
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!trial) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Trial Not Found</h1>
          <p className="text-slate-600 mb-6">We couldn&apos;t find your trial information.</p>
          <Link href="/store" className="text-green-600 font-semibold hover:underline">
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  if (trial.status === 'converted') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Trial Converted!</h1>
          <p className="text-slate-600 mb-6">
            Your trial has been successfully converted to a paid subscription. Welcome to {trial.organization_name}!
          </p>
          <Link href="/portals" className="inline-flex items-center gap-2 bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700">
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const daysLeft = Math.ceil((new Date(trial.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Convert Your Trial</h1>
          <p className="text-green-100 text-lg mb-6">
            {trial.organization_name} - {daysLeft > 0 ? `${daysLeft} days left` : 'Trial expired'}
          </p>
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
            <Shield className="w-4 h-4" />
            <span className="text-sm">14-day money-back guarantee</span>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-white">
            <button
              onClick={() => setInterval('month')}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${
                interval === 'month' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('year')}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${
                interval === 'year' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Annual
              <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`bg-white rounded-xl p-6 border-2 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'border-green-600 shadow-lg'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {plan.recommended && (
                <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block">
                  MOST POPULAR
                </span>
              )}
              <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold text-slate-900">
                  ${interval === 'year' ? plan.priceAnnual : plan.priceMonthly}
                </span>
                <span className="text-slate-500">
                  /{interval === 'year' ? 'year' : 'month'}
                </span>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                    <feature.icon className="w-4 h-4 text-green-600" />
                    {feature.text}
                  </li>
                ))}
              </ul>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === plan.id
                    ? 'border-green-600 bg-green-600'
                    : 'border-slate-300'
                }`}
              >
                {selectedPlan === plan.id && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <button
            onClick={handleConvert}
            disabled={converting}
            className="inline-flex items-center gap-2 bg-green-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {converting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Convert to {PLANS.find((p) => p.id === selectedPlan)?.name}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          <p className="text-slate-500 text-sm mt-4">
            You won&apos;t be charged until the trial ends. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
