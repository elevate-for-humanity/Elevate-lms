'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Shield, Clock, Calendar, AlertCircle } from 'lucide-react';

const LICENSE = {
  name: 'Elevate LMS Starter License',
  slug: 'starter-license',
  price: 299,
  trialDays: 14,
  features: [
    'Complete Next.js codebase',
    'Single site deployment',
    '1 year of updates',
    'Email support',
    'Documentation access',
  ],
};

export default function StarterTrialPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [company, setCompany] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + LICENSE.trialDays);

  const handleStartTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/trial/start-managed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName: orgName.trim() || company.trim() || name.trim(),
          adminName: name.trim(),
          adminEmail: email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message =
          res.status === 409 && data.tenantUrl
            ? `A trial already exists for this email. Open your dashboard: ${data.tenantUrl}`
            : data.error || 'Could not start trial. Please try again.';
        setError(message);
        return;
      }

      if (data.tenantUrl) {
        window.location.href = data.tenantUrl;
        return;
      }

      setError('Trial started but no dashboard URL was returned. Check your email.');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseLicense = () => {
    window.location.href = `/store/licenses/checkout/${LICENSE.slug}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 mb-3">
            Start Your {LICENSE.trialDays}-Day Platform Trial
          </h1>
          <p className="text-lg text-slate-600">
            Full Elevate LMS access for {LICENSE.trialDays} days — no credit card. Evaluate the
            codebase license separately when you are ready.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">How it works</h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Start free today</h3>
                  <p className="text-slate-600 text-sm">
                    Provision your organization and admin dashboard instantly.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Explore everything</h3>
                  <p className="text-slate-600 text-sm">
                    Programs, enrollments, payments, and team tools — full platform access.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Buy the license when ready</h3>
                  <p className="text-slate-600 text-sm">
                    Starter license is ${LICENSE.price} one-time via secure checkout (sign-in
                    required).
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">
                    Trial ends{' '}
                    {trialEndDate.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-amber-700">
                    Platform trial does not include the downloadable codebase license.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="font-bold text-slate-900 mb-4">License includes:</h3>
              <ul className="space-y-2">
                {LICENSE.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-slate-700">
                    <Check className="w-4 h-4 text-brand-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Start platform trial</h2>
              <div className="text-right">
                <div className="text-2xl font-black text-slate-900">$0</div>
                <div className="text-sm text-slate-500">for {LICENSE.trialDays} days</div>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleStartTrial} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Organization name
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Acme Training Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company (optional)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-red-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-brand-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Starting trial…' : (
                    <>
                      <Clock className="w-5 h-5" />
                      Start {LICENSE.trialDays}-day free trial
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handlePurchaseLicense}
                className="w-full mt-3 border-2 border-slate-300 text-slate-800 py-3 rounded-lg font-semibold hover:bg-slate-50"
              >
                Buy license now (${LICENSE.price} one-time)
              </button>

              <p className="text-xs text-slate-500 text-center">
                Platform trial does not require a card. License purchase uses secure Stripe checkout
                (sign-in required).
              </p>
            </form>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Secure checkout
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Cancel anytime
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Need the full managed trial wizard?{' '}
                <Link href="/store/trial" className="text-blue-600 font-medium hover:underline">
                  Use /store/trial
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
